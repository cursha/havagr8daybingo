-- Player profile additions:
--  challenge_level: difficulty the player wants (1-5), shown/filtered on member list
--  province_state, country: location for demonstrating worldwide impact
ALTER TABLE users ADD COLUMN IF NOT EXISTS challenge_level INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS province_state TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_challenge_level_range') THEN
    ALTER TABLE users ADD CONSTRAINT users_challenge_level_range
      CHECK (challenge_level IS NULL OR challenge_level BETWEEN 1 AND 5);
  END IF;
END
$$;
