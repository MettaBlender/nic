import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

export async function POST() {
  try {
    console.log('🔄 Starting database migration to grid schema...');

    // Schritt 1: Prüfe aktuellen Zustand
    const columnsCheck = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'blocks' AND column_name IN ('grid_col', 'grid_row', 'grid_width', 'grid_height')
    `;

    const existingColumns = columnsCheck.map(row => row.column_name);
    console.log('📊 Existing grid columns:', existingColumns);

    const migrations = [];

    // Schritt 2: Füge fehlende Spalten hinzu
    if (!existingColumns.includes('grid_col')) {
      await sql`ALTER TABLE blocks ADD COLUMN grid_col INTEGER DEFAULT 0`;
      migrations.push('Added grid_col column');
    }

    if (!existingColumns.includes('grid_row')) {
      await sql`ALTER TABLE blocks ADD COLUMN grid_row INTEGER DEFAULT 0`;
      migrations.push('Added grid_row column');
    }

    if (!existingColumns.includes('grid_width')) {
      await sql`ALTER TABLE blocks ADD COLUMN grid_width INTEGER DEFAULT 2`;
      migrations.push('Added grid_width column');
    }

    if (!existingColumns.includes('grid_height')) {
      await sql`ALTER TABLE blocks ADD COLUMN grid_height INTEGER DEFAULT 1`;
      migrations.push('Added grid_height column');
    }

    // Schritt 3: Konvertiere existierende Daten
    const blocksToMigrate = await sql`
      SELECT id, position_x, position_y, width, height
      FROM blocks
      WHERE (grid_col IS NULL OR grid_row IS NULL OR grid_col = 0 AND grid_row = 0)
      AND (position_x IS NOT NULL OR position_y IS NOT NULL)
    `;

    console.log(`📦 Found ${blocksToMigrate.length} blocks to migrate`);

    for (const block of blocksToMigrate) {
      const gridCol = Math.max(0, Math.min(11, Math.floor((block.position_x || 0) / 8.33)));
      const gridRow = Math.max(0, Math.floor((block.position_y || 0) / 10));
      const gridWidth = Math.max(1, Math.min(12, Math.floor((block.width || 20) / 8.33)));
      const gridHeight = Math.max(1, Math.floor((block.height || 20) / 10));

      await sql`
        UPDATE blocks SET
          grid_col = ${gridCol},
          grid_row = ${gridRow},
          grid_width = ${gridWidth},
          grid_height = ${gridHeight}
        WHERE id = ${block.id}
      `;
    }

    if (blocksToMigrate.length > 0) {
      migrations.push(`Migrated ${blocksToMigrate.length} blocks from position to grid`);
    }

    // Schritt 4: Setze Default-Werte für NULL-Werte
    const nullUpdates = await sql`
      UPDATE blocks SET
        grid_col = COALESCE(grid_col, 0),
        grid_row = COALESCE(grid_row, 0),
        grid_width = COALESCE(grid_width, 2),
        grid_height = COALESCE(grid_height, 1)
      WHERE grid_col IS NULL OR grid_row IS NULL OR grid_width IS NULL OR grid_height IS NULL
    `;

    if (nullUpdates.count > 0) {
      migrations.push(`Fixed ${nullUpdates.count} blocks with NULL grid values`);
    }

    // Schritt 5: Erzwinge NOT NULL (optional, nur wenn alle Spalten existieren)
    try {
      if (existingColumns.length === 0) { // Nur bei komplett neuer Migration
        await sql`ALTER TABLE blocks ALTER COLUMN grid_col SET NOT NULL`;
        await sql`ALTER TABLE blocks ALTER COLUMN grid_row SET NOT NULL`;
        await sql`ALTER TABLE blocks ALTER COLUMN grid_width SET NOT NULL`;
        await sql`ALTER TABLE blocks ALTER COLUMN grid_height SET NOT NULL`;
        migrations.push('Set NOT NULL constraints on grid columns');
      }
    } catch (error) {
      console.warn('⚠️ Could not set NOT NULL constraints:', error.message);
    }

    // Schritt 6: Validierung
    const finalCheck = await sql`
      SELECT
        COUNT(*) as total_blocks,
        COUNT(grid_col) as blocks_with_grid_col,
        MIN(grid_col) as min_col,
        MAX(grid_col) as max_col,
        MIN(grid_row) as min_row,
        MAX(grid_row) as max_row
      FROM blocks
    `;

    console.log('✅ Migration completed successfully');
    console.log('📊 Final validation:', finalCheck[0]);

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      migrations,
      statistics: finalCheck[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
