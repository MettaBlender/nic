import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

// Alle Queries direkt mit der Neon-Syntax ausführen

// CRUD Operationen für Seiten
export async function getPages() {
  return await sql`SELECT * FROM pages ORDER BY created_at DESC`;
}

export async function getPage(id) {
  const result = await sql`SELECT * FROM pages WHERE id = ${id}`;
  return result[0] || null;
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
export async function getBlocks(pageId) {
  return await sql`
    SELECT * FROM blocks WHERE page_id = ${pageId} ORDER BY z_index ASC, order_index ASC
  `;
}

export async function createBlock(blockData) {
  const {
    page_id,
    block_type,
    content = '',
    position_x = 0,
    position_y = 0,
    width = 20,
    height = 20,
    rotation = 0,
    scale_x = 1,
    scale_y = 1,
    z_index = 1,
    background_color = '#ffffff',
    text_color = '#000000',
    order_index = 0
  } = blockData;

  const result = await sql`
    INSERT INTO blocks (
      page_id, block_type, content, position_x, position_y, width, height,
      rotation, scale_x, scale_y, z_index, background_color, text_color, order_index
    ) VALUES (
      ${page_id}, ${block_type}, ${content}, ${position_x}, ${position_y}, ${width}, ${height},
      ${rotation}, ${scale_x}, ${scale_y}, ${z_index}, ${background_color}, ${text_color}, ${order_index}
    )
    RETURNING id
  `;

  return result[0]?.id;
}

export async function updateBlock(id, blockData) {
  const {
    content,
    position_x,
    position_y,
    width,
    height,
    rotation,
    scale_x,
    scale_y,
    z_index,
    background_color,
    text_color,
    order_index
  } = blockData;

  return await sql`
    UPDATE blocks SET
      content = ${content}, position_x = ${position_x}, position_y = ${position_y},
      width = ${width}, height = ${height}, rotation = ${rotation},
      scale_x = ${scale_x}, scale_y = ${scale_y}, z_index = ${z_index},
      background_color = ${background_color}, text_color = ${text_color},
      order_index = ${order_index}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `;
}

export async function deleteBlock(id) {
  return await sql`DELETE FROM blocks WHERE id = ${id}`;
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
