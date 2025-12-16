-- PostgreSQL Database Schema for NIC CMS
-- Diese Datei wird automatisch beim Starten des Docker-Containers ausgeführt

-- Aktiviere UUID-Extension (optional, aber empfohlen)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pages table
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  rows INTEGER DEFAULT 12,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  page_id INTEGER REFERENCES pages(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  content TEXT,
  grid_col INTEGER DEFAULT 0,
  grid_row INTEGER DEFAULT 0,
  grid_width INTEGER DEFAULT 2,
  grid_height INTEGER DEFAULT 1,
  z_index INTEGER DEFAULT 1,
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CMS settings table
CREATE TABLE IF NOT EXISTS cms_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Layout settings table
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

-- Erstelle Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_blocks_page_id ON blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_settings_key ON cms_settings(key);

-- Insert default layout settings
INSERT INTO layout_settings (header_component, footer_component, background_color, primary_color, secondary_color)
VALUES ('default', 'default', '#ffffff', '#3b82f6', '#64748b')
ON CONFLICT (id) DO NOTHING;

-- Create default home page
INSERT INTO pages (title, slug, rows) VALUES ('Home', 'home', 12)
ON CONFLICT (slug) DO NOTHING;

-- Add default blocks for the home page (nur wenn die Home-Seite existiert)
DO $$
DECLARE
    home_page_id INTEGER;
BEGIN
    SELECT id INTO home_page_id FROM pages WHERE slug = 'home';

    IF home_page_id IS NOT NULL THEN
        INSERT INTO blocks (
            page_id, block_type, content, grid_col, grid_row, grid_width, grid_height,
            z_index, background_color, text_color
        ) VALUES (
            home_page_id, 'Text', '"Welcome to my website!"', 0, 0, 12, 2,
            1, '#ffffff', '#000000'
        ) ON CONFLICT DO NOTHING;

        INSERT INTO blocks (
            page_id, block_type, content, grid_col, grid_row, grid_width, grid_height,
            z_index, background_color, text_color
        ) VALUES (
            home_page_id, 'Text', '"This is a CMS system with drag & drop editor."', 0, 3, 12, 2,
            2, '#f0f0f0', '#333333'
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;
