import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nic_cms',
  // SSL nur in Produktion
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Query-Funktion die ähnlich wie Neon funktioniert
async function sql(strings, ...values) {
  const query = strings.join('?');
  const client = await pool.connect();
  try {
    const result = await client.query(query.replace(/\?/g, (_, i) => `$${i + 1}`), values);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getDb() {
  // This function is required for init routes
  return { query: (query, values) => pool.query(query, values) };
}

// Execute all queries directly with PostgreSQL syntax

// CRUD Operations for Pages
export async function getPages() {
  const client = await pool.connect();
  try {
    return (await client.query('SELECT * FROM pages ORDER BY created_at DESC')).rows;
  } finally {
    client.release();
  }
}

export async function getPageById(id) {
  const client = await pool.connect();
  try {
    const result = (await client.query('SELECT * FROM pages WHERE id = $1', [id])).rows;
    return result[0] || null;
  } finally {
    client.release();
  }
}

export async function updatePageTitle(id, title) {
  const client = await pool.connect();
  try {
    const result = (await client.query('UPDATE pages SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [title, id])).rows;
    return result.length > 0;
  } finally {
    client.release();
  }
}

export async function getPageBySlug(slug) {
  const client = await pool.connect();
  try {
    const result = (await client.query('SELECT * FROM pages WHERE slug = $1', [slug])).rows;
    return result[0] || null;
  } finally {
    client.release();
  }
}

export async function createPage(title, slug) {
  const client = await pool.connect();
  try {
    const result = (await client.query('INSERT INTO pages (title, slug) VALUES ($1, $2) RETURNING id', [title, slug])).rows;
    return result[0]?.id;
  } finally {
    client.release();
  }
}

export async function updatePage(id, title, slug) {
  const client = await pool.connect();
  try {
    return (await client.query('UPDATE pages SET title = $1, slug = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [title, slug, id])).rows;
  } finally {
    client.release();
  }
}

export async function deletePage(id) {
  const client = await pool.connect();
  try {
    return (await client.query('DELETE FROM pages WHERE id = $1', [id])).rows;
  } finally {
    client.release();
  }
}

// CRUD Operations for Blocks
export async function getBlocksForPage(pageId) {
  const client = await pool.connect();
  try {
    return (await client.query('SELECT * FROM blocks WHERE page_id = $1 ORDER BY z_index ASC, created_at ASC', [pageId])).rows;
  } finally {
    client.release();
  }
}

export async function getBlockById(id) {
  const client = await pool.connect();
  try {
    const result = (await client.query('SELECT * FROM blocks WHERE id = $1', [id])).rows;
    return result[0] || null;
  } finally {
    client.release();
  }
}

export async function createBlock(pageId, blockType, gridCol, gridRow, gridWidth, gridHeight, content) {
  const client = await pool.connect();
  try {
    const result = (await client.query(
      'INSERT INTO blocks (page_id, block_type, content, grid_col, grid_row, grid_width, grid_height, background_color, text_color, z_index) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [pageId, blockType, JSON.stringify(content), gridCol, gridRow, gridWidth, gridHeight, 'transparent', '#000000', 1]
    )).rows;
    return result[0];
  } finally {
    client.release();
  }
}

export async function updateBlock(id, blockData) {
  const client = await pool.connect();
  try {
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

    console.log(`🔄 Updating block ${id} with data:`, {
      grid_col,
      grid_row,
      grid_width,
      grid_height,
      block_type,
      hasContent: !!content
    });

    const result = (await client.query(
      `UPDATE blocks SET
        grid_col = COALESCE($1, grid_col),
        grid_row = COALESCE($2, grid_row),
        grid_width = COALESCE($3, grid_width),
        grid_height = COALESCE($4, grid_height),
        content = COALESCE($5, content),
        block_type = COALESCE($6, block_type),
        background_color = COALESCE($7, background_color),
        text_color = COALESCE($8, text_color),
        z_index = COALESCE($9, z_index),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *`,
      [
        grid_col !== undefined ? grid_col : null,
        grid_row !== undefined ? grid_row : null,
        grid_width !== undefined ? grid_width : null,
        grid_height !== undefined ? grid_height : null,
        content !== undefined ? JSON.stringify(content) : null,
        block_type !== undefined ? block_type : null,
        background_color !== undefined ? background_color : null,
        text_color !== undefined ? text_color : null,
        z_index !== undefined ? z_index : null,
        id
      ]
    )).rows;

    if (result.length > 0) {
      console.log(`✅ Block ${id} updated successfully:`, {
        grid_col: result[0].grid_col,
        grid_row: result[0].grid_row
      });
      return result[0];
    } else {
      console.warn(`⚠️ No block found with ID ${id} to update`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error updating block ${id}:`, error);
    return null;
  } finally {
    client.release();
  }
}

export async function deleteBlock(id) {
  const client = await pool.connect();
  try {
    const result = (await client.query('DELETE FROM blocks WHERE id = $1', [id])).rows;
    return result.length > 0;
  } finally {
    client.release();
  }
}

export async function deleteAllBlocksForPage(pageId) {
  const client = await pool.connect();
  try {
    const result = (await client.query('DELETE FROM blocks WHERE page_id = $1', [pageId])).rows;
    return result.length || 0;
  } finally {
    client.release();
  }
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
  const client = await pool.connect();
  try {
    const result = (await client.query('SELECT * FROM layout_settings ORDER BY id DESC LIMIT 1')).rows;
    return result[0] || null;
  } finally {
    client.release();
  }
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

  const client = await pool.connect();
  try {
    // Check if layout settings already exist
    const existing = (await client.query('SELECT id FROM layout_settings ORDER BY id DESC LIMIT 1')).rows;

    if (existing.length > 0) {
      // Update existing settings
      return (await client.query(
        `UPDATE layout_settings SET
          header_component = $1,
          footer_component = $2,
          background_color = $3,
          background_image = $4,
          primary_color = $5,
          secondary_color = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7`,
        [header_component || 'default', footer_component || 'default', background_color || '#ffffff', background_image, primary_color || '#3b82f6', secondary_color || '#64748b', existing[0].id]
      )).rows;
    } else {
      // Create new layout settings
      return (await client.query(
        `INSERT INTO layout_settings (header_component, footer_component, background_color, background_image, primary_color, secondary_color, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [header_component || 'default', footer_component || 'default', background_color || '#ffffff', background_image, primary_color || '#3b82f6', secondary_color || '#64748b']
      )).rows;
    }
  } finally {
    client.release();
  }
}

// CMS Einstellungen
export async function getCMSSetting(key) {
  const client = await pool.connect();
  try {
    const result = (await client.query('SELECT value FROM cms_settings WHERE key = $1', [key])).rows;
    return result[0]?.value || null;
  } finally {
    client.release();
  }
}

export async function setCMSSetting(key, value) {
  const client = await pool.connect();
  try {
    return (await client.query(
      `INSERT INTO cms_settings (key, value, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [key, value]
    )).rows;
  } finally {
    client.release();
  }
}

export async function updatePageRows(pageId, rows) {
  const client = await pool.connect();
  try {
    return (await client.query('UPDATE pages SET rows = $1 WHERE id = $2', [rows, pageId])).rows;
  } finally {
    client.release();
  }
}

export async function updateBlockContent(id, content) {
  // Content sollte bereits ein JSON-String sein von der API
  const client = await pool.connect();
  try {
    return (await client.query('UPDATE blocks SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [content, id])).rows;
  } finally {
    client.release();
  }
}
