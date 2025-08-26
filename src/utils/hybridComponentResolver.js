/**
 * Improved Dynamic Component Resolver
 * Lädt Komponenten zur Build-Zeit und Runtime dynamisch
 */

'use client';

import React from 'react';

// Static imports für bessere Performance
import Text from '../components/nic/blocks/Text.jsx';
import ButtonBlock from '../components/nic/blocks/ButtonBlock.jsx';
import ImageBlock from '../components/nic/blocks/ImageBlock.jsx';
import ContainerBlock from '../components/nic/blocks/ContainerBlock.jsx';
import VideoBlock from '../components/nic/blocks/VideoBlock.jsx';

// Cache für dynamisch geladene Komponenten
const dynamicComponentCache = new Map();
const componentRegistry = new Map();

// Fallback Komponente
const FallbackComponent = ({ componentName = 'Unbekannte Komponente', content, ...props }) => (
  <div className="w-full h-full min-h-[60px] flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
    <div className="text-center text-gray-500">
      <div className="text-2xl mb-1">⚠️</div>
      <div className="text-sm font-medium">Komponente nicht gefunden</div>
      <div className="text-xs">{componentName}</div>
      {content && <div className="text-xs mt-1">Content: {String(content).substring(0, 20)}...</div>}
      <div className="text-xs mt-1 text-blue-500 cursor-pointer" onClick={() => window.location.reload()}>
        🔄 Seite neu laden
      </div>
    </div>
  </div>
);

// Add display name for ESLint
FallbackComponent.displayName = 'FallbackComponent';

// Statische Komponenten-Map (garantiert verfügbar)
const STATIC_COMPONENTS = {
  Text: Text,
  Heading: Text,
  Paragraph: Text,
  Button: ButtonBlock,
  Image: ImageBlock,
  Container: ContainerBlock,
  Video: VideoBlock
};

// Dynamische Komponenten-Pfade
const DYNAMIC_COMPONENT_PATHS = {
  GalleryBlock: () => import('../components/nic/blocks/media/GalleryBlock.jsx'),
  Gallery: () => import('../components/nic/blocks/media/GalleryBlock.jsx'),
  AudioBlock: () => import('../components/nic/blocks/media/AudioBlock.jsx'),
  Audio: () => import('../components/nic/blocks/media/AudioBlock.jsx'),
  ColumnsBlock: () => import('../components/nic/blocks/layout/ColumnsBlock.jsx'),
  Columns: () => import('../components/nic/blocks/layout/ColumnsBlock.jsx'),
  GridBlock: () => import('../components/nic/blocks/layout/GridBlock.jsx'),
  Grid: () => import('../components/nic/blocks/layout/GridBlock.jsx'),
  ContactFormBlock: () => import('../components/nic/blocks/forms/ContactFormBlock.jsx'),
  ContactForm: () => import('../components/nic/blocks/forms/ContactFormBlock.jsx'),
  NewsletterBlock: () => import('../components/nic/blocks/forms/NewsletterBlock.jsx'),
  Newsletter: () => import('../components/nic/blocks/forms/NewsletterBlock.jsx'),
  DefaultHeader: () => import('../components/nic/blocks/header/DefaultHeader.jsx'),
  NavigationHeader: () => import('../components/nic/blocks/header/NavigationHeader.jsx'),
  DefaultFooter: () => import('../components/nic/blocks/footer/DefaultFooter.jsx'),
  SocialFooter: () => import('../components/nic/blocks/footer/SocialFooter.jsx'),
  Aaron: () => import('../components/nic/blocks/Aaron/Aaron.jsx')
};

/**
 * Lädt eine dynamische Komponente
 */
async function loadDynamicComponent(componentName) {
  // Prüfe Cache
  if (dynamicComponentCache.has(componentName)) {
    return dynamicComponentCache.get(componentName);
  }

  // Prüfe ob dynamischer Pfad existiert
  if (DYNAMIC_COMPONENT_PATHS[componentName]) {
    try {
      console.log(`⬇️ Loading dynamic component: ${componentName}`);

      const moduleResult = await DYNAMIC_COMPONENT_PATHS[componentName]();
      const Component = moduleResult.default || moduleResult;

      if (Component) {
        dynamicComponentCache.set(componentName, Component);
        console.log(`✅ Successfully loaded dynamic component: ${componentName}`);
        return Component;
      }
    } catch (error) {
      console.error(`❌ Failed to load dynamic component ${componentName}:`, error);
    }
  }

  return null;
}

/**
 * Löst eine Komponente basierend auf dem Namen auf (synchron)
 */
export const resolveComponentSync = (componentName) => {
  console.log('🔍 Resolving component (sync):', componentName);

  if (!componentName) {
    return FallbackComponent;
  }

  // 1. Prüfe statische Komponenten zuerst (sofort verfügbar)
  if (STATIC_COMPONENTS[componentName]) {
    console.log(`✅ Found static component: ${componentName}`);
    return STATIC_COMPONENTS[componentName];
  }

  // 2. Name-Mapping für statische Komponenten
  const staticMappings = [
    componentName.replace('Block', ''),
    componentName + 'Block',
    componentName.toLowerCase(),
    componentName.charAt(0).toUpperCase() + componentName.slice(1)
  ];

  for (const mappedName of staticMappings) {
    if (STATIC_COMPONENTS[mappedName]) {
      console.log(`✅ Found static component via mapping: ${mappedName} for ${componentName}`);
      return STATIC_COMPONENTS[mappedName];
    }
  }

  // 3. Prüfe dynamischen Cache
  if (dynamicComponentCache.has(componentName)) {
    console.log(`💾 Found cached dynamic component: ${componentName}`);
    return dynamicComponentCache.get(componentName);
  }

  // 4. Prüfe dynamische Komponenten mit Name-Mapping
  const dynamicMappings = [
    componentName,
    componentName + 'Block',
    componentName.replace('Block', ''),
    componentName.toLowerCase(),
    componentName.charAt(0).toUpperCase() + componentName.slice(1)
  ];

  for (const mappedName of dynamicMappings) {
    if (dynamicComponentCache.has(mappedName)) {
      console.log(`💾 Found cached dynamic component via mapping: ${mappedName} for ${componentName}`);
      return dynamicComponentCache.get(mappedName);
    }
  }

  // 5. Versuche asynchrones Laden für dynamische Komponenten
  // Erstelle eine Wrapper-Komponente die async lädt
  const AsyncComponentWrapper = function(props) {
    const [Component, setComponent] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
      let mounted = true;

      const loadComponent = async () => {
        try {
          // Versuche alle möglichen Namen
          for (const mappedName of dynamicMappings) {
            if (DYNAMIC_COMPONENT_PATHS[mappedName]) {
              const LoadedComponent = await loadDynamicComponent(mappedName);
              if (LoadedComponent && mounted) {
                setComponent(() => LoadedComponent);
                setLoading(false);
                return;
              }
            }
          }

          // Keine Komponente gefunden
          if (mounted) {
            setError(`Component "${componentName}" not found`);
            setLoading(false);
          }
        } catch (err) {
          if (mounted) {
            setError(err.message);
            setLoading(false);
          }
        }
      };

      loadComponent();

      return () => {
        mounted = false;
      };
    }, []);

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

    if (error || !Component) {
      return <FallbackComponent {...props} componentName={componentName} />;
    }

    return <Component {...props} />;
  };

  AsyncComponentWrapper.displayName = `AsyncComponentWrapper_${componentName}`;
  return AsyncComponentWrapper;
};

/**
 * Preload häufig verwendete dynamische Komponenten
 */
export const preloadCommonComponents = async () => {
  console.log('📦 Preloading common dynamic components...');

  const commonDynamic = ['Gallery', 'Columns', 'ContactForm'];

  for (const componentName of commonDynamic) {
    try {
      await loadDynamicComponent(componentName);
    } catch (error) {
      console.error(`Failed to preload ${componentName}:`, error);
    }
  }

  console.log('✅ Common components preloaded');
};

/**
 * Alle verfügbaren Komponenten auflisten
 */
export const listAvailableComponents = () => {
  const staticComponents = Object.keys(STATIC_COMPONENTS);
  const dynamicComponents = Object.keys(DYNAMIC_COMPONENT_PATHS);
  const cachedDynamic = Array.from(dynamicComponentCache.keys());

  return {
    static: staticComponents,
    dynamic: dynamicComponents,
    cached: cachedDynamic,
    total: staticComponents.length + dynamicComponents.length
  };
};

/**
 * Cache aktualisieren (alle dynamischen Komponenten neu laden)
 */
export const refreshComponents = async () => {
  console.log('🔄 Refreshing dynamic components...');

  // Cache leeren
  dynamicComponentCache.clear();

  // Häufige Komponenten neu laden
  await preloadCommonComponents();

  const available = listAvailableComponents();
  console.log('✅ Components refreshed:', available);

  return available.static.concat(available.dynamic);
};

/**
 * Debug-Informationen
 */
export const getDebugInfo = () => {
  const available = listAvailableComponents();

  return {
    static: available.static,
    dynamic: available.dynamic,
    cached: available.cached,
    totalStatic: available.static.length,
    totalDynamic: available.dynamic.length,
    totalCached: available.cached.length,
    cacheSize: dynamicComponentCache.size
  };
};

// Legacy-Kompatibilität
const hybridComponentResolverDefault = {
  resolveComponent: resolveComponentSync,
  preloadComponents: preloadCommonComponents,
  listAvailableComponents,
  refreshComponents,
  getDebugInfo
};

export default hybridComponentResolverDefault;
