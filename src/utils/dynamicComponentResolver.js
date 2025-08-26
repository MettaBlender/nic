/**
 * Dynamic Component Resolver
 *
 * Lädt Komponenten dynamisch basierend auf der API-Response
 */

import dynamic from 'next/dynamic';
import FallbackBlock from '../components/nic/blocks/fallback.jsx';

// Cache für geladene Komponenten
const componentCache = {};
let availableComponents = null;

/**
 * Lade verfügbare Komponenten von der API
 */
const loadAvailableComponents = async () => {
  if (availableComponents) return availableComponents;

  try {
    const response = await fetch('/api/cms/components');
    const data = await response.json();

    if (data.success) {
      availableComponents = data.categories;
      console.log('Verfügbare Komponenten geladen:', availableComponents);
      return availableComponents;
    }
  } catch (error) {
    console.error('Fehler beim Laden der verfügbaren Komponenten:', error);
  }

  return {};
};

/**
 * Finde Komponente in den verfügbaren Kategorien
 */
const findComponentInCategories = (componentName, categories) => {
  for (const [categoryName, components] of Object.entries(categories)) {
    const component = components.find(comp =>
      comp.componentName === componentName ||
      comp.name === componentName ||
      comp.file.replace(/\.(jsx?|tsx?)$/, '') === componentName
    );

    if (component) {
      return { component, category: categoryName };
    }
  }
  return null;
};

/**
 * Erstelle dynamischen Import-Pfad
 */
const createImportPath = (componentName, category) => {
  if (category === 'root') {
    return `../components/nic/blocks/${componentName}`;
  } else {
    return `../components/nic/blocks/${category}/${componentName}`;
  }
};

/**
 * Resolve a component by name (dynamisch)
 * @param {string} componentName - Name of the component to resolve
 * @returns {React.Component} - The resolved component or fallback
 */
export const resolveComponent = (componentName) => {
  if (!componentName) {
    return FallbackBlock;
  }

  const cacheKey = componentName;

  // Prüfe Cache
  if (componentCache[cacheKey]) {
    return componentCache[cacheKey];
  }

  // Erstelle dynamische Komponente
  componentCache[cacheKey] = dynamic(
    async () => {
      try {
        // Lade verfügbare Komponenten
        const categories = await loadAvailableComponents();

        // Finde Komponente in Kategorien
        const found = findComponentInCategories(componentName, categories);

        if (found) {
          const { component, category } = found;
          const fileName = component.file.replace(/\.(jsx?|tsx?)$/, '');
          const importPath = createImportPath(fileName, category);

          console.log(`Lade Komponente: ${componentName} von ${importPath}`);

          // Versuche Import
          const module = await import(importPath);
          return module.default || module;
        }

        // Fallback wenn nicht gefunden
        console.warn(`Komponente "${componentName}" nicht in API gefunden, verwende Fallback`);
        return (props) => <FallbackBlock {...props} componentName={componentName} />;

      } catch (error) {
        console.error(`Fehler beim Laden der Komponente "${componentName}":`, error);
        return (props) => <FallbackBlock {...props} componentName={componentName} />;
      }
    },
    {
      ssr: false,
      loading: () => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}>
          <div style={{
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Lädt {String(componentName)}...
          </div>
        </div>
      )
    }
  );

  return componentCache[cacheKey];
};

/**
 * Vorab-Laden aller verfügbaren Komponenten
 */
export const preloadComponents = async () => {
  try {
    const categories = await loadAvailableComponents();

    // Erstelle alle Komponenten im Cache
    Object.values(categories).flat().forEach(component => {
      if (!componentCache[component.componentName]) {
        resolveComponent(component.componentName);
      }
    });

    console.log('Alle Komponenten vorab geladen');
  } catch (error) {
    console.error('Fehler beim Vorab-Laden der Komponenten:', error);
  }
};

/**
 * Cache leeren
 */
export const clearComponentCache = () => {
  Object.keys(componentCache).forEach(key => {
    delete componentCache[key];
  });
  availableComponents = null;
};

/**
 * Prüfe ob Komponente existiert
 */
export const componentExists = async (componentName) => {
  const categories = await loadAvailableComponents();
  return !!findComponentInCategories(componentName, categories);
};

export default {
  resolveComponent,
  preloadComponents,
  clearComponentCache,
  componentExists
};
