-- Curt wants deeds that can be done more than 4 times. Relax the old
-- 1-4 CHECK constraint to simply require at least 1.

ALTER TABLE good_deeds DROP CONSTRAINT IF EXISTS deed_quantity_range;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deed_quantity_min') THEN
    ALTER TABLE good_deeds ADD CONSTRAINT deed_quantity_min CHECK (quantity >= 1);
  END IF;
END
$$;
