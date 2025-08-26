/**
 * Component Loader Utility
 *
 * Handles dynamic loading of block components with fallback
 */

import dynamic from 'next/dynamic';

const componentCache = {};

/**
 * Dynamisch lade eine Block-Komponente
 * @param {string} componentName - Name der Komponente
 * @param {string} category - Kategorie/Unterordner (optional)
 * @returns {React.Component} - Die geladene Komponente
 */
export const loadBlockComponent = (componentName, category = '') => {
  const cacheKey = category ? `${category}/${componentName}` : componentName;

  if (!componentCache[cacheKey]) {
    componentCache[cacheKey] = dynamic(
      async () => {
        try {
          let componentPath;

          if (category && category !== 'root') {
            // Komponente aus Unterordner laden
            componentPath = `../components/nic/blocks/${category}/${componentName}.jsx`;
          } else {
            // Komponente aus Hauptordner laden
            componentPath = `../components/nic/blocks/${componentName}.jsx`;
          }

          const component = await import(componentPath);
          return component.default || component;
        } catch (error) {
          console.warn(`Komponente ${componentName} in ${category || 'root'} nicht gefunden:`, error);
          // Fallback zur fallback Komponente
          try {
            const fallback = await import('../components/nic/blocks/fallback.jsx');
            const FallbackWrapper = (props) => fallback.default({ ...props, componentName: cacheKey });
            FallbackWrapper.displayName = `FallbackWrapper_${cacheKey}`;
            return FallbackWrapper;
          } catch (fallbackError) {
            console.error('Fallback-Komponente nicht gefunden:', fallbackError);
            const ErrorComponent = () => (
              <div className="p-4 bg-red-100 border border-red-300 rounded text-red-700">
                <div className="font-bold">Fehler beim Laden der Komponente</div>
                <div className="text-sm">{cacheKey}</div>
              </div>
            );
            ErrorComponent.displayName = `ErrorComponent_${cacheKey}`;
            return ErrorComponent;
          }
        }
      },
      {
        ssr: false,
        loading: function LoadingComponent() {
          return (
            <div className="animate-pulse bg-gray-200 rounded p-4 flex items-center justify-center">
              <div className="text-gray-500 text-sm">Lädt {componentName}...</div>
            </div>
          );
        }
      }
    );
  }

  return componentCache[cacheKey];
};

/**
 * Erweiterte Komponentenlader für GridCanvas
 * @param {string} componentName - Name der Komponente
 * @returns {React.Component} - Die geladene Komponente
 */
export const loadGridComponent = (componentName) => {
  if (!componentName) {
    const NoNameComponent = () => <div className="p-2 text-gray-500">Kein Component Name</div>;
    NoNameComponent.displayName = 'NoNameComponent';
    return NoNameComponent;
  }

  const cacheKey = `grid_${componentName}`;

  if (!componentCache[cacheKey]) {
    componentCache[cacheKey] = dynamic(
      async () => {
        // Versuche verschiedene Pfade für GridCanvas (src/components/nic/cms)
        const possiblePaths = [
          `../blocks/${componentName}.jsx`,
          `../blocks/${componentName}`,
          `../blocks/layout/${componentName}.jsx`,
          `../blocks/forms/${componentName}.jsx`,
          `../blocks/media/${componentName}.jsx`,
          `../blocks/header/${componentName}.jsx`,
          `../blocks/footer/${componentName}.jsx`,
          `../blocks/Aaron/${componentName}.jsx`,
        ];

        for (const path of possiblePaths) {
          try {
            const component = await import(path);
            return component.default || component;
          } catch (error) {
            // Versuche nächsten Pfad
            continue;
          }
        }

        // Wenn alle Pfade fehlschlagen, lade Fallback
        console.warn(`Komponente ${componentName} in keinem Pfad gefunden`);
        const fallback = await import('../blocks/fallback.jsx');
        return (props) => fallback.default({ ...props, componentName });
      },
      {
        ssr: false,
        loading: () => (
          <div className="animate-pulse bg-gray-200 rounded p-2 h-full flex items-center justify-center">
            <div className="text-gray-500 text-xs">Lädt...</div>
          </div>
        )
      }
    );
  }

  return componentCache[cacheKey];
};

/**
 * Cache leeren (für Development)
 */
export const clearComponentCache = () => {
  Object.keys(componentCache).forEach(key => {
    delete componentCache[key];
  });
};

const componentLoaderExport = {
  loadBlockComponent,
  loadGridComponent,
  clearComponentCache
};

export default componentLoaderExport;
