-- Draw entries: one row per player per week when they achieve bingo
CREATE TABLE IF NOT EXISTS draw_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_year TEXT NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_year)
);

CREATE INDEX IF NOT EXISTS idx_draw_entries_week_year ON draw_entries(week_year);
CREATE INDEX IF NOT EXISTS idx_draw_entries_user_id ON draw_entries(user_id);

-- Draw winners: one row per week recording who won
CREATE TABLE IF NOT EXISTS draw_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_year TEXT NOT NULL,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  odds_weight NUMERIC NOT NULL DEFAULT 1.0,
  UNIQUE(week_year)
);

CREATE INDEX IF NOT EXISTS idx_draw_winners_user_id ON draw_winners(user_id);
CREATE INDEX IF NOT EXISTS idx_draw_winners_week_year ON draw_winners(week_year);

-- Config: how much weight recent winners get (default 5% of normal)
INSERT INTO game_configs (key, value, description) VALUES
  ('recent_winner_weight', '0.05', 'Odds multiplier for players who have won in the last 4 months (0.05 = 5% of normal weight)'),
  ('recent_winner_months', '4', 'Number of months a player is considered a recent winner and receives reduced draw odds')
ON CONFLICT (key) DO NOTHING;
