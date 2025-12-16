# Auto-Responsive Layout System - Benutzerhandbuch

## Übersicht

Das Auto-Responsive System passt Ihre Inhalte automatisch an verschiedene Bildschirmgrößen an (Mobile, Tablet, Desktop).

## Features

### 🎯 Automatische Layout-Anpassung
- **Mobile (4 Spalten)**: Vollbreite für Text, Bilder, Videos
- **Tablet (8 Spalten)**: Optimierte mittlere Breite
- **Desktop (12 Spalten)**: Original-Layout

### 📱 Device-Vorschau
- Realistische Geräte-Rahmen für Mobile/Tablet
- Live-Ansicht der angepassten Layouts
- Visuelle Grid-Darstellung

### ⚡ Smart Layout-Algorithmus
- **Prioritäts-basiert**: Header, Navigation zuerst
- **Intelligente Größenanpassung**: Blocks werden proportional skaliert
- **Kollisionsvermeidung**: Keine überlappenden Blocks

## Verwendung

### 1. Auto-Responsive aktivieren
Klicken Sie auf den Toggle **"Auto-Responsive"** in der oberen Leiste.

### 2. Device wechseln
Wählen Sie zwischen:
- 📱 **Mobile** (375px max)
- 📱 **Tablet** (768px max)
- 💻 **Desktop** (unbegrenzt)

### 3. Layout anpassen
- **Automatisch**: System generiert Layouts beim Wechseln
- **Manuell**: Klicken Sie "Neu generieren" für frische Layouts

## Wie es funktioniert

### Block-Priorisierung
1. **Header/Navigation** (Priorität: 100-95)
2. **Hero/Titel** (Priorität: 90-85)
3. **Content** (Priorität: 70-60)
4. **Formulare** (Priorität: 40-35)

### Automatische Anpassungen

#### Mobile
- Text, Bilder, Videos → **Vollbreite** (4 Spalten)
- Buttons → **Angepasste Breite** (2-3 Spalten)
- Container → **Vollbreite** (4 Spalten)

#### Tablet
- Große Blocks → **Breiter** (6-8 Spalten)
- Kleine Blocks → **Proportional skaliert**
- Buttons → **Original oder breiter**

#### Desktop
- **Original-Layout** bleibt erhalten
- Oder **proportional von anderer Quelle**

## Tipps für beste Ergebnisse

### ✅ Empfohlene Vorgehensweise
1. Erstellen Sie Ihr Layout auf **Desktop**
2. Aktivieren Sie **Auto-Responsive**
3. Überprüfen Sie **Mobile** und **Tablet** Ansichten
4. Passen Sie manuell an, falls nötig

### 📐 Layout-Tipps
- Verwenden Sie **semantische Block-Namen** (z.B. "Header", "Hero")
- Halten Sie Blocks **einfach** und **fokussiert**
- Vermeiden Sie zu **komplexe verschachtelte** Layouts
- Testen Sie auf **allen Geräten**

## Technische Details

### Grid-Konfiguration
```javascript
RESPONSIVE_GRIDS = {
  mobile: {
    columns: 4,
    gap: 8px,
    rowHeight: 40px
  },
  tablet: {
    columns: 8,
    gap: 12px,
    rowHeight: 50px
  },
  desktop: {
    columns: 12,
    gap: 16px,
    rowHeight: 60px
  }
}
```

### Speicherung
- **Per Seite**: Jede Seite hat eigene responsive Layouts
- **LocalStorage**: Layouts werden lokal gespeichert
- **Automatisch**: Beim Seitenwechsel werden Layouts geladen

## Fehlerbehebung

### Problem: Layouts nicht korrekt
**Lösung**: Klicken Sie auf "Neu generieren"

### Problem: Blocks überlappen sich
**Lösung**:
1. Deaktivieren Sie Auto-Responsive
2. Passen Sie Desktop-Layout an
3. Aktivieren Sie Auto-Responsive wieder

### Problem: Device-Frame nicht sichtbar
**Lösung**: Auto-Responsive muss aktiviert sein

## Keyboard Shortcuts

- `Ctrl/Cmd + 1`: Mobile Ansicht
- `Ctrl/Cmd + 2`: Tablet Ansicht
- `Ctrl/Cmd + 3`: Desktop Ansicht
- `Ctrl/Cmd + R`: Layouts neu generieren

## Best Practices

### Design für Mobile First
1. Beginnen Sie mit Mobile-Layout
2. Erweitern Sie für Tablet
3. Finalisieren Sie für Desktop

### Content-Strategie
- **Wichtigster Content zuerst**
- **Kurze Texte** für Mobile
- **Große Touch-Targets** (min. 44px)
- **Ausreichend Whitespace**

### Performance
- Weniger Blocks = **schnellere Layouts**
- Einfache Strukturen = **bessere Performance**
- Regelmäßig alte Drafts **löschen**

## FAQ

**F: Kann ich Layouts manuell anpassen?**
A: Ja! Deaktivieren Sie Auto-Responsive und bearbeiten Sie manuell.

**F: Werden meine Original-Layouts überschrieben?**
A: Nein, Desktop-Layouts bleiben unverändert.

**F: Wie lösche ich responsive Layouts?**
A: Deaktivieren Sie Auto-Responsive und löschen Sie LocalStorage.

**F: Funktioniert es mit allen Block-Typen?**
A: Ja, alle Blocks werden unterstützt.

## Support

Bei Problemen oder Fragen:
1. Überprüfen Sie die Browser-Konsole
2. Testen Sie mit deaktiviertem Auto-Responsive
3. Erstellen Sie ein Issue im Repository

---

**Version**: 1.0
**Letzte Aktualisierung**: Dezember 2025
