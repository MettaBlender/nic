-- Migration: Upgrade from position-based to grid-based system
-- Add grid columns to blocks table (PostgreSQL-kompatibel)

-- Step 1: Add new grid columns if they don't exist
ALTER TABLE IF EXISTS blocks ADD COLUMN IF NOT EXISTS grid_col INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS blocks ADD COLUMN IF NOT EXISTS grid_row INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS blocks ADD COLUMN IF NOT EXISTS grid_width INTEGER DEFAULT 2;
ALTER TABLE IF EXISTS blocks ADD COLUMN IF NOT EXISTS grid_height INTEGER DEFAULT 1;

-- Step 2: Add rows column to pages table if it doesn't exist
ALTER TABLE IF EXISTS pages ADD COLUMN IF NOT EXISTS rows INTEGER DEFAULT 12;

-- Step 3: Convert existing position_x/position_y to grid_col/grid_row (nur wenn alte Spalten noch existieren)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='blocks' AND column_name='position_x'
    ) THEN
        UPDATE blocks SET
          grid_col = CAST(COALESCE(position_x, 0) / 8.33 AS INTEGER),
          grid_row = CAST(COALESCE(position_y, 0) / 10 AS INTEGER),
          grid_width = GREATEST(1, CAST(COALESCE(width, 20) / 8.33 AS INTEGER)),
          grid_height = GREATEST(1, CAST(COALESCE(height, 20) / 10 AS INTEGER))
        WHERE grid_col = 0 AND grid_row = 0;
    END IF;
END $$;

-- Step 4: Set default values for NULL values
UPDATE blocks SET grid_col = 0 WHERE grid_col IS NULL;
UPDATE blocks SET grid_row = 0 WHERE grid_row IS NULL;
UPDATE blocks SET grid_width = 2 WHERE grid_width IS NULL OR grid_width < 1;
UPDATE blocks SET grid_height = 1 WHERE grid_height IS NULL OR grid_height < 1;

-- Step 5: Add NOT NULL constraints if not already present
ALTER TABLE blocks ALTER COLUMN grid_col SET NOT NULL;
ALTER TABLE blocks ALTER COLUMN grid_row SET NOT NULL;
ALTER TABLE blocks ALTER COLUMN grid_width SET NOT NULL;
ALTER TABLE blocks ALTER COLUMN grid_height SET NOT NULL;

-- Optional: Delete old columns after successful migration (kommentiert aus, bitte manuell überprüfen)
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocks' AND column_name='position_x') THEN
--         ALTER TABLE blocks DROP COLUMN position_x;
--     END IF;
--     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocks' AND column_name='position_y') THEN
--         ALTER TABLE blocks DROP COLUMN position_y;
--     END IF;
--     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocks' AND column_name='width') THEN
--         ALTER TABLE blocks DROP COLUMN width;
--     END IF;
--     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocks' AND column_name='height') THEN
--         ALTER TABLE blocks DROP COLUMN height;
--     END IF;
--     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocks' AND column_name='rotation') THEN
--         ALTER TABLE blocks DROP COLUMN rotation;
--     END IF;
--     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocks' AND column_name='scale_x') THEN
--         ALTER TABLE blocks DROP COLUMN scale_x;
--     END IF;
--     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocks' AND column_name='scale_y') THEN
--         ALTER TABLE blocks DROP COLUMN scale_y;
--     END IF;
--     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocks' AND column_name='order_index') THEN
--         ALTER TABLE blocks DROP COLUMN order_index;
--     END IF;
-- END $$;
