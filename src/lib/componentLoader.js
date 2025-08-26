// Utility-Funktionen für dynamisches Laden von CMS-Komponenten
import { useState, useEffect } from 'react';

/**
 * Lädt die verfügbaren Komponenten über die API
 */
export const loadAvailableComponents = async () => {
  try {
    const response = await fetch('/api/cms/components');
    const data = await response.json();

    if (data.success) {
      const components = [];

      // Flatten die Kategorien zu einer Liste von Komponenten
      Object.entries(data.categories).forEach(([category, categoryComponents]) => {
        categoryComponents.forEach(comp => {
          components.push({
            name: comp.name,
            componentName: comp.componentName,
            component: category === 'root' ? comp.file.replace(/\.(jsx?|tsx?)$/, '') : `${category}/${comp.file.replace(/\.(jsx?|tsx?)$/, '')}`,
            icon: comp.icon || '🧩',
            description: comp.description || 'Block-Komponente',
            category: category
          });
        });
      });

      return {
        success: true,
        components,
        categories: data.categories
      };
    }
  } catch (error) {
    console.error('Fehler beim Laden der Komponenten-Liste:', error);
  }

  return {
    success: false,
    components: [],
    categories: {}
  };
};

/**
 * Lädt eine spezifische Komponente dynamisch
 */
export const loadComponent = async (componentPath) => {
  try {
    const moduleResult = await import(`@/components/nic/blocks/${componentPath}`);
    return {
      success: true,
      component: moduleResult.default
    };
  } catch (error) {
    console.error(`Fehler beim Laden der Komponente ${componentPath}:`, error);
    return {
      success: false,
      component: null,
      error: error.message
    };
  }
};

/**
 * Lädt alle verfügbaren Komponenten und gibt sie als Objekt zurück
 */
export const loadAllComponents = async () => {
  const { success, components } = await loadAvailableComponents();

  if (!success) {
    return { success: false, components: {} };
  }

  const loadedComponents = {};

  for (const comp of components) {
    const { success: loadSuccess, component } = await loadComponent(comp.component);

    if (loadSuccess) {
      // Verschiedene Bezeichnungen für Backward-Compatibility
      loadedComponents[comp.name] = component;
      loadedComponents[comp.componentName] = component;

      // Kurze Namen ohne "Block" Suffix
      if (comp.component.endsWith('Block')) {
        const shortName = comp.component.replace('Block', '');
        loadedComponents[shortName] = component;
      }
    }
  }

  return {
    success: true,
    components: loadedComponents,
    availableComponents: components
  };
};

/**
 * Hook für React-Komponenten um Komponenten dynamisch zu laden
 */
export const useDynamicComponents = () => {
  const [components, setComponents] = useState({});
  const [availableComponents, setAvailableComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await loadAllComponents();

        if (result.success) {
          setComponents(result.components);
          setAvailableComponents(result.availableComponents);
        } else {
          setError('Fehler beim Laden der Komponenten');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return {
    components,
    availableComponents,
    loading,
    error,
    reload: () => {
      const load = async () => {
        const result = await loadAllComponents();
        if (result.success) {
          setComponents(result.components);
          setAvailableComponents(result.availableComponents);
        }
      };
      load();
    }
  };
};
