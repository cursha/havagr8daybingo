-- I DARE YA centre square: "Refer a Player" cadence (Curt, Jun 13 2026).
-- On a player's Nth dare spin the result is forced to Refer a Player; after
-- that it is a normal weighted outcome at ~15-20%. All table-driven.

-- Cumulative dare-spin counter per player (never resets; counts across weeks).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS dare_total_spins INTEGER NOT NULL DEFAULT 0;

-- Threshold: on the player's Nth spin, guarantee the Refer a Player outcome.
-- 0 disables forcing. Admin-editable.
INSERT INTO game_configs (config_key, config_value, description, updated_at)
VALUES (
  'dare_refer_forced_spin', '3',
  'On a player''s Nth I DARE YA spin, force the Refer a Player outcome (0 = never force).',
  NOW()
)
ON CONFLICT (config_key) DO NOTHING;

-- Normal-spin odds for Refer a Player: weight 20 of ~110 total ≈ 18% (in Curt's
-- 15-20% range). weight:amount format; admin can tune anytime.
UPDATE game_configs
SET config_value = '20:0', updated_at = NOW()
WHERE config_key = 'dare_outcome_refer_player';
