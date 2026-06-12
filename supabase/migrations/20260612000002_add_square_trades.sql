CREATE TABLE IF NOT EXISTS square_trades (
  id SERIAL PRIMARY KEY,
  week_year TEXT NOT NULL,
  from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_card_id INTEGER NOT NULL REFERENCES player_cards(id) ON DELETE CASCADE,
  to_card_id INTEGER NOT NULL REFERENCES player_cards(id) ON DELETE CASCADE,
  from_cell_index INTEGER NOT NULL,
  to_cell_index INTEGER NOT NULL,
  from_deed_text TEXT NOT NULL,
  to_deed_text TEXT NOT NULL,
  from_deed_id INTEGER,
  to_deed_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled','expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS square_trades_from_user ON square_trades(from_user_id, week_year);
CREATE INDEX IF NOT EXISTS square_trades_to_user ON square_trades(to_user_id, week_year);
