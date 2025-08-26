/**
 * Hybrid Component Resolver
 * Kombiniert dynamische Erkennung mit sync/async Auflösung
 */

'use client';

import { scanAvailableBlocks, getComponent, clearComponentCache } from './dynamicBlockScanner';

// Cache für aufgelöste Komponenten
const resolvedComponentCache = new Map();
const preloadPromises = new Map();

/**
 * Löst eine Komponente synchron auf (verwendet Cache)
 */
export const resolveComponentSync = (componentName) => {
  if (!componentName || typeof componentName !== 'string') {
    console.warn('⚠️ Invalid componentName provided to resolveComponentSync:', componentName);
    return null;
  }

  // Prüfe Cache zuerst
  if (resolvedComponentCache.has(componentName)) {
    return resolvedComponentCache.get(componentName);
  }

  // Fallback für häufige Komponenten
  const fallbackComponents = {
    'Text': () => ({ content, ...props }) => (
      <div style={{ padding: '8px', minHeight: '40px' }} {...props}>
        {content || 'Text Block'}
      </div>
    ),
    'Button': () => ({ content, ...props }) => (
      <button style={{ padding: '8px 16px', cursor: 'pointer' }} {...props}>
        {content || 'Button'}
      </button>
    ),
    'Image': () => ({ content, ...props }) => (
      <div style={{
        padding: '8px',
        background: '#f3f4f6',
        textAlign: 'center',
        minHeight: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }} {...props}>
        {content || '🖼️ Image Block'}
      </div>
    ),
    'Container': () => ({ children, content, ...props }) => (
      <div style={{ padding: '16px', border: '1px dashed #d1d5db' }} {...props}>
        {children || content || 'Container Block'}
      </div>
    )
  };

  if (fallbackComponents[componentName]) {
    const component = fallbackComponents[componentName]();
    resolvedComponentCache.set(componentName, component);
    return component;
  }

  console.warn(`⚠️ Component "${componentName}" not found in sync cache`);
  return null;
};

/**
 * Löst eine Komponente asynchron auf
 */
export const resolveComponent = async (componentName) => {
  if (!componentName || typeof componentName !== 'string') {
    console.warn('⚠️ Invalid componentName provided to resolveComponent:', componentName);
    return null;
  }

  // Prüfe Cache zuerst
  if (resolvedComponentCache.has(componentName)) {
    return resolvedComponentCache.get(componentName);
  }

  try {
    // Versuche Komponente über Scanner zu laden
    const component = await getComponent(componentName);

    if (component) {
      resolvedComponentCache.set(componentName, component);
      console.log(`✅ Resolved component: ${componentName}`);
      return component;
    }

    // Fallback auf sync resolver
    const syncComponent = resolveComponentSync(componentName);
    if (syncComponent) {
      return syncComponent;
    }

    console.warn(`⚠️ Component "${componentName}" not found`);
    return null;
  } catch (error) {
    console.error(`❌ Error resolving component "${componentName}":`, error);
    return resolveComponentSync(componentName); // Fallback
  }
};

/**
 * Lädt häufige Komponenten vor
 */
export const preloadCommonComponents = async () => {
  const commonComponents = [
    'Text', 'TextBlock',
    'Button', 'ButtonBlock',
    'Image', 'ImageBlock',
    'Container', 'ContainerBlock',
    'Video', 'VideoBlock',
    'Gallery', 'GalleryBlock',
    'Audio', 'AudioBlock',
    'Columns', 'ColumnsBlock',
    'Grid', 'GridBlock',
    'ContactForm', 'ContactFormBlock',
    'Newsletter', 'NewsletterBlock',
    'Header', 'DefaultHeader', 'NavigationHeader',
    'Footer', 'DefaultFooter', 'SocialFooter',
    'Aaron', 'CustomBlock', 'TestAaron', 'Test'
  ];  const cacheKey = 'preload-common';

  if (preloadPromises.has(cacheKey)) {
    return await preloadPromises.get(cacheKey);
  }

  const preloadPromise = (async () => {
    console.log('📦 Preloading common components...');

    try {
      // Scanne alle verfügbaren Blöcke
      const availableBlocks = await scanAvailableBlocks();

      let preloadedCount = 0;

      for (const componentName of commonComponents) {
        try {
          if (availableBlocks.has(componentName)) {
            const component = availableBlocks.get(componentName);
            if (component) {
              resolvedComponentCache.set(componentName, component);
              preloadedCount++;
            }
          }
        } catch (error) {
          console.warn(`⚠️ Could not preload component "${componentName}":`, error);
        }
      }

      console.log(`✅ Preloaded ${preloadedCount} common components`);
      return preloadedCount;
    } catch (error) {
      console.error('❌ Error preloading common components:', error);
      throw error;
    }
  })();

  preloadPromises.set(cacheKey, preloadPromise);

  try {
    return await preloadPromise;
  } finally {
    preloadPromises.delete(cacheKey);
  }
};

/**
 * Aktualisiert alle Komponenten neu
 */
export const refreshComponents = async () => {
  console.log('🔄 Refreshing component cache...');

  // Leere Caches
  resolvedComponentCache.clear();
  preloadPromises.clear();
  clearComponentCache();

  try {
    // Scanne Komponenten neu
    const availableBlocks = await scanAvailableBlocks();

    // Lade alle gefundenen Komponenten in den Cache
    let loadedCount = 0;
    for (const [name, component] of availableBlocks) {
      if (component) {
        resolvedComponentCache.set(name, component);
        loadedCount++;
      }
    }

    console.log(`✅ Refreshed ${loadedCount} components`);
    return Array.from(availableBlocks.keys());
  } catch (error) {
    console.error('❌ Error refreshing components:', error);
    throw error;
  }
};

/**
 * Debug-Informationen
 */
export const getDebugInfo = () => {
  return {
    cachedComponents: Array.from(resolvedComponentCache.keys()),
    cacheSize: resolvedComponentCache.size,
    activePreloads: Array.from(preloadPromises.keys())
  };
};

/**
 * Leert alle Caches (für Entwicklung)
 */
export const clearAllCaches = () => {
  resolvedComponentCache.clear();
  preloadPromises.clear();
  clearComponentCache();
  console.log('🧹 All component caches cleared');
};