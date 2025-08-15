-- Neon Database Schema für NIC CMS
-- Führe diese SQL-Befehle in deiner Neon-Konsole aus

-- Seiten Tabelle
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blöcke Tabelle
CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  page_id INTEGER REFERENCES pages(id) ON DELETE CASCADE,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CMS Einstellungen Tabelle
CREATE TABLE IF NOT EXISTS cms_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Layout Einstellungen Tabelle
CREATE TABLE IF NOT EXISTS layout_settings (
  id SERIAL PRIMARY KEY,
  header_component TEXT DEFAULT 'default',
  footer_component TEXT DEFAULT 'default',
  background_color TEXT DEFAULT '#ffffff',
  background_image TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#64748b',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Standard Layout Einstellungen einfügen
INSERT INTO layout_settings (header_component, footer_component, background_color, primary_color, secondary_color)
VALUES ('default', 'default', '#ffffff', '#3b82f6', '#64748b')
ON CONFLICT DO NOTHING;

-- Standard Home-Seite erstellen
INSERT INTO pages (title, slug) VALUES ('Home', 'home')
ON CONFLICT (slug) DO NOTHING;

-- Standard-Blöcke für die Home-Seite hinzufügen (nur wenn Home-Seite existiert)
DO $$
DECLARE
    home_page_id INTEGER;
BEGIN
    SELECT id INTO home_page_id FROM pages WHERE slug = 'home';

    IF home_page_id IS NOT NULL THEN
        INSERT INTO blocks (
            page_id, block_type, content, position_x, position_y, width, height,
            rotation, scale_x, scale_y, z_index, background_color, text_color, order_index
        ) VALUES (
            home_page_id, 'Text', 'Willkommen auf meiner Website!', 20, 20, 60, 20,
            0, 1, 1, 1, '#ffffff', '#000000', 0
        );

        INSERT INTO blocks (
            page_id, block_type, content, position_x, position_y, width, height,
            rotation, scale_x, scale_y, z_index, background_color, text_color, order_index
        ) VALUES (
            home_page_id, 'Text', 'Dies ist ein CMS-System mit Drag & Drop Editor.', 20, 50, 60, 15,
            0, 1, 1, 2, '#f0f0f0', '#333333', 1
        );
    END IF;
END $$;
