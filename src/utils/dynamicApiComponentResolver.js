/**
 * Dynamic Component Resolver mit API-basiertem Laden
 * Lädt Komponenten dynamisch und cached sie für bessere Performance
 */

'use client';

import React from 'react';

// Cache für geladene Komponenten
const componentCache = new Map();
const componentRegistry = new Map();
let lastScanTime = 0;
const SCAN_INTERVAL = 10000; // 10 Sekunden

// Fallback Komponente
const FallbackComponent = ({ componentName = 'Unbekannte Komponente', content, ...props }) => (
  <div className="w-full h-full min-h-[60px] flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
    <div className="text-center text-gray-500">
      <div className="text-2xl mb-1">⚠️</div>
      <div className="text-sm font-medium">Komponente nicht gefunden</div>
      <div className="text-xs">{componentName}</div>
      {content && <div className="text-xs mt-1">Content: {String(content).substring(0, 20)}...</div>}
      <div className="text-xs mt-1 text-blue-500 cursor-pointer" onClick={() => refreshComponents()}>
        🔄 Komponenten neu laden
      </div>
    </div>
  </div>
);

/**
 * Lädt verfügbare Komponenten von der API
 */
async function loadComponentRegistry() {
  try {
    console.log('🔍 Loading component registry from API...');

    const response = await fetch('/api/cms/components?action=scan');
    const data = await response.json();

    if (data.success) {
      componentRegistry.clear();

      // Komponenten aus allen Kategorien registrieren
      if (data.components) {
        Object.values(data.components).flat().forEach(component => {
          componentRegistry.set(component.name, {
            name: component.name,
            path: component.path,
            category: component.category,
            importPath: `../../../${component.path}`
          });

          console.log(`📦 Registered component: ${component.name} (${component.category})`);
        });
      }

      lastScanTime = Date.now();
      console.log(`✅ Loaded ${componentRegistry.size} components`);

      return true;
    } else {
      console.error('❌ Failed to load components:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error loading component registry:', error);
    return false;
  }
}

/**
 * Lädt eine einzelne Komponente dynamisch
 */
async function loadComponent(componentInfo) {
  try {
    console.log(`⬇️ Loading component: ${componentInfo.name} from ${componentInfo.importPath}`);

    // Dynamic import der Komponente
    const module = await import(componentInfo.importPath);
    const Component = module.default || module;

    if (!Component) {
      throw new Error('No default export found');
    }

    console.log(`✅ Successfully loaded: ${componentInfo.name}`);
    return Component;

  } catch (error) {
    console.error(`❌ Failed to load component ${componentInfo.name}:`, error);
    return null;
  }
}

/**
 * Aktualisiert die Component Registry falls nötig
 */
async function updateRegistryIfNeeded() {
  const now = Date.now();

  if (componentRegistry.size === 0 || (now - lastScanTime) > SCAN_INTERVAL) {
    await loadComponentRegistry();
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

  // Registry aktualisieren falls nötig
  await updateRegistryIfNeeded();

  // Prüfe Cache
  if (componentCache.has(componentName)) {
    console.log(`💾 Using cached component: ${componentName}`);
    return componentCache.get(componentName);
  }

  // Name-Mapping für bessere Kompatibilität
  const nameCandidates = [
    componentName,
    `${componentName}Block`,
    componentName.replace('Block', ''),
    componentName.toLowerCase(),
    componentName.charAt(0).toUpperCase() + componentName.slice(1),
    componentName.charAt(0).toLowerCase() + componentName.slice(1)
  ];

  // Versuche alle Name-Kandidaten
  for (const candidateName of nameCandidates) {
    if (componentRegistry.has(candidateName)) {
      const componentInfo = componentRegistry.get(candidateName);

      try {
        const Component = await loadComponent(componentInfo);

        if (Component) {
          // In Cache speichern
          componentCache.set(componentName, Component);
          componentCache.set(candidateName, Component); // Auch unter gefundenem Namen cachen

          console.log(`✅ Resolved "${componentName}" as "${candidateName}"`);
          return Component;
        }
      } catch (error) {
        console.error(`❌ Failed to load candidate ${candidateName}:`, error);
        continue;
      }
    }
  }

  // Fallback
  console.warn(`⚠️ Component "${componentName}" not found in registry, using fallback`);
  console.log('📋 Available components:', Array.from(componentRegistry.keys()));

  return (props) => <FallbackComponent {...props} componentName={componentName} />;
};

/**
 * Synchrone Version für bessere Performance (nur Cache)
 */
export const resolveComponentSync = (componentName) => {
  console.log('🔍 Resolving component (sync):', componentName);

  if (!componentName) {
    return FallbackComponent;
  }

  // Prüfe Cache
  if (componentCache.has(componentName)) {
    console.log(`💾 Using cached component: ${componentName}`);
    return componentCache.get(componentName);
  }

  // Name-Mapping für Cache
  const nameCandidates = [
    componentName,
    `${componentName}Block`,
    componentName.replace('Block', ''),
    componentName.toLowerCase(),
    componentName.charAt(0).toUpperCase() + componentName.slice(1),
    componentName.charAt(0).toLowerCase() + componentName.slice(1)
  ];

  for (const candidateName of nameCandidates) {
    if (componentCache.has(candidateName)) {
      console.log(`💾 Using cached component via mapping: ${candidateName} for ${componentName}`);
      return componentCache.get(candidateName);
    }
  }

  // Fallback mit Hinweis auf asynchrones Laden
  console.warn(`⚠️ Component "${componentName}" not in cache, async loading required`);

  return (props) => {
    const [Component, setComponent] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      resolveComponent(componentName).then((ResolvedComponent) => {
        setComponent(() => ResolvedComponent);
        setLoading(false);
      });
    }, [componentName]);

    if (loading) {
      return (
        <div className="w-full h-full min-h-[60px] flex items-center justify-center bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-center text-blue-600">
            <div className="text-sm">🔄 Lade Komponente...</div>
            <div className="text-xs">{componentName}</div>
          </div>
        </div>
      );
    }

    return Component ? <Component {...props} /> : <FallbackComponent {...props} componentName={componentName} />;
  };
};

/**
 * Preload häufig verwendete Komponenten
 */
export const preloadCommonComponents = async () => {
  await updateRegistryIfNeeded();

  const commonComponents = ['Text', 'Button', 'Image', 'Container', 'Heading', 'Paragraph'];

  for (const componentName of commonComponents) {
    if (componentRegistry.has(componentName) && !componentCache.has(componentName)) {
      try {
        await resolveComponent(componentName);
        console.log(`✅ Preloaded: ${componentName}`);
      } catch (error) {
        console.error(`❌ Failed to preload ${componentName}:`, error);
      }
    }
  }
};

/**
 * Alle verfügbaren Komponenten auflisten
 */
export const listAvailableComponents = async () => {
  await updateRegistryIfNeeded();
  return Array.from(componentRegistry.keys());
};

/**
 * Component Registry manuell aktualisieren
 */
export const refreshComponents = async () => {
  console.log('🔄 Manually refreshing component registry...');
  componentCache.clear();
  componentRegistry.clear();
  lastScanTime = 0;
  await loadComponentRegistry();
  return Array.from(componentRegistry.keys());
};

/**
 * Cache leeren
 */
export const clearComponentCache = () => {
  componentCache.clear();
  console.log('🗑️ Component cache cleared');
};

/**
 * Debug-Informationen
 */
export const getDebugInfo = () => {
  return {
    cacheSize: componentCache.size,
    registrySize: componentRegistry.size,
    lastScanTime: new Date(lastScanTime).toISOString(),
    cachedComponents: Array.from(componentCache.keys()),
    registeredComponents: Array.from(componentRegistry.keys())
  };
};

/**
 * Legacy-Kompatibilität
 */
export default {
  resolveComponent: resolveComponentSync,
  preloadComponents: preloadCommonComponents,
  listAvailableComponents,
  refreshComponents,
  clearCache: clearComponentCache,
  getDebugInfo
};
