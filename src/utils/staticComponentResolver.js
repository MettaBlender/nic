/**
 * Simple Static Component Resolver
 * Lädt Komponenten statisch für bessere Performance und Debugging
 */

import React from 'react';

// Import der echten Komponenten
import Text from '../components/nic/blocks/Text.jsx';
import ButtonBlock from '../components/nic/blocks/ButtonBlock.jsx';
import ImageBlock from '../components/nic/blocks/ImageBlock.jsx';
import ContainerBlock from '../components/nic/blocks/ContainerBlock.jsx';
import VideoBlock from '../components/nic/blocks/VideoBlock.jsx';
import GalleryBlock from '../components/nic/blocks/media/GalleryBlock.jsx';
import ColumnsBlock from '../components/nic/blocks/layout/ColumnsBlock.jsx';
import ContactFormBlock from '../components/nic/blocks/forms/ContactFormBlock.jsx';

// Fallback Komponente für unbekannte Typen
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

// Statische Komponenten-Map mit echten Komponenten
const COMPONENT_MAP = {
  Text: Text,
  Heading: Text, // Text kann verschiedene Typen handhaben
  Paragraph: Text,
  Button: ButtonBlock,
  Image: ImageBlock,
  Container: ContainerBlock,
  Video: VideoBlock,
  Gallery: GalleryBlock,
  Columns: ColumnsBlock,
  ContactForm: ContactFormBlock,

  // Fallback
  fallback: FallbackComponent
};

/**
 * Löst eine Komponente basierend auf dem Namen auf
 */
export const resolveComponent = (componentName) => {
  console.log('🔍 Resolving component:', componentName);

  if (!componentName) {
    console.warn('⚠️ No component name provided, using fallback');
    return FallbackComponent;
  }

  // Prüfe direkte Map
  const Component = COMPONENT_MAP[componentName];

  if (Component) {
    console.log('✅ Found component:', componentName);
    return Component;
  }

  // Fallback
  console.warn(`⚠️ Component "${componentName}" not found, using fallback`);
  return (props) => (
    <FallbackComponent {...props} componentName={componentName} />
  );
};

/**
 * Preload alle verfügbaren Komponenten
 */
export const preloadComponents = () => {
  console.log('📦 Available components:', Object.keys(COMPONENT_MAP));
  return Object.keys(COMPONENT_MAP);
};

/**
 * Legacy-Kompatibilität
 */
export default {
  resolveComponent,
  preloadComponents
};
