import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

let db = null;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: path.join(process.cwd(), 'cms.db'),
      driver: sqlite3.Database
    });

    // Erstelle Tabellen falls sie nicht existieren
    await initializeDatabase();
  }
  return db;
}

async function initializeDatabase() {
  const database = await getDb();

  // Seiten Tabelle
  await database.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Blöcke Tabelle
  await database.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER,
      block_type TEXT NOT NULL,
      content TEXT,
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0,
      width REAL DEFAULT 20,
      height REAL DEFAULT 20,
      rotation REAL DEFAULT 0,
      scale_x REAL DEFAULT 1,
      scale_y REAL DEFAULT 1,
      z_index INTEGER DEFAULT 1,
      background_color TEXT DEFAULT '#ffffff',
      text_color TEXT DEFAULT '#000000',
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages (id) ON DELETE CASCADE
    )
  `);

  // CMS Einstellungen Tabelle
  await database.exec(`
    CREATE TABLE IF NOT EXISTS cms_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Layout Einstellungen Tabelle
  await database.exec(`
    CREATE TABLE IF NOT EXISTS layout_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      header_component TEXT DEFAULT 'default',
      footer_component TEXT DEFAULT 'default',
      background_color TEXT DEFAULT '#ffffff',
      background_image TEXT,
      primary_color TEXT DEFAULT '#3b82f6',
      secondary_color TEXT DEFAULT '#64748b',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Standard Layout Einstellungen einfügen falls noch nicht vorhanden
  const layoutExists = await database.get('SELECT id FROM layout_settings LIMIT 1');
  if (!layoutExists) {
    await database.run(`
      INSERT INTO layout_settings (header_component, footer_component, background_color, primary_color, secondary_color)
      VALUES ('default', 'default', '#ffffff', '#3b82f6', '#64748b')
    `);
  }

  // Standard Home-Seite erstellen falls noch nicht vorhanden
  const homePageExists = await database.get('SELECT id FROM pages WHERE slug = ?', ['home']);
  if (!homePageExists) {
    const result = await database.run(`
      INSERT INTO pages (title, slug) VALUES (?, ?)
    `, ['Home', 'home']);

    const homePageId = result.lastID;

    // Standard-Blöcke für die Home-Seite hinzufügen
    await database.run(`
      INSERT INTO blocks (
        page_id, block_type, content, position_x, position_y, width, height,
        rotation, scale_x, scale_y, z_index, background_color, text_color, order_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      homePageId, 'Text', 'Willkommen auf meiner Website!', 20, 20, 60, 20,
      0, 1, 1, 1, '#ffffff', '#000000', 0
    ]);

    await database.run(`
      INSERT INTO blocks (
        page_id, block_type, content, position_x, position_y, width, height,
        rotation, scale_x, scale_y, z_index, background_color, text_color, order_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      homePageId, 'Text', 'Dies ist ein CMS-System mit Drag & Drop Editor.', 20, 50, 60, 15,
      0, 1, 1, 2, '#f0f0f0', '#333333', 1
    ]);
  }
}

// CRUD Operationen für Seiten
export async function getPages() {
  const database = await getDb();
  return await database.all('SELECT * FROM pages ORDER BY created_at DESC');
}

export async function getPage(id) {
  const database = await getDb();
  return await database.get('SELECT * FROM pages WHERE id = ?', [id]);
}

export async function getPageBySlug(slug) {
  const database = await getDb();
  return await database.get('SELECT * FROM pages WHERE slug = ?', [slug]);
}

export async function createPage(title, slug) {
  const database = await getDb();
  const result = await database.run(
    'INSERT INTO pages (title, slug) VALUES (?, ?)',
    [title, slug]
  );
  return result.lastID;
}

export async function updatePage(id, title, slug) {
  const database = await getDb();
  return await database.run(
    'UPDATE pages SET title = ?, slug = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, slug, id]
  );
}

export async function deletePage(id) {
  const database = await getDb();
  return await database.run('DELETE FROM pages WHERE id = ?', [id]);
}

// CRUD Operationen für Blöcke
export async function getBlocks(pageId) {
  const database = await getDb();
  return await database.all(
    'SELECT * FROM blocks WHERE page_id = ? ORDER BY z_index ASC, order_index ASC',
    [pageId]
  );
}

export async function createBlock(blockData) {
  const database = await getDb();
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

  const result = await database.run(`
    INSERT INTO blocks (
      page_id, block_type, content, position_x, position_y, width, height,
      rotation, scale_x, scale_y, z_index, background_color, text_color, order_index
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    page_id, block_type, content, position_x, position_y, width, height,
    rotation, scale_x, scale_y, z_index, background_color, text_color, order_index
  ]);

  return result.lastID;
}

export async function updateBlock(id, blockData) {
  const database = await getDb();
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

  return await database.run(`
    UPDATE blocks SET
      content = ?, position_x = ?, position_y = ?, width = ?, height = ?,
      rotation = ?, scale_x = ?, scale_y = ?, z_index = ?, background_color = ?,
      text_color = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    content, position_x, position_y, width, height, rotation, scale_x, scale_y,
    z_index, background_color, text_color, order_index, id
  ]);
}

export async function deleteBlock(id) {
  const database = await getDb();
  return await database.run('DELETE FROM blocks WHERE id = ?', [id]);
}

// Layout Einstellungen
export async function getLayoutSettings() {
  const database = await getDb();
  return await database.get('SELECT * FROM layout_settings ORDER BY id DESC LIMIT 1');
}

export async function updateLayoutSettings(settings) {
  const database = await getDb();
  const {
    header_component,
    footer_component,
    background_color,
    background_image,
    primary_color,
    secondary_color
  } = settings;

  return await database.run(`
    UPDATE layout_settings SET
      header_component = ?, footer_component = ?, background_color = ?,
      background_image = ?, primary_color = ?, secondary_color = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = (SELECT MAX(id) FROM layout_settings)
  `, [
    header_component, footer_component, background_color,
    background_image, primary_color, secondary_color
  ]);
}

// CMS Einstellungen
export async function getCMSSetting(key) {
  const database = await getDb();
  const result = await database.get('SELECT value FROM cms_settings WHERE key = ?', [key]);
  return result ? result.value : null;
}

export async function setCMSSetting(key, value) {
  const database = await getDb();
  return await database.run(`
    INSERT OR REPLACE INTO cms_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `, [key, value]);
}
