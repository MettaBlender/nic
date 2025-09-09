// Utility functions for dynamic loading of CMS components
import { useState, useEffect } from 'react';

/**
 * Loads available components via API
 */
export const loadAvailableComponents = async () => {
  try {
    const response = await fetch('/api/cms/components');
    const data = await response.json();

    if (data.success) {
      const components = [];

      // Flatten categories to a list of components
      Object.entries(data.categories).forEach(([category, categoryComponents]) => {
        categoryComponents.forEach(comp => {
          components.push({
            name: comp.name,
            componentName: comp.componentName,
            component: category === 'root' ? comp.file.replace(/\.(jsx?|tsx?)$/, '') : `${category}/${comp.file.replace(/\.(jsx?|tsx?)$/, '')}`,
            icon: comp.icon || '🧩',
            description: comp.description || 'Block Component',
            category: category,
            width: comp.width || 2,
            height: comp.height || 1,
            options: comp.options || {}
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
    console.error('Error loading component list:', error);
  }

  return {
    success: false,
    components: [],
    categories: {}
  };
};

/**
 * Loads a specific component dynamically
 */
export const loadComponent = async (componentPath) => {
  try {
    const moduleResult = await import(`@/components/nic/blocks/${componentPath}`);
    return {
      success: true,
      component: moduleResult.default
    };
  } catch (error) {
    console.error(`Error loading component ${componentPath}:`, error);
    return {
      success: false,
      component: null,
      error: error.message
    };
  }
};

/**
 * Loads all available components and returns them as an object
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
      // Different names for backward compatibility
      loadedComponents[comp.name] = component;
      loadedComponents[comp.componentName] = component;

      // Short names without "Block" suffix
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
 * Hook for React components to load components dynamically
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
          setError('Error loading components');
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
