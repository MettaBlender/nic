-- Migration: Upgrade von Position-based zu Grid-based System
-- Füge Grid-Spalten zur blocks Tabelle hinzu

-- Schritt 1: Füge neue Grid-Spalten hinzu
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS grid_col INTEGER DEFAULT 0;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS grid_row INTEGER DEFAULT 0;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS grid_width INTEGER DEFAULT 2;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS grid_height INTEGER DEFAULT 1;

-- Schritt 2: Konvertiere existierende position_x/position_y zu grid_col/grid_row
UPDATE blocks SET
  grid_col = CAST(position_x / 8.33 AS INTEGER), -- 100/12 = 8.33% pro Spalte
  grid_row = CAST(position_y / 10 AS INTEGER),   -- ca. 10% pro Zeile
  grid_width = GREATEST(1, CAST(width / 8.33 AS INTEGER)),
  grid_height = GREATEST(1, CAST(height / 10 AS INTEGER))
WHERE grid_col IS NULL OR grid_row IS NULL;

-- Schritt 3: Setze Default-Werte für NULL-Werte
UPDATE blocks SET grid_col = 0 WHERE grid_col IS NULL;
UPDATE blocks SET grid_row = 0 WHERE grid_row IS NULL;
UPDATE blocks SET grid_width = 2 WHERE grid_width IS NULL OR grid_width < 1;
UPDATE blocks SET grid_height = 1 WHERE grid_height IS NULL OR grid_height < 1;

-- Schritt 4: Füge NOT NULL Constraints hinzu
ALTER TABLE blocks ALTER COLUMN grid_col SET NOT NULL;
ALTER TABLE blocks ALTER COLUMN grid_row SET NOT NULL;
ALTER TABLE blocks ALTER COLUMN grid_width SET NOT NULL;
ALTER TABLE blocks ALTER COLUMN grid_height SET NOT NULL;

-- Optional: Lösche alte Spalten nach erfolgreicher Migration
-- ALTER TABLE blocks DROP COLUMN IF EXISTS position_x;
-- ALTER TABLE blocks DROP COLUMN IF EXISTS position_y;
-- ALTER TABLE blocks DROP COLUMN IF EXISTS width;
-- ALTER TABLE blocks DROP COLUMN IF EXISTS height;
-- ALTER TABLE blocks DROP COLUMN IF EXISTS rotation;
-- ALTER TABLE blocks DROP COLUMN IF EXISTS scale_x;
-- ALTER TABLE blocks DROP COLUMN IF EXISTS scale_y;
-- ALTER TABLE blocks DROP COLUMN IF EXISTS order_index;
