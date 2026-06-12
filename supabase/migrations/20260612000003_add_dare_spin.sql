-- dare_clicks: how many times the player has spun the dare this week.
-- Scoped per card (one row per player per week) so it resets automatically.
ALTER TABLE player_cards
  ADD COLUMN IF NOT EXISTS dare_clicks INTEGER NOT NULL DEFAULT 0;

-- Dare spin config — weights use "weight:amount" format.
-- dare_max_spins_per_week is locked to 1 (hardcoded in endpoint, this seed is informational).
INSERT INTO game_configs (config_key, config_value, description, updated_at)
VALUES
  ('dare_enabled',              'true',    'Enable the I DARE YA! centre square spin',               NOW()),
  ('dare_max_spins_per_week',   '1',       'Max dare spins per player per week (1 = one and done)',  NOW()),
  ('dare_outcome_add_funds_2',  '10:2.00', 'Dare: win $2.00 — weight:amount',                       NOW()),
  ('dare_outcome_add_funds_1',  '20:1.00', 'Dare: win $1.00 — weight:amount',                       NOW()),
  ('dare_outcome_add_funds_50', '25:0.50', 'Dare: win $0.50 — weight:amount',                       NOW()),
  ('dare_outcome_remove_funds', '20:0.50', 'Dare: lose $0.50 — weight:amount (never goes below $0)',NOW()),
  ('dare_outcome_refer_player', '10:0',    'Dare: Refer a Player prompt — weight (amount unused)',   NOW()),
  ('dare_outcome_swap_square',  '10:0',    'Dare: swap a deed (always un-marks) — weight',          NOW()),
  ('dare_outcome_nothing',      '5:0',     'Dare: no effect — weight',                              NOW())
ON CONFLICT (config_key) DO NOTHING;
