# NIC CMS - Next.js Intuitive Content Management System

A modern, drag-and-drop based Content Management System built with Next.js, React, and PostgreSQL with Docker support.

## Features

### CMS Editor (`/nic`)
- **Drag & Drop Editor**: Freely movable blocks with grid-based positioning
- **Block Library**: Extensive collection of predefined components
- **Page Management**: Create, edit and delete pages with dynamic routing
- **Layout Settings**: Customizable header, footer, colors and backgrounds
- **Responsive Design**: Device-specific editing and preview modes
- **Real-time Preview**: Switch between edit and preview modes instantly
- **Documentation**: Built-in documentation at `/nic/docs`

### Block Types
#### Basic Blocks
- **Text Block**: Rich text editing with formatting options
- **Image Block**: Image upload with drag & drop support
- **Button Block**: Interactive buttons with customizable styling
- **Video Block**: Video embedding (YouTube, Vimeo, direct URLs)
- **Container Block**: Layout containers for grouping other blocks

#### Form Blocks
- **Contact Form Block**: Contact forms with validation
- **Newsletter Block**: Email subscription forms

#### Media Blocks
- **Audio Block**: Audio player integration
- **Gallery Block**: Image galleries with multiple layouts

#### Test Blocks
- **Test Block**: Development and testing components
- **Test Options Block**: Component configuration testing

### Layout System
- **Header Components**:
  - DefaultHeader: Clean, minimal header design
  - NavigationHeader: Header with navigation menu support
- **Footer Components**:
  - DefaultFooter: Standard footer with basic information
  - SocialFooter: Footer with social media integration

### Advanced Features
- **Grid System**: Intelligent block positioning with collision detection
- **Responsive Design**: Device-specific editing and preview modes
- **Real-time Updates**: Live preview without page refresh
- **Draft System**: Local storage for unsaved changes
- **Undo/Redo**: Full history management for editing actions
- **Component Discovery**: Automatic detection of available block types
- **Color Management**: Advanced color picker with contrast checking

### Database
- **PostgreSQL**: Production-ready relational database
- **Docker Support**: Containerized database and frontend
- **Automatic Migration**: Schema updates handled automatically
- **Data Persistence**: Reliable storage of pages, blocks, and settings

## Schnellstart mit Docker

Die einfachste Methode, das Projekt zu starten:

### Voraussetzungen
- Docker & Docker Compose installiert
- Git installiert

### Installation & Start

1. **Projekt klonen:**
```bash
git clone <repo-url>
cd nic
```

2. **.env Datei erstellen:**
```bash
cp .env.example .env
# Oder .env.local verwenden falls vorhanden
```
Die Standard-Werte sind bereits vorkonfiguriert.

3. **Docker Compose starten:**
```bash
docker-compose up -d --build
```

### Datenbankzugriff nach dem Start

Nach dem erfolgreichen Start der Services können Sie direkt auf die PostgreSQL-Datenbank zugreifen:

```bash
# Von außerhalb des Containers (Host-System)
psql -h localhost -U nicuser -d nic_cms -p 5432
# Passwort: nicpassword

# Oder von innerhalb des Containers
docker exec -it nic-postgres psql -U nicuser -d nic_cms
```

**Hinweis:** Stellen Sie sicher, dass der Container-Name (`nic-postgres`) und der Datenbankname (`nic_cms`) korrekt sind. Falls der Port oder Name angepasst wurde, passen Sie den Befehl entsprechend an.

Das war's! Der Service ist jetzt verfügbar auf:
- **Frontend**: http://localhost:3000
- **CMS Editor**: http://localhost:3000/nic
- **PostgreSQL**: localhost:5432 (host: postgres - nur innerhalb Docker)

Die Datenbank wird automatisch initialisiert mit:
- Standard-Tabellen (pages, blocks, cms_settings, layout_settings)
- Default Home-Page
- Default Layout-Einstellungen

### Docker Befehle

```bash
# Alle Logs anzeigen
docker-compose logs -f

# Nur Datenbank-Logs
docker-compose logs -f postgres

# Nur Frontend-Logs
docker-compose logs -f frontend

# Status prüfen
docker-compose ps

# Services neu starten
docker-compose restart

# Services stoppen
docker-compose down

# Services löschen (inkl. Volumen - Daten werden gelöscht!)
docker-compose down -v

# Neu starten und neu bauen
docker-compose up -d --build
```

## Auf PostgreSQL in Docker zugreifen

### 1. **Mit psql von Host aus**

```bash
# Verbindung zur Datenbank
psql -h localhost -U nicuser -d nic_cms -p 5432
# Passwort: nicpassword

# Oder direkt mit CONNECTION STRING
psql postgresql://nicuser:nicpassword@localhost:5432/nic_cms
```

### 2. **Von innerhalb des Containers**

```bash
# SSH in den Datenbankcontainer
docker-compose exec postgres bash

# Dann psql starten
psql -U nicuser -d nic_cms
```

### 3. **Nützliche PostgreSQL Befehle**

```bash
# Alle Tabellen auflisten
docker-compose exec postgres psql -U nicuser -d nic_cms -c "\dt"

# Seiten anschauen
docker-compose exec postgres psql -U nicuser -d nic_cms -c "SELECT * FROM pages;"

# Blocks anschauen
docker-compose exec postgres psql -U nicuser -d nic_cms -c "SELECT * FROM blocks;"

# Layout-Einstellungen anschauen
docker-compose exec postgres psql -U nicuser -d nic_cms -c "SELECT * FROM layout_settings;"

# Datenbank-Info
docker-compose exec postgres psql -U nicuser -d nic_cms -c "\l"
```

### 4. **Backup & Restore**

```bash
# Backup erstellen
docker-compose exec postgres pg_dump -U nicuser -d nic_cms > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup einspielen (Datenbank wird überschrieben!)
docker-compose exec -T postgres psql -U nicuser -d nic_cms < backup.sql

# Nur eine Tabelle exportieren
docker-compose exec postgres pg_dump -U nicuser -d nic_cms -t blocks > blocks_backup.sql

# Datenbank komplett löschen und neu initialisieren
docker-compose down -v
docker-compose up -d
```

## Troubleshooting

### Problem: "ENOTFOUND postgres"

**Ursache:** Frontend-Container kann Datenbank-Container nicht erreichen.

**Lösungen:**

```bash
# 1. Prüfen ob alle Container laufen
docker-compose ps

# Ausgabe sollte sein:
# NAME          COMMAND                STATUS           PORTS
# nic-frontend  ...                    Up (healthy)     0.0.0.0:3000->3000/tcp
# nic-postgres  ...                    Up (healthy)     0.0.0.0:5432->5432/tcp

# 2. Logs der Datenbank prüfen
docker-compose logs postgres

# 3. Logs des Frontends prüfen
docker-compose logs frontend

# 4. Netzwerk überprüfen
docker network ls
docker network inspect nic_nic-network

# 5. Services neu starten
docker-compose down
docker-compose up -d --build

# 6. Container-Verbindung testen
docker-compose exec frontend ping postgres
```

### Problem: "Connection refused"

**Ursache:** Datenbank ist nicht vollständig initialisiert.

**Lösung:**

```bash
# Warte bis die Datenbank bereit ist
docker-compose logs postgres | grep "database system is ready"

# Wenn nicht bereit: Neu starten mit mehr Zeit
docker-compose down -v
docker-compose up -d
sleep 10  # Warte 10 Sekunden
docker-compose logs postgres
```

### Problem: Datenbank-Initialisierung schlägt fehl

**Ursache:** SQL-Dateien wurden nicht korrekt geladen.

**Lösung:**

```bash
# Manuell initialisieren
docker-compose exec postgres psql -U nicuser -d nic_cms -f /docker-entrypoint-initdb.d/01-init.sql
docker-compose exec postgres psql -U nicuser -d nic_cms -f /docker-entrypoint-initdb.d/02-migration.sql

# Oder Datenbank komplett neu aufsetzen
docker-compose down -v
rm -rf postgres_data  # Falls vorhanden
docker-compose up -d
```

### Problem: Port 5432 ist bereits in Benutzung

**Lösung:** Andere Port in `docker-compose.yml` verwenden:

```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # Localhost:5433 statt 5432
```

Dann mit `docker-compose up -d --build` neu starten.

### Problem: Fehler beim Datenbankzugriff von außerhalb

**Ursache:** PostgreSQL ist nur auf localhost verfügbar.

**Lösung:** In `.env` die richtige CONNECTION STRING verwenden:

```env
# Für Docker-Container (intern)
DATABASE_URL=postgresql://nicuser:nicpassword@postgres:5432/nic_cms

# Für Host-Zugriff (extern)
DATABASE_URL=postgresql://nicuser:nicpassword@localhost:5432/nic_cms
```

### Problem: Docker-Compose Fehler "version"

Stelle sicher, dass `docker-compose.yml` die richtige Version hat:

```yaml
version: '3.8'  # Muss mindestens 3.8 sein
```

### Problem: ".env.local" Variablen werden nicht geladen

**Lösung:** Stelle sicher, dass du die richtige Datei verwendest:

```bash
# Für Docker: .env oder .env.local (beide werden geladen)
# Prüfen welche Variablen geladen sind
docker-compose config
```


# Services neu starten
docker-compose restart

# Services stoppen
docker-compose down

# Services löschen (inkl. Volumen)
docker-compose down -v

# Datenbank neu initialisieren
docker-compose down -v
docker-compose up -d
```

## Lokale Entwicklung ohne Docker

### Voraussetzungen
- Node.js 18+
- PostgreSQL 14+ lokal installiert

### Installation

1. **Dependencies installieren:**
```bash
npm install
```

2. **.env Datei erstellen:**
```bash
cp .env.example .env
```

3. **.env anpassen** (für lokale PostgreSQL):
```env
DATABASE_URL=postgresql://nicuser:nicpassword@localhost:5432/nic_cms
NODE_ENV=development
```

4. **PostgreSQL Datenbank erstellen:**
```bash
# Als postgres Benutzer
createuser nicuser
psql -U postgres -c "ALTER USER nicuser WITH PASSWORD 'nicpassword';"
createdb -O nicuser nic_cms

# Datenbank initialisieren
psql -U nicuser -d nic_cms -f database-init.sql
psql -U nicuser -d nic_cms -f database-migration.sql
```

5. **Development Server starten:**
```bash
npm run dev
```

Der Service ist jetzt verfügbar auf http://localhost:3000

## Datenbank-Verwaltung

### Datenbankstruktur

**Tables:**
- `pages` - Verwaltung von CMS-Seiten
- `blocks` - Inhaltselemente auf den Seiten
- `cms_settings` - CMS-Konfiguration
- `layout_settings` - Layout und Design-Einstellungen

### Backup & Restore mit Docker

```bash
# Backup erstellen
docker-compose exec postgres pg_dump -U nicuser -d nic_cms > backup.sql

# Backup einspielen
docker-compose exec -T postgres psql -U nicuser -d nic_cms < backup.sql

# Einzelne Tabelle exportieren
docker-compose exec postgres pg_dump -U nicuser -d nic_cms -t blocks > blocks_backup.sql
```

### Alternative Datenbanken

Das System unterstützt jede PostgreSQL-kompatible Datenbank:

- **Vercel Postgres**: `DATABASE_URL=postgresql://...@vercel.com`
- **AWS RDS**: `DATABASE_URL=postgresql://...@xxx.amazonaws.com`
- **Google Cloud SQL**: `DATABASE_URL=postgresql://...@cloud.google.com`
- **PlanetScale**: Benötigt MySQL-Adapter (nicht standardmäßig unterstützt)
- **Lokale PostgreSQL**: `DATABASE_URL=postgresql://user:password@localhost:5432/dbname`

Setzen Sie einfach die `DATABASE_URL` in der `.env` Datei.

## Build & Deployment

### Production Build mit Docker

```bash
# Build erstellen
docker-compose build --no-cache

# Mit optimiertem Dockerfile starten
docker-compose up -d
```

### Manueller Build

```bash
# Next.js bauen
npm run build

# Production starten
npm start
```

## Environment Variablen

Alle konfigurierbaren Optionen in `.env`:

```env
# Datenbank
DATABASE_URL=postgresql://nicuser:nicpassword@postgres:5432/nic_cms
DB_USER=nicuser
DB_PASSWORD=nicpassword
DB_HOST=postgres
DB_PORT=5432
DB_NAME=nic_cms

# Frontend
FRONTEND_PORT=3000
NODE_ENV=development

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Project Structure

```
nic/
+-- src/
|   +-- app/
|   |   +-- layout.js               # Root layout
|   |   +-- page.js                 # Homepage
|   |   +-- globals.css             # Global styles
|   |   +-- [...id]/                # Dynamic public pages
|   |   |   +-- page.js
|   |   +-- nic/                    # CMS Application
|   |   |   +-- page.js             # Main CMS Editor
|   |   |   +-- docs/               # Documentation
|   |   |   |   +-- page.js
|   |   |   +-- login/              # Authentication
|   |   |   |   +-- page.js
|   |   |   +-- responsive-demo/    # Responsive testing
|   |   +-- api/                    # API Routes
|   |       +-- auth/               # Authentication API
|   |       |   +-- login/
|   |       +-- cms/                # CMS API endpoints
|   |           +-- pages/          # Page management
|   |           +-- blocks/         # Block operations
|   |           +-- layout/         # Layout settings
|   |           +-- components/     # Component discovery
|   |           +-- migrate/        # Database migration
|   |           +-- update-block/   # Block updates
|   +-- components/nic/
|   |   +-- cms/                    # CMS Interface Components
|   |   |   +-- CMSEditor.jsx       # Main editor interface
|   |   |   +-- GridCanvas.jsx      # Drag & drop canvas
|   |   |   +-- DetailSideBar.jsx   # Block property editor
|   |   |   +-- Components.jsx      # Block library
|   |   |   +-- PageManager.jsx     # Page management
|   |   |   +-- LayoutSettings.jsx  # Layout configuration
|   |   |   +-- sidebar.jsx         # Main sidebar
|   |   |   +-- header/             # Header components
|   |   |   |   +-- DefaultHeader.jsx
|   |   |   |   +-- NavigationHeader.jsx
|   |   |   +-- footer/             # Footer components
|   |   |       +-- DefaultFooter.jsx
|   |   |       +-- SocialFooter.jsx
|   |   +-- blocks/                 # Content Blocks
|   |   |   +-- Text.jsx            # Text block
|   |   |   +-- ImageBlock.jsx      # Image block
|   |   |   +-- ButtonBlock.jsx     # Button block
|   |   |   +-- VideoBlock.jsx      # Video block
|   |   |   +-- ContainerBlock.jsx  # Container block
|   |   |   +-- fallback.jsx        # Error fallback
|   |   |   +-- forms/              # Form blocks
|   |   |   |   +-- ContactFormBlock.jsx
|   |   |   |   +-- NewsletterBlock.jsx
|   |   |   +-- media/              # Media blocks
|   |   |   |   +-- AudioBlock.jsx
|   |   |   |   +-- GalleryBlock.jsx
|   |   |   +-- test/               # Development blocks
|   |   |       +-- Test2.jsx
|   |   +-- responsive/             # Responsive utilities
|   +-- context/
|   |   +-- CMSContext.js           # Global state management
|   +-- hooks/
|   |   +-- useGridSystem.js        # Grid system utilities
|   +-- lib/
|   |   +-- database.js             # Database operations (PostgreSQL via pg)
|   |   +-- componentLoader.js      # Component loading (client)
|   |   +-- componentLoaderServer.js # Component loading (server)
|   +-- utils/
|   |   +-- cmsFunctions.js         # CMS utility functions
|   |   +-- colorFunctions.jsx      # Color manipulation
|   |   +-- localStorageManager.js  # Local storage utilities
|   +-- config/                     # Configuration files
|   +-- styles/                     # Additional styles
|   +-- middleware.js               # Next.js middleware
+-- data/                           # Data files
|   +-- nic-cms.json               # CMS configuration
+-- docs/                           # Documentation assets
+-- public/                         # Static assets
+-- database-init.sql               # Database schema
+-- database-migration.sql          # Database migrations
+-- docker-compose.yml              # Docker Compose configuration
+-- Dockerfile                      # Frontend Docker image
+-- .dockerignore                   # Docker build ignore
+-- .env.example                    # Environment configuration template
+-- nic.config.js                   # NIC configuration
+-- package.json                    # Dependencies
```

## Migrationsguide: Neon zu PostgreSQL mit Docker

Falls Sie zuvor `@neondatabase/serverless` verwendet haben:

### Änderungen in diesem Update:

1. **Database Driver**: `@neondatabase/serverless` → `pg` (Standard PostgreSQL Driver)
2. **Connection Management**: Template Literals → Parameterized Queries mit Connection Pooling
3. **Deployment**: Neon → Docker + PostgreSQL OR externe PostgreSQL-Instanz
4. **Query Syntax**: Neon → Standard PostgreSQL (keine Breaking Changes)

### Was ist kompatibel?

- ✅ Alle bestehenden SQL-Schemas
- ✅ Alle bestehenden Daten
- ✅ API-Endpoints (keine Änderungen)
- ✅ React-Komponenten (keine Änderungen)

### Migrationsschritte

1. **Dependencies aktualisieren:**
   ```bash
   npm install pg
   npm uninstall @neondatabase/serverless
   ```

2. **Environment variablen anpassen:**
   ```env
   # Statt NEON_DATABASE_URL verwenden Sie:
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```

3. **Mit Docker starten:**
   ```bash
   docker-compose up -d
   ```

4. **Datendaten migrieren** (falls bereits Daten vorhanden):
   ```bash
   # Von alter Neon-Datenbank exportieren
   pg_dump -h neon-host -U user -d dbname > backup.sql

   # In neue Docker-PostgreSQL importieren
   docker-compose exec postgres psql -U nicuser -d nic_cms < backup.sql
   ```

## Troubleshooting

### Port 5432 bereits in Benutzung

```bash
# Anderen Port in docker-compose.yml verwenden:
# ports:
#   - "5433:5432"  # localhost:5433 statt 5432
```

### Verbindungsfehler

```bash
# Container-Logs prüfen
docker-compose logs postgres

# Datenbankverbindung testen
docker-compose exec postgres psql -U nicuser -d nic_cms -c "SELECT version();"
```

### Datenbankvolumen löschen

```bash
# Vollständig neu starten
docker-compose down -v
docker-compose up -d
```

## Installation and Setup

### Prerequisites
- Node.js 18+
- npm or yarn package manager
- Docker & Docker Compose (für Docker-Deployment)

### Quick Start with Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MettaBlender/nic.git
   cd nic
   ```

2. **Start with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - CMS: http://localhost:3000/nic

### Manual Installation without Docker

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL locally**
3. **Update .env with your database URL**
4. **Run development server:**
   ```bash
   npm run dev
   ```

### Delete Mode
- Click on blocks to delete them
- Red overlay marking

## Technical Details

### Dependencies
- **Next.js 15.4.6**: React Framework with Turbopack support
- **React 19.1.0**: UI Library
- **react-colorful 5.6.1**: Color picker components
- **@neondatabase/serverless**: Database connectivity
- **lucide-react 0.539.0**: Icon library
- **Tailwind CSS 4**: Utility-first CSS framework
- **react-dnd 16.0.1**: Drag and drop functionality
- **react-dnd-html5-backend**: HTML5 backend for drag and drop

### Database Schema

#### Pages Table
- `id`: Unique ID
- `title`: Page title
- `slug`: URL slug
- `created_at`, `updated_at`: Timestamps

#### Blocks Table
- `id`: Unique ID
- `page_id`: Reference to page
- `block_type`: Block type
- `content`: Block content
- `position_x`, `position_y`: Position in percent
- `width`, `height`: Size in percent
- `rotation`: Rotation in degrees
- `scale_x`, `scale_y`: Scaling
- `background_color`, `text_color`: Colors
- `z_index`: Layer order

#### Layout Settings Table
- `id`: Unique ID
- `header_component`: Selected header component name
- `footer_component`: Selected footer component name
- `primary_color`: Primary brand color
- `secondary_color`: Secondary accent color
- `background_color`: Page background color
- `text_color`: Default text color
- `created_at`, `updated_at`: Timestamps

## Development

### Adding New Block Components
1. Create your component in `src/components/nic/blocks/`
2. Export it as default with proper metadata
3. The component will be automatically discovered by the API
4. Use the built-in documentation at `/nic/docs` for guidelines

### Configuration
- **NIC Config**: Edit `nic.config.js` for system-wide settings
- **Database**: Modify `database-init.sql` for schema changes
- **Middleware**: Customize `src/middleware.js` for routing logic

### API Endpoints
- `GET/POST /api/cms/pages` - Page management
- `GET/PUT/DELETE /api/cms/blocks/[id]` - Block operations
- `GET/PUT /api/cms/layout` - Layout settings
- `GET /api/cms/components` - Component discovery

## Deployment

### Supported Platforms
1. **Vercel** (recommended) - Full Next.js support with edge functions
2. **Netlify** - Static generation with serverless functions
3. **Self-hosted** - Docker containers or traditional hosting

### Database Considerations
- **Development**: Uses local SQLite database
- **Production**: Consider migrating to PostgreSQL/MySQL for scalability
- **@neondatabase/serverless**: Already configured for Neon PostgreSQL

### Build Commands
```bash
# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Environment Variables
```bash
# Add to .env.local for production
DATABASE_URL=your_database_connection_string
NEXTAUTH_SECRET=your_auth_secret
NEXTAUTH_URL=your_domain_url
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Create a pull request

## License

This project is under the MIT License.

## Support

For questions or issues, please create an issue in the repository.
