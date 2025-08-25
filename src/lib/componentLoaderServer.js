// Server-side Utility für dynamisches Laden von CMS-Komponenten
import fs from 'fs';
import path from 'path';
import dynamic from 'next/dynamic';

/**
 * Server-seitige Funktion zum Scannen verfügbarer Komponenten
 */
export const getAvailableComponentsServer = () => {
  try {
    const componentsDir = path.join(process.cwd(), 'src/components/nic/blocks');

    const scanDirectory = (dir, basePath = '') => {
      const components = [];
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const relativePath = basePath ? `${basePath}/${item.name}` : item.name;

        if (item.isDirectory()) {
          // Rekursiv durch Unterordner scannen
          components.push(...scanDirectory(fullPath, relativePath));
        } else if (item.isFile() && /\.(jsx?|tsx?)$/.test(item.name)) {
          // Nur React-Komponenten-Dateien
          const componentName = item.name.replace(/\.(jsx?|tsx?)$/, '');

          // Versuche, Metadaten aus der Datei zu extrahieren
          let icon = '🧩';
          let description = 'Komponente';

          try {
            const fileContent = fs.readFileSync(fullPath, 'utf8');

            // Extrahiere Icon aus Kommentaren wie /** @icon 📝 */
            const iconMatch = fileContent.match(/@icon\s+(.+)/);
            if (iconMatch) {
              icon = iconMatch[1].trim();
            }

            // Extrahiere Beschreibung aus Kommentaren
            const descMatch = fileContent.match(/\*\s*(.+)\s*@icon/);
            if (descMatch) {
              description = descMatch[1].trim();
            } else {
              // Fallback: erste Zeile des Kommentars
              const commentMatch = fileContent.match(/\/\*\*\s*\n\s*\*\s*(.+)/);
              if (commentMatch) {
                description = commentMatch[1].trim();
              }
            }
          } catch (error) {
            console.warn(`Konnte Metadaten für ${relativePath} nicht lesen:`, error);
          }

          components.push({
            name: componentName,
            componentName: componentName,
            component: relativePath.replace(/\.(jsx?|tsx?)$/, ''),
            icon,
            description,
            path: relativePath,
            category: basePath || 'root'
          });
        }
      }

      return components;
    };

    return scanDirectory(componentsDir);

  } catch (error) {
    console.error('Fehler beim Scannen der Komponenten:', error);
    return [];
  }
};

/**
 * Erstellt dynamische Imports für alle verfügbaren Komponenten
 */
export const createDynamicComponents = () => {
  const availableComponents = getAvailableComponentsServer();
  const components = {};

  for (const comp of availableComponents) {
    try {
      // Erstelle dynamischen Import
      components[comp.name] = dynamic(
        () => import(`@/components/nic/blocks/${comp.component}`),
        { ssr: true }
      );

      // Auch unter componentName verfügbar machen
      if (comp.componentName !== comp.name) {
        components[comp.componentName] = components[comp.name];
      }

      // Kurze Namen ohne "Block" Suffix für Backward-Compatibility
      if (comp.component.endsWith('Block')) {
        const shortName = comp.component.replace('Block', '');
        components[shortName] = components[comp.name];
      }

    } catch (error) {
      console.warn(`Konnte Komponente ${comp.component} nicht laden:`, error);

      // Fallback-Komponente
      components[comp.name] = () => (
        <div className="text-red-500 p-4 border border-red-300 rounded">
          <div className="font-bold">Komponente nicht verfügbar</div>
          <div className="text-sm">Type: {comp.name}</div>
        </div>
      );
    }
  }

  return components;
};

/**
 * Spezielle Funktion für Header-Komponenten
 */
export const createDynamicHeaderComponents = () => {
  const availableComponents = getAvailableComponentsServer();
  const headerComponents = {};

  const headers = availableComponents.filter(comp =>
    comp.category === 'header' || comp.component.includes('header') || comp.name.toLowerCase().includes('header')
  );

  for (const comp of headers) {
    try {
      // Erstelle aussagekräftigere Keys
      let key = comp.name.toLowerCase()
        .replace(/header/gi, '')
        .replace(/block/gi, '')
        .trim();

      if (!key || key === '') key = 'default';
      if (key === 'navigation') key = 'navigation';
      if (key === 'default') key = 'default';

      headerComponents[key] = dynamic(
        () => import(`@/components/nic/blocks/${comp.component}`),
        { ssr: true }
      );
    } catch (error) {
      console.warn(`Konnte Header-Komponente ${comp.component} nicht laden:`, error);
    }
  }

  // Fallback für Standard-Header
  if (!headerComponents.default) {
    try {
      headerComponents.default = dynamic(
        () => import('@/components/nic/blocks/header/DefaultHeader'),
        { ssr: true }
      );
    } catch (error) {
      console.warn('Standard-Header nicht gefunden');
    }
  }

  return headerComponents;
};

/**
 * Spezielle Funktion für Footer-Komponenten
 */
export const createDynamicFooterComponents = () => {
  const availableComponents = getAvailableComponentsServer();
  const footerComponents = {};

  const footers = availableComponents.filter(comp =>
    comp.category === 'footer' || comp.component.includes('footer') || comp.name.toLowerCase().includes('footer')
  );

  for (const comp of footers) {
    try {
      // Erstelle aussagekräftigere Keys
      let key = comp.name.toLowerCase()
        .replace(/footer/gi, '')
        .replace(/block/gi, '')
        .trim();

      if (!key || key === '') key = 'default';
      if (key === 'social') key = 'social';
      if (key === 'default') key = 'default';

      footerComponents[key] = dynamic(
        () => import(`@/components/nic/blocks/${comp.component}`),
        { ssr: true }
      );
    } catch (error) {
      console.warn(`Konnte Footer-Komponente ${comp.component} nicht laden:`, error);
    }
  }

  // Fallback für Standard-Footer
  if (!footerComponents.default) {
    try {
      footerComponents.default = dynamic(
        () => import('@/components/nic/blocks/footer/DefaultFooter'),
        { ssr: true }
      );
    } catch (error) {
      console.warn('Standard-Footer nicht gefunden');
    }
  }

  return footerComponents;
};
