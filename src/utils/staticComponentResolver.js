/**
 * Simple Static Component Resolver
 * Lädt Komponenten statisch für bessere Performance und Debugging
 */

import Text from '../components/nic/blocks/Text.jsx';
import ImageBlock from '../components/nic/blocks/ImageBlock.jsx';
import VideoBlock from '../components/nic/blocks/VideoBlock.jsx';
import ButtonBlock from '../components/nic/blocks/ButtonBlock.jsx';
import ContainerBlock from '../components/nic/blocks/ContainerBlock.jsx';
import FallbackBlock from '../components/nic/blocks/fallback.jsx';

// Statische Komponenten-Map
const COMPONENT_MAP = {
  Text,
  Heading: Text, // Heading verwendet die Text-Komponente
  Paragraph: Text, // Paragraph verwendet die Text-Komponente
  Image: ImageBlock,
  Video: VideoBlock,
  Button: ButtonBlock,
  Container: ContainerBlock,

  // Fallback für alle anderen
  fallback: FallbackBlock
};

/**
 * Löst eine Komponente basierend auf dem Namen auf
 */
export const resolveComponent = (componentName) => {
  console.log('🔍 Resolving component:', componentName);

  if (!componentName) {
    console.warn('⚠️ No component name provided, using fallback');
    return FallbackBlock;
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
    <FallbackBlock {...props} componentName={componentName} />
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
