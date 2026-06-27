-- =============================================================================
-- Weekly Draw Entry System  (Issue #33)
-- -----------------------------------------------------------------------------
-- Rewards EVERY completed Gr8Day deed with weekly-draw entries, not just bingos.
-- Bingos become a configurable BONUS on top.
--
-- Design notes (see docs/weekly-draw-entry-system.md for the full write-up):
--   * "Balances, not tickets": per-player counters live in player_draw_balances.
--     We never create one row per entry.
--   * The ledger (draw_entry_ledger) stores ONE row per EVENT (deed awarded,
--     bonus awarded, reversal, expiry, win-reset, adjustment). It is both the
--     audit trail AND the idempotency mechanism. It is bounded by the number of
--     deeds completed, not by the number of entries.
--   * Idempotency comes from a UNIQUE index on (event_type, source_event_id):
--     the same completed-deed id / bingo event / draw id can only be applied
--     once. All mutation goes through SECURITY DEFINER plpgsql functions that
--     lock the player's balance row, so concurrent / duplicate processing is
--     safe by construction.
--   * Lifetime entries only ever INCREASE (on award). Reversals, winner-resets
--     and inactivity expiry reduce ACTIVE entries only; lifetime is the earned
--     history and is never decremented. (Matches rules 6 & 7.)
-- =============================================================================

-- ── 1. Per-player balances (the "wallet" of draw entries) ────────────────────
CREATE TABLE IF NOT EXISTS player_draw_balances (
  player_id               TEXT        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  active_entries          BIGINT      NOT NULL DEFAULT 0 CHECK (active_entries  >= 0),
  lifetime_entries        BIGINT      NOT NULL DEFAULT 0 CHECK (lifetime_entries >= 0),
  this_week_entries       BIGINT      NOT NULL DEFAULT 0 CHECK (this_week_entries >= 0),
  this_week_year          TEXT,        -- the week_year that this_week_entries belongs to
  last_draw_win_date      TIMESTAMPTZ,
  last_participation_date TIMESTAMPTZ, -- last time the player completed any deed
  last_entry_earned_date  TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pdb_active_idx        ON player_draw_balances (active_entries);
CREATE INDEX IF NOT EXISTS pdb_participation_idx ON player_draw_balances (last_participation_date);

-- ── 2. Event ledger (audit trail + idempotency) ──────────────────────────────
CREATE TABLE IF NOT EXISTS draw_entry_ledger (
  id                     BIGSERIAL   PRIMARY KEY,
  player_id              TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id               TEXT        REFERENCES users(id) ON DELETE SET NULL,
  event_type             TEXT        NOT NULL CHECK (event_type IN (
                            'deed_entry','quick_tap_entry','bingo_bonus',
                            'deed_reversal','bingo_reversal','manual_adjust',
                            'winner_reset','inactive_expired',
                            'draw_winner_selected','setting_change')),
  source_type            TEXT,        -- 'deed' | 'bingo' | 'admin' | 'system' | 'draw' | 'setting'
  source_event_id        TEXT,        -- idempotency discriminator (see unique index below)
  amount                 BIGINT      NOT NULL DEFAULT 0,  -- + added, - removed
  previous_balance       BIGINT      NOT NULL DEFAULT 0,
  new_balance            BIGINT      NOT NULL DEFAULT 0,
  week_year              TEXT,
  reason                 TEXT,
  related_deed_id        BIGINT,      -- completed_deeds.id
  related_bingo_card_id  INTEGER,     -- player_cards.id
  related_draw_id        UUID,        -- draw_winners.id
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS del_player_idx  ON draw_entry_ledger (player_id);
CREATE INDEX IF NOT EXISTS del_event_idx   ON draw_entry_ledger (event_type);
CREATE INDEX IF NOT EXISTS del_week_idx     ON draw_entry_ledger (week_year);
CREATE INDEX IF NOT EXISTS del_created_idx ON draw_entry_ledger (created_at);
CREATE INDEX IF NOT EXISTS del_deed_idx    ON draw_entry_ledger (related_deed_id);

-- The heart of idempotency: a given (event_type, source_event_id) can occur once.
-- Award events use the completed-deed id or a card:week key; reversals reuse the
-- same source_event_id under a different event_type so they coexist but neither
-- can be applied twice.
CREATE UNIQUE INDEX IF NOT EXISTS uq_draw_ledger_event_source
  ON draw_entry_ledger (event_type, source_event_id)
  WHERE source_event_id IS NOT NULL;

-- ── 3. Extend draw_winners with reporting columns (kept backward-compatible) ──
ALTER TABLE draw_winners ADD COLUMN IF NOT EXISTS winning_active_entries BIGINT;
ALTER TABLE draw_winners ADD COLUMN IF NOT EXISTS total_pool_entries     BIGINT;
ALTER TABLE draw_winners ADD COLUMN IF NOT EXISTS eligible_players       INTEGER;

-- =============================================================================
-- 4. Core mutation primitive
-- -----------------------------------------------------------------------------
-- Every balance change goes through this. It is idempotent (ON CONFLICT on the
-- unique index) and concurrency-safe (locks the balance row). Returns the new
-- ledger row id, or NULL when the event was a duplicate (no-op).
-- =============================================================================
CREATE OR REPLACE FUNCTION draw_apply(
  p_player          TEXT,
  p_event_type      TEXT,
  p_source_type     TEXT,
  p_source_event_id TEXT,
  p_amount          BIGINT,
  p_week_year       TEXT,
  p_reason          TEXT,
  p_admin           TEXT    DEFAULT NULL,
  p_deed_id         BIGINT  DEFAULT NULL,
  p_card_id         INTEGER DEFAULT NULL,
  p_draw_id         UUID    DEFAULT NULL,
  p_touch_participation BOOLEAN DEFAULT FALSE,  -- award events count as participation
  p_event_ts        TIMESTAMPTZ DEFAULT now()  -- overridable for backfill
) RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_prev    BIGINT;
  v_new     BIGINT;
  v_ledger  BIGINT;
  v_is_award BOOLEAN := p_event_type IN ('deed_entry','quick_tap_entry','bingo_bonus','manual_adjust');
BEGIN
  -- Ensure the balance row exists, then lock it so concurrent awards serialize.
  INSERT INTO player_draw_balances (player_id) VALUES (p_player)
  ON CONFLICT (player_id) DO NOTHING;

  SELECT active_entries INTO v_prev
    FROM player_draw_balances WHERE player_id = p_player FOR UPDATE;

  -- Roll the this-week counter if we've crossed into a new week.
  IF p_week_year IS NOT NULL THEN
    UPDATE player_draw_balances
       SET this_week_entries = 0, this_week_year = p_week_year
     WHERE player_id = p_player
       AND (this_week_year IS DISTINCT FROM p_week_year);
  END IF;

  v_new := GREATEST(v_prev + p_amount, 0);  -- active never goes negative

  -- Insert the ledger row. A duplicate (event_type, source_event_id) is a no-op.
  INSERT INTO draw_entry_ledger (
    player_id, admin_id, event_type, source_type, source_event_id,
    amount, previous_balance, new_balance, week_year, reason,
    related_deed_id, related_bingo_card_id, related_draw_id, created_at
  ) VALUES (
    p_player, p_admin, p_event_type, p_source_type, p_source_event_id,
    p_amount, v_prev, v_new, p_week_year, p_reason,
    p_deed_id, p_card_id, p_draw_id, p_event_ts
  )
  ON CONFLICT (event_type, source_event_id) WHERE source_event_id IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_ledger;

  IF v_ledger IS NULL THEN
    RETURN NULL;  -- duplicate event; balance untouched
  END IF;

  -- Apply the balance change now that we know the event is new.
  UPDATE player_draw_balances
     SET active_entries   = v_new,
         lifetime_entries = lifetime_entries + GREATEST(p_amount, 0),  -- earned only
         this_week_entries = GREATEST(this_week_entries + p_amount, 0),
         last_entry_earned_date  = CASE WHEN v_is_award AND p_amount > 0
                                        THEN p_event_ts ELSE last_entry_earned_date END,
         last_participation_date = CASE WHEN p_touch_participation
                                        THEN p_event_ts ELSE last_participation_date END,
         last_draw_win_date      = CASE WHEN p_event_type = 'winner_reset'
                                        THEN p_event_ts ELSE last_draw_win_date END,
         updated_at = now()
   WHERE player_id = p_player;

  RETURN v_ledger;
END;
$$;

-- =============================================================================
-- 5. Public wrappers (called from the edge functions via supabase.rpc)
-- =============================================================================

-- Award a single deed's entry. Idempotent on the completed_deeds id.
CREATE OR REPLACE FUNCTION draw_award_deed(
  p_completed_deed_id BIGINT,
  p_player            TEXT,
  p_week_year         TEXT,
  p_per_deed          BIGINT,
  p_is_quick          BOOLEAN DEFAULT FALSE,
  p_event_ts          TIMESTAMPTZ DEFAULT now()
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_per_deed <= 0 THEN RETURN NULL; END IF;
  RETURN draw_apply(
    p_player          => p_player,
    p_event_type      => CASE WHEN p_is_quick THEN 'quick_tap_entry' ELSE 'deed_entry' END,
    p_source_type     => 'deed',
    p_source_event_id => p_completed_deed_id::text,
    p_amount          => p_per_deed,
    p_week_year       => p_week_year,
    p_reason          => CASE WHEN p_is_quick THEN 'Quick Tap deed completed'
                              ELSE 'Bingo-card deed completed' END,
    p_deed_id         => p_completed_deed_id,
    p_touch_participation => TRUE,
    p_event_ts        => p_event_ts
  );
END;
$$;

-- Award the bingo bonus. Idempotent per (card, week): re-marking can't double-pay.
CREATE OR REPLACE FUNCTION draw_award_bingo(
  p_player    TEXT,
  p_card_id   INTEGER,
  p_week_year TEXT,
  p_bonus     BIGINT,
  p_event_ts  TIMESTAMPTZ DEFAULT now()
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_bonus <= 0 THEN RETURN NULL; END IF;
  RETURN draw_apply(
    p_player          => p_player,
    p_event_type      => 'bingo_bonus',
    p_source_type     => 'bingo',
    p_source_event_id => 'card:' || p_card_id || ':week:' || p_week_year,
    p_amount          => p_bonus,
    p_week_year       => p_week_year,
    p_reason          => 'Bingo completed — bonus entries',
    p_card_id         => p_card_id,
    p_event_ts        => p_event_ts
  );
END;
$$;

-- Reverse a deed's entry. Looks up the original award to mirror its amount/week.
CREATE OR REPLACE FUNCTION draw_reverse_deed(
  p_completed_deed_id BIGINT,
  p_admin             TEXT,
  p_reason            TEXT DEFAULT 'Deed reversed by admin'
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  o RECORD;
BEGIN
  SELECT * INTO o FROM draw_entry_ledger
   WHERE event_type IN ('deed_entry','quick_tap_entry')
     AND source_event_id = p_completed_deed_id::text
   LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;  -- nothing was ever awarded

  RETURN draw_apply(
    p_player          => o.player_id,
    p_event_type      => 'deed_reversal',
    p_source_type     => 'deed',
    p_source_event_id => p_completed_deed_id::text,   -- same id, different event_type
    p_amount          => -o.amount,
    p_week_year       => o.week_year,
    p_reason          => p_reason,
    p_admin           => p_admin,
    p_deed_id         => p_completed_deed_id
  );
END;
$$;

-- Reverse a bingo bonus for a (card, week).
CREATE OR REPLACE FUNCTION draw_reverse_bingo(
  p_card_id   INTEGER,
  p_week_year TEXT,
  p_admin     TEXT,
  p_reason    TEXT DEFAULT 'Bingo reversed by admin'
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  o RECORD;
BEGIN
  SELECT * INTO o FROM draw_entry_ledger
   WHERE event_type = 'bingo_bonus'
     AND source_event_id = 'card:' || p_card_id || ':week:' || p_week_year
   LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  RETURN draw_apply(
    p_player          => o.player_id,
    p_event_type      => 'bingo_reversal',
    p_source_type     => 'bingo',
    p_source_event_id => 'card:' || p_card_id || ':week:' || p_week_year,
    p_amount          => -o.amount,
    p_week_year       => o.week_year,
    p_reason          => p_reason,
    p_admin           => p_admin,
    p_card_id         => p_card_id
  );
END;
$$;

-- Manual admin adjustment (no idempotency key — every call is a distinct event).
CREATE OR REPLACE FUNCTION draw_manual_adjust(
  p_player TEXT, p_admin TEXT, p_amount BIGINT, p_reason TEXT, p_week_year TEXT DEFAULT NULL
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN draw_apply(
    p_player => p_player, p_event_type => 'manual_adjust', p_source_type => 'admin',
    p_source_event_id => NULL, p_amount => p_amount, p_week_year => p_week_year,
    p_reason => COALESCE(p_reason,'Manual adjustment'), p_admin => p_admin);
END;
$$;

-- Reset a winner's active entries to zero (idempotent per draw id).
CREATE OR REPLACE FUNCTION draw_winner_reset(
  p_player TEXT, p_draw_id UUID, p_week_year TEXT
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_active BIGINT;
BEGIN
  SELECT active_entries INTO v_active FROM player_draw_balances WHERE player_id = p_player;
  RETURN draw_apply(
    p_player => p_player, p_event_type => 'winner_reset', p_source_type => 'draw',
    p_source_event_id => p_draw_id::text, p_amount => -COALESCE(v_active,0),
    p_week_year => p_week_year, p_reason => 'Won weekly draw — active entries reset',
    p_draw_id => p_draw_id);
END;
$$;

-- Record the winner-selected audit event (no balance change).
CREATE OR REPLACE FUNCTION draw_record_selected(
  p_player TEXT, p_draw_id UUID, p_week_year TEXT, p_pool BIGINT, p_eligible INTEGER
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN draw_apply(
    p_player => p_player, p_event_type => 'draw_winner_selected', p_source_type => 'draw',
    p_source_event_id => 'selected:' || p_draw_id::text, p_amount => 0,
    p_week_year => p_week_year,
    p_reason => format('Selected as winner (pool=%s, eligible=%s)', p_pool, p_eligible),
    p_draw_id => p_draw_id);
END;
$$;

-- Expire inactive players: zero active entries for anyone whose last participation
-- is older than p_weeks. Lifetime is untouched. p_weeks <= 0 disables expiry.
CREATE OR REPLACE FUNCTION draw_expire_inactive(p_weeks INTEGER)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE r RECORD; n INTEGER := 0; v_cutoff TIMESTAMPTZ;
BEGIN
  IF p_weeks IS NULL OR p_weeks <= 0 THEN RETURN 0; END IF;
  v_cutoff := now() - make_interval(weeks => p_weeks);
  FOR r IN
    SELECT player_id, active_entries, last_participation_date
      FROM player_draw_balances
     WHERE active_entries > 0
       AND (last_participation_date IS NULL OR last_participation_date < v_cutoff)
  LOOP
    PERFORM draw_apply(
      p_player => r.player_id, p_event_type => 'inactive_expired', p_source_type => 'system',
      -- distinct key per expiry sweep so it can fire again in a later sweep
      p_source_event_id => 'expire:' || r.player_id || ':' || to_char(now(),'YYYY-MM-DD"T"HH24:MI:SS'),
      p_amount => -r.active_entries, p_week_year => NULL,
      p_reason => format('Inactive > %s week(s) — active entries expired', p_weeks));
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

-- =============================================================================
-- 6. Settings (auto-exposed by the existing admin-settings function)
-- =============================================================================
INSERT INTO game_configs (config_key, config_value, description) VALUES
  ('weekly_draw_enabled',               '1',  'Master switch for the weekly draw (1=on, 0=off)'),
  ('deed_draw_entries_enabled',         '1',  'Award draw entries for completed deeds (1=on, 0=off)'),
  ('draw_entries_per_deed',             '1',  'Draw entries granted per completed deed'),
  ('bingo_bonus_enabled',               '1',  'Award bonus draw entries when a bingo is completed (1=on, 0=off)'),
  ('bingo_bonus_entries_per_bingo',     '10', 'Bonus draw entries granted per completed bingo'),
  ('include_quick_tap_deeds',           '1',  'Quick Tap deeds also earn draw entries (1=on, 0=off)'),
  ('allow_ticket_rollovers',            '1',  'Active draw entries roll over between weeks (1=on, 0=off)'),
  ('require_current_week_participation','1',  'Player must complete a deed this week to be eligible (1=on, 0=off)'),
  ('reset_active_after_win',            '1',  'Reset a winner''s active entries to zero (1=on, 0=off)'),
  ('inactive_entry_expiration_weeks',   '0',  'Weeks of inactivity before active entries expire (0=never; 1/2/4/8/12/custom)')
ON CONFLICT (config_key) DO NOTHING;

-- =============================================================================
-- 7. Backfill (guarded, admin-invoked): reconstruct balances from history.
--    Safe to run once; aborts if the ledger already has award rows.
-- =============================================================================
CREATE OR REPLACE FUNCTION draw_backfill_from_history()
RETURNS TABLE(deeds_awarded BIGINT, bingos_awarded BIGINT) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE r RECORD; v_per BIGINT; v_bonus BIGINT; v_inc_quick BOOLEAN;
        d BIGINT := 0; b BIGINT := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM draw_entry_ledger
              WHERE event_type IN ('deed_entry','quick_tap_entry','bingo_bonus')) THEN
    RAISE EXCEPTION 'Ledger already populated; refusing to backfill';
  END IF;

  SELECT COALESCE(config_value,'1')::BIGINT INTO v_per
    FROM game_configs WHERE config_key='draw_entries_per_deed';
  SELECT COALESCE(config_value,'10')::BIGINT INTO v_bonus
    FROM game_configs WHERE config_key='bingo_bonus_entries_per_bingo';
  SELECT COALESCE(config_value,'1')='1' INTO v_inc_quick
    FROM game_configs WHERE config_key='include_quick_tap_deeds';

  -- One entry per historical completed deed (respecting the quick-tap toggle).
  FOR r IN SELECT id, player_id, source_type, card_id, completed_at
             FROM completed_deeds WHERE is_hidden_from_impact_board = false
            ORDER BY id LOOP
    IF r.source_type = 'quick_action' AND NOT v_inc_quick THEN CONTINUE; END IF;
    PERFORM draw_award_deed(
      r.id, r.player_id, draw_week_year(r.completed_at), v_per,
      (r.source_type = 'quick_action'), r.completed_at);
    d := d + 1;
  END LOOP;

  -- One bonus per historical bingo card.
  FOR r IN SELECT id, user_id, week_year, updated_at
             FROM player_cards WHERE is_bingo = true LOOP
    PERFORM draw_award_bingo(r.user_id, r.id, r.week_year, v_bonus, r.updated_at);
    b := b + 1;
  END LOOP;

  RETURN QUERY SELECT d, b;
END;
$$;

-- ISO-week label helper in SQL (mirrors getCurrentWeekYear() in the edge code).
CREATE OR REPLACE FUNCTION draw_week_year(p_ts TIMESTAMPTZ)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT to_char(p_ts, 'IYYY') || '-W' || to_char(p_ts, 'IW');
$$;
