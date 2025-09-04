import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

// Backup Funktion für Legacy-Support
export async function getDb() {
  // Diese Funktion wird für Init-Routes benötigt
  return sql;
}

// Alle Queries direkt mit der Neon-Syntax ausführen

// CRUD Operationen für Seiten
export async function getPages() {
  return await sql`SELECT * FROM pages ORDER BY created_at DESC`;
}

export async function getPageById(id) {
  const result = await sql`SELECT * FROM pages WHERE id = ${id}`;
  return result[0] || null;
}

export async function updatePageTitle(id, title) {
  const result = await sql`
    UPDATE pages SET title = ${title}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}
  `;
  return result.length > 0;
}

export async function getPageBySlug(slug) {
  const result = await sql`SELECT * FROM pages WHERE slug = ${slug}`;
  return result[0] || null;
}

export async function createPage(title, slug) {
  const result = await sql`
    INSERT INTO pages (title, slug) VALUES (${title}, ${slug}) RETURNING id
  `;
  return result[0]?.id;
}

export async function updatePage(id, title, slug) {
  return await sql`
    UPDATE pages SET title = ${title}, slug = ${slug}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}
  `;
}

export async function deletePage(id) {
  return await sql`DELETE FROM pages WHERE id = ${id}`;
}

// CRUD Operationen für Blöcke
export async function getBlocksForPage(pageId) {
  return await sql`
    SELECT * FROM blocks WHERE page_id = ${pageId} ORDER BY z_index ASC, created_at ASC
  `;
}

export async function getBlockById(id) {
  const result = await sql`SELECT * FROM blocks WHERE id = ${id}`;
  return result[0] || null;
}

export async function createBlock(pageId, blockType, gridCol, gridRow, gridWidth, gridHeight, content) {
  const result = await sql`
    INSERT INTO blocks (
      page_id, block_type, content, grid_col, grid_row, grid_width, grid_height,
      background_color, text_color, z_index
    ) VALUES (
      ${pageId}, ${blockType}, ${JSON.stringify(content)}, ${gridCol}, ${gridRow}, ${gridWidth}, ${gridHeight},
      'transparent', '#000000', 1
    )
    RETURNING *
  `;
  return result[0]; // Vollständiges Block-Objekt zurückgeben
}

export async function updateBlock(id, blockData) {
  console.log(`🔄 Updating block ${id} with data:`, blockData);

  try {
    // Extrahiere alle möglichen Felder aus blockData
    const {
      grid_col,
      grid_row,
      grid_width,
      grid_height,
      content,
      block_type,
      background_color,
      text_color,
      z_index
    } = blockData;

    // Alle Updates in einer Query mit NULL-safe updates
    const result = await sql`
      UPDATE blocks SET
        grid_col = COALESCE(${grid_col}, grid_col),
        grid_row = COALESCE(${grid_row}, grid_row),
        grid_width = COALESCE(${grid_width}, grid_width),
        grid_height = COALESCE(${grid_height}, grid_height),
        content = COALESCE(${content ? JSON.stringify(content) : null}, content),
        block_type = COALESCE(${block_type}, block_type),
        background_color = COALESCE(${background_color}, background_color),
        text_color = COALESCE(${text_color}, text_color),
        z_index = COALESCE(${z_index}, z_index),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length > 0) {
      console.log(`✅ Block ${id} updated successfully in database:`, {
        id: result[0].id,
        position: `${result[0].grid_col},${result[0].grid_row}`,
        size: `${result[0].grid_width}x${result[0].grid_height}`,
        type: result[0].block_type,
        background: result[0].background_color,
        text_color: result[0].text_color,
        z_index: result[0].z_index,
        updated_at: result[0].updated_at
      });
      return result[0]; // Gib das aktualisierte Block-Objekt zurück
    } else {
      console.warn(`⚠️ No block found with ID ${id} to update`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error updating block ${id}:`, error);
    return null;
  }
}

export async function deleteBlock(id) {
  const result = await sql`DELETE FROM blocks WHERE id = ${id}`;
  return result.length > 0;
}

export async function deleteAllBlocksForPage(pageId) {
  const result = await sql`DELETE FROM blocks WHERE page_id = ${pageId}`;
  return result.count || 0;
}

export async function createMultipleBlocks(pageId, blocksData) {
  const results = [];
  for (const blockData of blocksData) {
    const blockId = await createBlock(
      pageId,
      blockData.block_type,
      blockData.grid_col,
      blockData.grid_row,
      blockData.grid_width,
      blockData.grid_height,
      blockData.content
    );
    results.push(blockId);
  }
  return results;
}

// Layout Einstellungen
export async function getLayoutSettings() {
  const result = await sql`SELECT * FROM layout_settings ORDER BY id DESC LIMIT 1`;
  return result[0] || null;
}

export async function updateLayoutSettings(settings) {
  const {
    header_component,
    footer_component,
    background_color,
    background_image,
    primary_color,
    secondary_color
  } = settings;

  return await sql`
    UPDATE layout_settings SET
      header_component = ${header_component}, footer_component = ${footer_component},
      background_color = ${background_color}, background_image = ${background_image},
      primary_color = ${primary_color}, secondary_color = ${secondary_color},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = (SELECT MAX(id) FROM layout_settings)
  `;
}

// CMS Einstellungen
export async function getCMSSetting(key) {
  const result = await sql`SELECT value FROM cms_settings WHERE key = ${key}`;
  return result[0]?.value || null;
}

export async function setCMSSetting(key, value) {
  return await sql`
    INSERT INTO cms_settings (key, value, updated_at)
    VALUES (${key}, ${value}, CURRENT_TIMESTAMP)
    ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = CURRENT_TIMESTAMP
  `;
}

export async function updatePageRows(pageId, rows) {
  return await sql`
    UPDATE pages SET rows = ${rows} WHERE id = ${pageId}
  `;
}

export async function updateBlockContent(id, content) {
  // Content sollte bereits ein JSON-String sein von der API
  return await sql`
    UPDATE blocks SET content = ${content}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `;
}
