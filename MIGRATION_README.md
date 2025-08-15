# NIC CMS - Neon Database Migration

## Umstellung auf Neon (Serverless Postgres)

### 1. Neon-Datenbank einrichten

1. Gehe zu [Neon.tech](https://neon.tech) und erstelle ein kostenloses Konto
2. Erstelle eine neue Datenbank
3. Kopiere die Connection-URL (sollte so aussehen: `postgresql://user:password@host:port/database?sslmode=require`)
4. Führe das `database-init.sql` Script in der Neon-Konsole aus, um die Tabellen zu erstellen

### 2. Umgebungsvariablen konfigurieren

Die `.env.local` Datei wurde bereits erstellt und sollte so aussehen:

```
# Lokale Umgebungsvariablen für Login
LOGIN_USERNAME=admin
LOGIN_PASSWORD=admin123

# Neon Datenbank-URL (ersetze mit deinem echten Wert)
NEON_DATABASE_URL=deine_neon_connection_url_hier
```

**Wichtig:** Ersetze `deine_neon_connection_url_hier` mit deiner echten Neon-URL!

### 3. Dependencies installieren

```bash
npm install @neondatabase/serverless
```

Die SQLite-Abhängigkeiten wurden automatisch entfernt.

## Neue Features

### 1. Login-System
- **URL:** `/nic/login`
- **Zugangsdaten:** admin / admin123 (konfigurierbar über .env.local)
- **Automatischer Redirect:** Uneingeloggte Benutzer werden automatisch zur Login-Seite weitergeleitet
- **Logout:** Button oben rechts in der NIC-Anwendung

### 2. Verbessertes Block-Verschieben
- **Smootheres Verschieben:** Optimierte Drag-Physik mit reduziertem Multiplikator (3x statt 5x)
- **Bessere Transition:** CSS-Übergänge für flüssigere Bewegungen
- **Visuelles Feedback:** Z-Index erhöht sich während des Ziehens

### 3. Block-Info-Menü
- **Aktivierung:** Klick auf einen Block öffnet das Info-Menü
- **Informationen angezeigt:**
  - Block-Typ und ID
  - Position (X%, Y%)
  - Größe (Breite × Höhe)
  - Rotation und Z-Index
  - Inhalt-Preview
- **Aktionen verfügbar:**
  - Farbe ändern (Palette-Button)
  - Block duplizieren (Copy-Button)
  - Block löschen (Trash-Button)
- **Quick-Access:** Hover über Block zeigt kleinen Info-Button

### 4. Datenbank-Verbesserungen
- **Serverless:** Keine lokale SQLite-Datei mehr nötig
- **Cloud-basiert:** Daten werden in Neon (Postgres) gespeichert
- **Bessere Performance:** Optimierte Queries für Postgres
- **Skalierbar:** Automatische Skalierung durch Neon

## Technische Details

### Geänderte Dateien:
- `src/lib/database.js` - Komplette Umstellung auf Neon
- `package.json` - Entfernung von SQLite, Hinzufügung von @neondatabase/serverless
- `src/middleware.js` - Login-Middleware
- `src/app/nic/login/page.js` - Login-Komponente
- `src/app/api/auth/login/route.js` - Login-API
- `src/app/nic/page.js` - Logout-Button hinzugefügt
- `src/components/nic/cms/MovableBlock.jsx` - Info-Menü und verbessertes Verschieben
- `src/components/nic/cms/CMSEditor.jsx` - Duplizieren-Funktion

### Neue Features in MovableBlock:
- Info-Menü mit detaillierten Block-Informationen
- Verbesserte Drag-Performance (Multiplikator reduziert)
- Visuelle Verbesserungen (Group-Hover, bessere Transitions)
- Duplizieren-Funktion

### Sicherheit:
- HTTP-Only Cookies für Authentication
- Middleware-basierte Route-Protection
- Umgebungsvariablen für sensible Daten

## Erste Schritte

1. Stelle sicher, dass deine Neon-URL in `.env.local` korrekt ist
2. Führe `npm install` aus, um die Dependencies zu installieren
3. Starte die Anwendung mit `npm run dev`
4. Navigiere zu `/nic` - du wirst automatisch zur Login-Seite weitergeleitet
5. Logge dich mit admin/admin123 ein
6. Teste die neuen Features!

## Bekannte Probleme / TODO

- [ ] Batch-Updates für bessere Performance bei vielen Blöcken
- [ ] Undo/Redo-Funktionalität
- [ ] Responsive Design für mobile Geräte
- [ ] Backup/Export-Funktionalität
