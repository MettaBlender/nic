-- Migration: Upgrade from position-based to grid-based system
-- Add grid columns to blocks table

-- Step 1: Add new grid columns
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS grid_col INTEGER DEFAULT 0;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS grid_row INTEGER DEFAULT 0;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS grid_width INTEGER DEFAULT 2;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS grid_height INTEGER DEFAULT 1;

-- Step 2: Add rows column to pages table
ALTER TABLE pages ADD COLUMN IF NOT EXISTS rows INTEGER DEFAULT 12;

-- Step 3: Convert existing position_x/position_y to grid_col/grid_row
UPDATE blocks SET
  grid_col = CAST(position_x / 8.33 AS INTEGER), -- 100/12 = 8.33% per column
  grid_row = CAST(position_y / 10 AS INTEGER),   -- approx. 10% per row
  grid_width = GREATEST(1, CAST(width / 8.33 AS INTEGER)),
  grid_height = GREATEST(1, CAST(height / 10 AS INTEGER))
WHERE grid_col IS NULL OR grid_row IS NULL;

-- Step 4: Set default values for NULL values
UPDATE blocks SET grid_col = 0 WHERE grid_col IS NULL;
UPDATE blocks SET grid_row = 0 WHERE grid_row IS NULL;
UPDATE blocks SET grid_width = 2 WHERE grid_width IS NULL OR grid_width < 1;
UPDATE blocks SET grid_height = 1 WHERE grid_height IS NULL OR grid_height < 1;

-- Step 5: Add NOT NULL constraints
ALTER TABLE blocks ALTER COLUMN grid_col SET NOT NULL;
ALTER TABLE blocks ALTER COLUMN grid_row SET NOT NULL;
ALTER TABLE blocks ALTER COLUMN grid_width SET NOT NULL;
ALTER TABLE blocks ALTER COLUMN grid_height SET NOT NULL;

-- Optional: Delete old columns after successful migration
-- ALTER TABLE blocks DROP COLUMN IF EXISTS position_x;
-- ALTER TABLE blocks DROP COLUMN IF EXISTS position_y;
-- ALTER TABLE blocks DROP COLUMN IF EXISTS width;
-- ALTER TABLE blocks DROP COLUMN IF EXISTS height;
-- ALTER TABLE blocks DROP COLUMN IF EXISTS rotation;
-- ALTER TABLE blocks DROP COLUMN IF EXISTS scale_x;
-- ALTER TABLE blocks DROP COLUMN IF EXISTS scale_y;
-- ALTER TABLE blocks DROP COLUMN IF EXISTS order_index;
