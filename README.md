# NIC CMS - Next.js Intuitive Content Management System

Ein modernes, drag-and-drop basiertes Content Management System, entwickelt mit Next.js, React und SQLite.

## 🚀 Features

### CMS Editor (`/nic`)
- **Drag & Drop Editor**: Frei bewegbare Blöcke ähnlich wie im japresentation Projekt
- **Block-Bibliothek**: Vordefinierte Komponenten (Text, Image, Button, Video, Container)
- **Seiten-Verwaltung**: Erstellen, bearbeiten und löschen von Seiten
- **Layout-Einstellungen**: Anpassbare Header, Footer, Farben und Hintergründe
- **Responsive Design**: Automatisch angepasst für alle Bildschirmgrößen

### Block-Typen
- **Text Block**: Editierbarer Text mit Doppelklick-Bearbeitung
- **Image Block**: Bild-Upload und -anzeige
- **Button Block**: Anklickbare Buttons
- **Video Block**: Video-Einbettung
- **Container Block**: Gruppierung anderer Blöcke

### Layout-System
- **Header Komponenten**:
  - DefaultHeader: Einfacher Header
  - NavigationHeader: Header mit Navigation
- **Footer Komponenten**:
  - DefaultFooter: Standard Footer
  - SocialFooter: Footer mit Social Media Links

### Datenbank
- **SQLite**: Lokale Datenbank für Seiten, Blöcke und Einstellungen
- **Automatische Migration**: Datenbankstruktur wird automatisch erstellt

## 📁 Projektstruktur

```
src/
├── app/
│   ├── page.js                     # Startseite
│   ├── [id]/page.js                # Dynamische öffentliche Seiten
│   ├── nic/page.js                 # CMS Editor
│   └── api/cms/                    # API Routen
│       ├── pages/                  # Seiten API
│       ├── blocks/                 # Blöcke API
│       └── layout/                 # Layout API
├── components/nic/
│   ├── cms/                        # CMS Komponenten
│   │   ├── CMSEditor.jsx           # Haupt-Editor
│   │   ├── MovableBlock.jsx        # Bewegbare Blöcke
│   │   ├── PageManager.jsx         # Seiten-Verwaltung
│   │   ├── LayoutSettings.jsx      # Layout-Einstellungen
│   │   ├── Components.jsx          # Block-Bibliothek
│   │   └── sidebar.jsx             # Sidebar mit Tabs
│   └── blocks/                     # Block-Komponenten
│       ├── Text.jsx
│       ├── ImageBlock.jsx
│       ├── ButtonBlock.jsx
│       ├── VideoBlock.jsx
│       ├── ContainerBlock.jsx
│       ├── header/
│       │   ├── DefaultHeader.jsx
│       │   └── NavigationHeader.jsx
│       └── footer/
│           ├── DefaultFooter.jsx
│           └── SocialFooter.jsx
├── context/
│   └── CMSContext.js               # React Context für State Management
└── lib/
    └── database.js                 # SQLite Datenbankfunktionen
```

## 🛠️ Installation und Setup

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

3. **CMS Editor öffnen:**
   Navigieren Sie zu `http://localhost:3000/nic`

## 📖 Verwendung

### 1. Seiten erstellen
1. Öffnen Sie den CMS Editor unter `/nic`
2. Klicken Sie auf den "Seiten" Tab in der Sidebar
3. Klicken Sie auf "Neue Seite"
4. Geben Sie Titel und URL-Slug ein
5. Klicken Sie auf "Erstellen"

### 2. Blöcke hinzufügen
1. Wählen Sie eine Seite aus
2. Klicken Sie auf den "Blöcke" Tab
3. Wählen Sie einen Block-Typ aus der Bibliothek
4. Klicken Sie auf das "+" Symbol um den Block hinzuzufügen

### 3. Blöcke bearbeiten
- **Positionieren**: Ziehen Sie Blöcke mit der Maus
- **Größe ändern**: Verwenden Sie die Resize-Handles
- **Rotieren**: Nutzen Sie die Rotations-Controls
- **Inhalt bearbeiten**: Doppelklicken Sie auf Text-Blöcke
- **Farbe ändern**: Klicken Sie auf das Palette-Symbol

### 4. Layout anpassen
1. Klicken Sie auf den "Layout" Tab
2. Wählen Sie Header- und Footer-Komponenten
3. Passen Sie Farben und Hintergrund an
4. Änderungen werden automatisch gespeichert

### 5. Seite veröffentlichen
- Öffentliche Seiten sind automatisch unter `/{slug}` verfügbar
- Die Startseite zeigt alle verfügbaren Seiten

## 🎨 Editor Modi

### Edit Modus
- Blöcke sind bewegbar und editierbar
- Grid-Overlay für präzise Positionierung
- Alle Editing-Tools verfügbar

### Preview Modus
- Zeigt die Seite wie sie öffentlich erscheint
- Keine Editing-Funktionen

### Delete Modus
- Klicken Sie auf Blöcke um sie zu löschen
- Rote Overlay-Markierung

## 🔧 Technische Details

### Abhängigkeiten
- **Next.js 15.4.6**: React Framework
- **React 19.1.0**: UI Library
- **react-colorful**: Farbauswahl
- **sqlite3**: Datenbank
- **lucide-react**: Icons
- **Tailwind CSS**: Styling

### Datenbank Schema

#### Pages Tabelle
- `id`: Eindeutige ID
- `title`: Seitentitel
- `slug`: URL-Slug
- `created_at`, `updated_at`: Zeitstempel

#### Blocks Tabelle
- `id`: Eindeutige ID
- `page_id`: Referenz zur Seite
- `block_type`: Typ des Blocks
- `content`: Block-Inhalt
- `position_x`, `position_y`: Position in Prozent
- `width`, `height`: Größe in Prozent
- `rotation`: Rotation in Grad
- `scale_x`, `scale_y`: Skalierung
- `background_color`, `text_color`: Farben
- `z_index`: Ebenen-Reihenfolge

#### Layout Settings Tabelle
- Header/Footer Komponenten
- Farben und Hintergrund-Einstellungen

## 🚀 Deployment

Das Projekt kann auf jeder Next.js-kompatiblen Plattform deployed werden:

1. **Vercel** (empfohlen)
2. **Netlify**
3. **Selbst gehostet**

Hinweis: SQLite-Datenbank funktioniert am besten bei selbst gehosteten Lösungen.

## 🤝 Beitragen

1. Fork das Repository
2. Erstellen Sie einen Feature Branch
3. Committen Sie Ihre Änderungen
4. Erstellen Sie einen Pull Request

## 📄 Lizenz

Dieses Projekt steht unter der MIT Lizenz.

## 🆘 Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue im Repository.
