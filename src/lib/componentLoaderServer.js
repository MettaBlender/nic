// Server-side utility for dynamic loading of CMS components
import fs from 'fs';
import path from 'path';
import dynamic from 'next/dynamic';

/**
 * Server-side function for scanning available components
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
          // Recursively scan subdirectories
          components.push(...scanDirectory(fullPath, relativePath));
        } else if (item.isFile() && /\.(jsx?|tsx?)$/.test(item.name)) {
          // Only React component files
          const componentName = item.name.replace(/\.(jsx?|tsx?)$/, '');

          // Try to extract metadata from the file
          let icon = '🧩';
          let description = 'Component';

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
            console.warn(`Could not read metadata for ${relativePath}:`, error);
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
    console.error('Error scanning components:', error);
    return [];
  }
};

/**
 * Creates dynamic imports for all available components
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

      // Also make available under componentName
      if (comp.componentName !== comp.name) {
        components[comp.componentName] = components[comp.name];
      }

      // Short names without "Block" suffix for backward compatibility
      if (comp.component.endsWith('Block')) {
        const shortName = comp.component.replace('Block', '');
        components[shortName] = components[comp.name];
      }

    } catch (error) {
      console.warn(`Konnte Komponente ${comp.component} nicht laden:`, error);

      // Fallback-Komponente
      components[comp.name] = () => (
        <div className="text-red-500 p-4 border border-red-300 rounded">
          <div className="font-bold">Component not available</div>
          <div className="text-sm">Type: {comp.name}</div>
        </div>
      );
    }
  }

  return components;
};

/**
 * Special function for header components
 */
export const createDynamicHeaderComponents = () => {
  const availableComponents = getAvailableComponentsServer();
  const headerComponents = {};

  const headers = availableComponents.filter(comp =>
    comp.category === 'header' || comp.component.includes('header') || comp.name.toLowerCase().includes('header')
  );

  for (const comp of headers) {
    try {
      // Create more meaningful keys
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

  // Fallback for default header
  if (!headerComponents.default) {
    try {
      headerComponents.default = dynamic(
        () => import('@/components/nic/cms/header/DefaultHeader'),
        { ssr: true }
      );
    } catch (error) {
      console.warn('Standard-Header nicht gefunden');
    }
  }

  return headerComponents;
};

/**
 * Special function for footer components
 */
export const createDynamicFooterComponents = () => {
  const availableComponents = getAvailableComponentsServer();
  const footerComponents = {};

  const footers = availableComponents.filter(comp =>
    comp.category === 'footer' || comp.component.includes('footer') || comp.name.toLowerCase().includes('footer')
  );

  for (const comp of footers) {
    try {
      // Create more meaningful keys
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

  // Fallback for default footer
  if (!footerComponents.default) {
    try {
      footerComponents.default = dynamic(
        () => import('@/components/nic/cms/footer/DefaultFooter'),
        { ssr: true }
      );
    } catch (error) {
      console.warn('Standard-Footer nicht gefunden');
    }
  }

  return footerComponents;
};
