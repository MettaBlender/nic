# NIC CMS Testing

Umfassende Test-Suite für das NIC Content Management System.

## Test-Abdeckung

### 1. CMSContext Tests (`src/context/__tests__/CMSContext.test.js`)

Testet die Kernfunktionalität des CMS Context:

- ✅ **Initialization**: Prüft Default-Werte und LocalStorage-Wiederherstellung
- ✅ **Block Operations**: CRUD Operations (Create, Read, Update, Delete)
- ✅ **Pending Operations**: Tracking von ungespeicherten Änderungen
- ✅ **Save Status**: Status-Management (saved, dirty, saving)
- ✅ **LocalStorage Integration**: currentPage Persistierung
- ✅ **Position Updates**: Zuverlässige Position 0,0 und numerische Werte
- ✅ **Batch Operations**: Multiple Updates zum selben Block
- ✅ **Error Handling**: Fehlerbehandlung bei API-Fehlern

### 2. API Route Tests (`src/app/api/cms/pages/[id]/blocks/batch/__tests__/route.test.js`)

Testet die Batch-Operations API:

- ✅ **CREATE**: Neue Blöcke erstellen
- ✅ **UPDATE**: Block-Position und -Eigenschaften aktualisieren
- ✅ **DELETE**: Blöcke löschen
- ✅ **Position (0,0)**: Spezialfall Position null
- ✅ **Multiple Operations**: Mehrere Operations in einer Anfrage
- ✅ **JSON Parsing**: Content-Parsing aus verschiedenen Formaten
- ✅ **Error Handling**: Fehlerbehandlung bei DB-Fehlern

### 3. Database Tests (`src/lib/__tests__/database.test.js`)

Testet die Datenbank-Layer:

- ✅ **getBlocksForPage**: Alle Blöcke einer Seite abrufen
- ✅ **getBlockById**: Einzelnen Block abrufen
- ✅ **createBlock**: Neuen Block erstellen
- ✅ **updateBlock**: Block aktualisieren (alle Eigenschaften)
- ✅ **deleteBlock**: Block löschen

## Test-Commands

```bash
# Alle Tests ausführen
npm test

# Tests im Watch-Modus (für Entwicklung)
npm run test:watch

# Tests mit Coverage-Report
npm run test:coverage

# Tests für CI/CD
npm run test:ci
```

## Test-Setup

### Jest Konfiguration

- **jest.config.js**: Haupt-Konfigurationsdatei
- **jest.setup.js**: Setup-Datei für Mocks (localStorage, matchMedia, etc.)

### Mocks

- `window.matchMedia`: Für responsive Tests
- `window.localStorage`: Für LocalStorage-Tests
- `window.confirm/alert`: Für User-Interaktionen
- `next/navigation`: Für Next.js Router

## Coverage-Ziele

Minimale Coverage-Anforderungen:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Kritische Test-Szenarien

### 1. Block-Position Speichern

**Problem**: Blöcke wurden nicht gespeichert, wenn Position geändert wurde.

**Lösung**:
- Sicherstellen, dass `grid_col` und `grid_row` immer als Zahlen übertragen werden
- `typeof check` in publishDrafts für alle Positions-Werte
- Detailliertes Logging in updateBlock und database.js

**Tests**:
```javascript
// Position 0,0 korrekt handhaben
it('should handle position 0,0 correctly', ...)

// Position-Updates tracken
it('should update block position and track in pendingOperations', ...)

// Numerische Werte sicherstellen
it('should ensure grid_col and grid_row are always numbers', ...)
```

### 2. Pending Operations Tracking

**Problem**: pendingOperationsCount wurde nicht aktualisiert.

**Lösung**:
- `pendingOperations` Map als Dependency (nicht `.size`)
- useMemo neu berechnen bei Map-Änderungen

**Tests**:
```javascript
// Zähler korrekt tracken
it('should track pending operations count correctly', ...)

// Nach Publish löschen
it('should clear pending operations after successful publish', ...)
```

### 3. LocalStorage Integration

**Problem**: currentPage ging bei Reload verloren.

**Lösung**:
- currentPageId in localStorage speichern
- Bei Initialization wiederherstellen

**Tests**:
```javascript
// Page-ID speichern
it('should save currentPage.id to localStorage when page changes', ...)

// Beim Start wiederherstellen
it('should restore currentPage from localStorage', ...)
```

## Debugging

### Console-Logs in Tests

Tests haben detaillierte Console-Logs deaktiviert für saubere Output. Zum Debugging:

```javascript
// In jest.setup.js auskommentieren:
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// };
```

### Einzelne Tests ausführen

```bash
# Nur CMSContext Tests
npm test CMSContext

# Nur API Tests
npm test route.test

# Nur Database Tests
npm test database.test

# Specific Test
npm test -- -t "should update block position"
```

## Best Practices

1. **Arrange-Act-Assert**: Struktur für alle Tests
2. **Mock External Dependencies**: fetch, database, localStorage
3. **Test Real User Scenarios**: Nicht nur technische Details
4. **Async/Await**: Für alle asynchronen Operations
5. **Clean Up**: beforeEach mit clearAllMocks()

## Continuous Integration

Tests laufen automatisch bei:
- Pull Requests
- Commits auf main branch
- Vor Production Deployments

```yaml
# Beispiel GitHub Actions
- name: Run Tests
  run: npm run test:ci
```

## Erweiterung

### Neue Tests hinzufügen

1. Erstelle `__tests__` Ordner neben der zu testenden Datei
2. Erstelle `[filename].test.js`
3. Importiere und mocke Dependencies
4. Schreibe Tests mit describe/it Blöcken
5. Führe `npm test` aus

### Beispiel:

```javascript
import { myFunction } from '../myFile';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('output');
  });
});
```

## Troubleshooting

### Tests schlagen fehl

1. Prüfe Mock-Setup in `jest.setup.js`
2. Prüfe Import-Pfade (@/ alias)
3. Stelle sicher, dass async/await korrekt verwendet wird
4. Prüfe Console für detaillierte Fehler

### Coverage zu niedrig

1. Füge Tests für ungetestete Branches hinzu
2. Teste Error-Pfade
3. Teste Edge Cases (0, null, undefined)

### Tests laufen langsam

1. Reduziere waitFor timeouts
2. Mocke zeitintensive Operations
3. Verwende `--maxWorkers` für Parallelisierung

## Kontakt

Bei Fragen oder Problemen mit Tests: Erstelle ein Issue oder kontaktiere das Team.
