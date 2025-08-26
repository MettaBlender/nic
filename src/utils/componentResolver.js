/**
 * Static Component Resolver
 *
 * Statically imports all available components to avoid dynamic import issues
 */

// Import basic components first to test
import Text from '../components/nic/blocks/Text.jsx';
import ButtonBlock from '../components/nic/blocks/ButtonBlock.jsx';
import ImageBlock from '../components/nic/blocks/ImageBlock.jsx';
import VideoBlock from '../components/nic/blocks/VideoBlock.jsx';
import ContainerBlock from '../components/nic/blocks/ContainerBlock.jsx';
import TestBlock from '../components/nic/blocks/TestBlock.jsx';
import FallbackBlock from '../components/nic/blocks/fallback.jsx';

// Component registry (start minimal)
const COMPONENT_REGISTRY = {
  // Basic components
  Text,
  ButtonBlock,
  ImageBlock,
  VideoBlock,
  ContainerBlock,
  TestBlock,

  // Fallback
  FallbackBlock
};

/**
 * Resolve a component by name
 * @param {string} componentName - Name of the component to resolve
 * @returns {React.Component} - The resolved component or fallback
 */
export const resolveComponent = (componentName) => {
  if (!componentName) {
    return FallbackBlock;
  }

  // Direct lookup
  if (COMPONENT_REGISTRY[componentName]) {
    return COMPONENT_REGISTRY[componentName];
  }

  // Try variations
  const variations = [
    componentName,
    `${componentName}Block`,
    componentName.replace('Block', ''),
    componentName.charAt(0).toUpperCase() + componentName.slice(1),
    componentName.toLowerCase(),
  ];

  for (const variation of variations) {
    if (COMPONENT_REGISTRY[variation]) {
      return COMPONENT_REGISTRY[variation];
    }
  }

  console.warn(`Component "${componentName}" not found, using fallback`);
  return (props) => <FallbackBlock {...props} componentName={componentName} />;
};

/**
 * Get all available component names
 * @returns {string[]} - Array of component names
 */
export const getAvailableComponents = () => {
  return Object.keys(COMPONENT_REGISTRY).filter(name => name !== 'FallbackBlock');
};

/**
 * Check if a component exists
 * @param {string} componentName - Name of the component to check
 * @returns {boolean} - Whether the component exists
 */
export const componentExists = (componentName) => {
  return !!COMPONENT_REGISTRY[componentName];
};

export default {
  resolveComponent,
  getAvailableComponents,
  componentExists,
  COMPONENT_REGISTRY
};
