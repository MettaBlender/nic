/**
 * Dynamic File System Component Resolver
 * Lädt Komponenten dynamisch aus dem Dateisystem
 * Scannt automatisch nach neuen Komponenten
 */

import { readdir } from 'fs/promises';
import { join } from 'path';
import React from 'react';

// Cache für geladene Komponenten
const componentCache = new Map();
const lastScanTime = { value: 0 };
const SCAN_INTERVAL = 5000; // 5 Sekunden

// Fallback Komponente
const FallbackComponent = ({ componentName = 'Unbekannte Komponente', content }) => (
  <div className="w-full h-full min-h-[60px] flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
    <div className="text-center text-gray-500">
      <div className="text-2xl mb-1">⚠️</div>
      <div className="text-sm font-medium">Komponente nicht gefunden</div>
      <div className="text-xs">{componentName}</div>
      {content && <div className="text-xs mt-1">Content: {String(content).substring(0, 20)}...</div>}
    </div>
  </div>
);

/**
 * Scannt alle .jsx Dateien in dem blocks Verzeichnis
 */
async function scanForComponents() {
  const blocksPath = join(process.cwd(), 'src', 'components', 'nic', 'blocks');
  const components = new Map();

  try {
    // Haupt-Verzeichnis scannen
    const mainFiles = await readdir(blocksPath);

    for (const file of mainFiles) {
      if (file.endsWith('.jsx') && !file.startsWith('fallback') && !file.startsWith('test-')) {
        const componentName = file.replace('.jsx', '');
        const componentPath = `../components/nic/blocks/${file}`;
        components.set(componentName, componentPath);
        console.log(`📦 Found component: ${componentName} at ${componentPath}`);
      }
    }

    // Sub-Verzeichnisse scannen
    const subDirs = ['media', 'layout', 'forms', 'header', 'footer', 'Aaron'];

    for (const subDir of subDirs) {
      try {
        const subDirPath = join(blocksPath, subDir);
        const subFiles = await readdir(subDirPath);

        for (const file of subFiles) {
          if (file.endsWith('.jsx')) {
            const componentName = file.replace('.jsx', '');
            const componentPath = `../components/nic/blocks/${subDir}/${file}`;
            components.set(componentName, componentPath);
            console.log(`📦 Found component: ${componentName} at ${componentPath}`);
          }
        }
      } catch (error) {
        // Sub-Verzeichnis existiert nicht oder ist nicht zugänglich
        console.log(`📁 Skipping ${subDir}: ${error.message}`);
      }
    }

    console.log(`🔍 Total components found: ${components.size}`);
    return components;

  } catch (error) {
    console.error('❌ Error scanning for components:', error);
    return new Map();
  }
}

/**
 * Lädt eine Komponente dynamisch
 */
async function loadComponent(componentPath) {
  try {
    // Dynamic import für die Komponente
    const module = await import(componentPath);
    return module.default || module;
  } catch (error) {
    console.error(`❌ Failed to load component from ${componentPath}:`, error);
    return null;
  }
}

/**
 * Aktualisiert den Component Cache
 */
async function updateComponentCache() {
  const now = Date.now();

  // Nur scannen wenn genug Zeit vergangen ist
  if (now - lastScanTime.value < SCAN_INTERVAL) {
    return;
  }

  lastScanTime.value = now;
  console.log('🔄 Updating component cache...');

  const discoveredComponents = await scanForComponents();

  // Cache leeren und neu aufbauen
  componentCache.clear();

  for (const [name, path] of discoveredComponents) {
    componentCache.set(name, { path, component: null, loaded: false });
  }

  // Häufig verwendete Komponenten vorladen
  const preloadComponents = ['Text', 'Button', 'Image', 'Container'];

  for (const name of preloadComponents) {
    if (componentCache.has(name)) {
      const entry = componentCache.get(name);
      try {
        entry.component = await loadComponent(entry.path);
        entry.loaded = true;
        console.log(`✅ Preloaded component: ${name}`);
      } catch (error) {
        console.error(`❌ Failed to preload ${name}:`, error);
      }
    }
  }
}

/**
 * Löst eine Komponente basierend auf dem Namen auf
 */
export const resolveComponent = async (componentName) => {
  console.log('🔍 Resolving component:', componentName);

  if (!componentName) {
    console.warn('⚠️ No component name provided, using fallback');
    return FallbackComponent;
  }

  // Cache aktualisieren falls nötig
  await updateComponentCache();

  // Prüfe Cache
  if (componentCache.has(componentName)) {
    const entry = componentCache.get(componentName);

    if (!entry.loaded) {
      // Komponente nachladen
      try {
        entry.component = await loadComponent(entry.path);
        entry.loaded = true;
        console.log(`✅ Loaded component: ${componentName}`);
      } catch (error) {
        console.error(`❌ Failed to load ${componentName}:`, error);
        return (props) => <FallbackComponent {...props} componentName={componentName} />;
      }
    }

    if (entry.component) {
      return entry.component;
    }
  }

  // Verschiedene Name-Mappings versuchen
  const nameMappings = [
    componentName,
    `${componentName}Block`,
    componentName.replace('Block', ''),
    componentName.toLowerCase(),
    componentName.charAt(0).toUpperCase() + componentName.slice(1)
  ];

  for (const mappedName of nameMappings) {
    if (componentCache.has(mappedName)) {
      const entry = componentCache.get(mappedName);

      if (!entry.loaded) {
        try {
          entry.component = await loadComponent(entry.path);
          entry.loaded = true;
          console.log(`✅ Loaded component via mapping: ${mappedName} for ${componentName}`);
        } catch (error) {
          continue;
        }
      }

      if (entry.component) {
        return entry.component;
      }
    }
  }

  // Fallback
  console.warn(`⚠️ Component "${componentName}" not found, using fallback`);
  return (props) => <FallbackComponent {...props} componentName={componentName} />;
};

/**
 * Synchrone Version für bessere Performance (verwendet Cache)
 */
export const resolveComponentSync = (componentName) => {
  console.log('🔍 Resolving component (sync):', componentName);

  if (!componentName) {
    console.warn('⚠️ No component name provided, using fallback');
    return FallbackComponent;
  }

  // Prüfe Cache
  if (componentCache.has(componentName)) {
    const entry = componentCache.get(componentName);

    if (entry.loaded && entry.component) {
      console.log(`✅ Found cached component: ${componentName}`);
      return entry.component;
    }
  }

  // Name-Mappings für Cache
  const nameMappings = [
    componentName,
    `${componentName}Block`,
    componentName.replace('Block', ''),
    componentName.toLowerCase(),
    componentName.charAt(0).toUpperCase() + componentName.slice(1)
  ];

  for (const mappedName of nameMappings) {
    if (componentCache.has(mappedName)) {
      const entry = componentCache.get(mappedName);

      if (entry.loaded && entry.component) {
        console.log(`✅ Found cached component via mapping: ${mappedName} for ${componentName}`);
        return entry.component;
      }
    }
  }

  // Fallback
  console.warn(`⚠️ Component "${componentName}" not found in cache, using fallback`);
  return (props) => <FallbackComponent {...props} componentName={componentName} />;
};

/**
 * Preload alle verfügbaren Komponenten
 */
export const preloadAllComponents = async () => {
  await updateComponentCache();

  const availableComponents = Array.from(componentCache.keys());
  console.log('📦 Available components:', availableComponents);

  return availableComponents;
};

/**
 * Cache manuell leeren
 */
export const clearComponentCache = () => {
  componentCache.clear();
  lastScanTime.value = 0;
  console.log('🗑️ Component cache cleared');
};

/**
 * Initialisierung beim ersten Import
 */
(async () => {
  if (typeof window === 'undefined') {
    // Nur auf dem Server beim ersten Import laden
    await updateComponentCache();
  }
})();

/**
 * Legacy-Kompatibilität
 */
export default {
  resolveComponent: resolveComponentSync, // Sync für bessere Performance
  preloadComponents: preloadAllComponents,
  clearCache: clearComponentCache
};
