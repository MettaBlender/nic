import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Pfad zum Ordner mit den Komponenten
const componentsDir = path.join(process.cwd(), 'src/components/nic/blocks');

// Hilfsfunktion um Komponenteninfo aus Datei zu extrahieren
function extractComponentInfo(filePath, fileName) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Versuche Komponentenname aus Default Export zu extrahieren
    const defaultExportMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/);
    const componentName = defaultExportMatch ? defaultExportMatch[1] : fileName.replace(/\.(jsx?|tsx?)$/, '');

    // Versuche Beschreibung aus Kommentaren zu extrahieren
    const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n\s*\*\//);
    const description = descriptionMatch ? descriptionMatch[1] : '';

    // Versuche Icon aus Kommentar zu extrahieren
    const iconMatch = content.match(/@icon\s+(.+)/);
    const icon = iconMatch ? iconMatch[1] : getDefaultIcon(componentName);

    const widthMatch = content.match(/@width\s+(\d+)/);
    const heightMatch = content.match(/@height\s+(\d+)/);

    const width = widthMatch ? parseInt(widthMatch[1], 10) : 2;
    const height = heightMatch ? parseInt(heightMatch[1], 10) : 1;

    const optionsMatch = content.match(/@options\s+([\s\S]*?)(?=\n\s*\*\/|\n\s*\*\s*@|\n\s*\*\s*$)/);

    let options = {};
    if (optionsMatch) {
      try {
        // Clean the matched content by removing comment syntax
        let cleanedOptions = optionsMatch[1]
          .replace(/\r\n/g, '\n')  // Normalize line endings
          .replace(/\r/g, '')      // Remove carriage returns
          .replace(/^\s*\*\s*/gm, '') // Remove comment asterisks and leading spaces
          .replace(/\s*\*\s*$/gm, '') // Remove trailing asterisks
          .split('\n')             // Split into lines
          .map(line => line.trim()) // Trim each line
          .filter(line => line.length > 0) // Remove empty lines
          .join('\n')              // Rejoin
          .trim();

        // Only parse if the content looks like valid JSON (starts with { or [)
        if ((cleanedOptions.startsWith('{') && cleanedOptions.endsWith('}')) ||
            (cleanedOptions.startsWith('[') && cleanedOptions.endsWith(']'))) {
          options = JSON.parse(cleanedOptions);
        } else {
          // Try to extract JSON from within the text
          const jsonMatch = cleanedOptions.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (jsonMatch) {
            options = JSON.parse(jsonMatch[1]);
          } else {
            console.warn(`Options content is not valid JSON for ${fileName}: "${cleanedOptions}"`);
            options = {};
          }
        }

        console.log(`Parsed options for ${fileName}:`, options);
      } catch (error) {
        console.warn(`Failed to parse options for ${fileName}:`, error.message);
        options = {};
      }
    }

    return {
      name: componentName,
      componentName: componentName,
      file: fileName,
      description: description || `${componentName} Block-Komponente`,
      icon: icon,
      width,
      height,
      options
    };
  } catch (error) {
    console.error(`Fehler beim Lesen der Datei ${fileName}:`, error);
    return {
      name: fileName.replace(/\.(jsx?|tsx?)$/, ''),
      componentName: fileName.replace(/\.(jsx?|tsx?)$/, ''),
      file: fileName,
      description: 'Block-Komponente',
      icon: '🧩',
      width: 2,
      height: 1,
      options: {}
    };
  }
}

// Standard-Icons basierend auf Komponentenname
function getDefaultIcon(componentName) {
  const name = componentName.toLowerCase();
  if (name.includes('text')) return '📝';
  if (name.includes('image')) return '🖼️';
  if (name.includes('button')) return '🔘';
  if (name.includes('video')) return '🎥';
  if (name.includes('container')) return '📦';
  if (name.includes('form')) return '📝';
  if (name.includes('input')) return '⌨️';
  if (name.includes('header')) return '📄';
  if (name.includes('footer')) return '🦶';
  if (name.includes('menu')) return '📋';
  if (name.includes('gallery')) return '🖼️';
  if (name.includes('slider')) return '🎚️';
  if (name.includes('card')) return '🃏';
  return '🧩';
}

// Rekursive Funktion zum Durchsuchen der Ordnerstruktur
function scanDirectory(dirPath, relativePath = '') {
  const categories = {};

  try {
    if (!fs.existsSync(dirPath)) {
      console.warn(`Verzeichnis existiert nicht: ${dirPath}`);
      return categories;
    }

    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Unterordner gefunden - rekursiv scannen
        const subCategories = scanDirectory(fullPath, path.join(relativePath, item));
        Object.assign(categories, subCategories);

        // Kategorie für diesen Ordner erstellen wenn er Komponenten enthält
        const categoryName = item;
        const categoryComponents = [];

        // Direkte Dateien in diesem Unterordner
        const subItems = fs.readdirSync(fullPath);
        subItems.forEach(subItem => {
          const subFullPath = path.join(fullPath, subItem);
          const subStat = fs.statSync(subFullPath);

          if (subStat.isFile() && /\.(jsx?|tsx?)$/.test(subItem)) {
            const componentInfo = extractComponentInfo(subFullPath, subItem);
            categoryComponents.push(componentInfo);
          }
        });

        if (categoryComponents.length > 0) {
          categories[categoryName] = categoryComponents;
        }
      } else if (stat.isFile() && /\.(jsx?|tsx?)$/.test(item)) {
        // React-Komponente gefunden
        const categoryName = relativePath || 'root';

        if (!categories[categoryName]) {
          categories[categoryName] = [];
        }

        const componentInfo = extractComponentInfo(fullPath, item);
        categories[categoryName].push(componentInfo);
      }
    });
  } catch (error) {
    console.error(`Fehler beim Scannen des Verzeichnisses ${dirPath}:`, error);
  }

  return categories;
}

export async function GET() {
  try {
    const categories = scanDirectory(componentsDir);

    // Sortiere Kategorien und Komponenten
    const sortedCategories = {};

    // Root-Kategorie zuerst
    if (categories.root) {
      sortedCategories.root = categories.root.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Andere Kategorien alphabetisch
    Object.keys(categories)
      .filter(key => key !== 'root')
      .sort()
      .forEach(key => {
        sortedCategories[key] = categories[key].sort((a, b) => a.name.localeCompare(b.name));
      });

    return NextResponse.json({
      success: true,
      categories: sortedCategories,
      totalComponents: Object.values(categories).reduce((sum, arr) => sum + arr.length, 0)
    });
  } catch (error) {
    console.error('Fehler beim Laden der Komponenten:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Komponenten',
      categories: {}
    }, { status: 500 });
  }
}
