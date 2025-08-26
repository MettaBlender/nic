/**
 * Simple Static Component Resolver
 * Lädt Komponenten statisch für bessere Performance und Debugging
 */

import React from 'react';

// Direkte Inline-Komponenten für sofortige Funktionalität
const TextComponent = ({ content = '', onContentChange, editable = false, block_type = 'Text' }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [textContent, setTextContent] = React.useState(content);

  const getDefaultContent = () => {
    if (content && content.trim()) return content;
    return editable ? 'Neuer Text Block - Doppelklick zum Bearbeiten' : 'Text Block';
  };

  const displayContent = textContent || getDefaultContent();

  React.useEffect(() => {
    setTextContent(content);
  }, [content]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (editable) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onContentChange && textContent !== content) {
      onContentChange(textContent);
    }
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center p-2 min-h-[60px]"
      onDoubleClick={handleDoubleClick}
      style={{ minHeight: '60px' }}
    >
      {isEditing ? (
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full resize-none border-none outline-none bg-transparent text-center"
          placeholder="Text eingeben..."
          autoFocus
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-center">
          <span style={{
            fontSize: block_type === 'Heading' ? '1.5rem' : '1rem',
            fontWeight: block_type === 'Heading' ? 'bold' : 'normal'
          }}>
            {displayContent}
          </span>
        </div>
      )}
    </div>
  );
};

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

// Statische Komponenten-Map mit direkten Inline-Komponenten
const COMPONENT_MAP = {
  Text: TextComponent,
  Heading: TextComponent,
  Paragraph: TextComponent,

  // Simple Image Component
  Image: ({ content }) => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 border border-gray-200">
      <span className="text-gray-500">🖼️ Bild: {content || 'Kein Bild'}</span>
    </div>
  ),

  // Simple Button Component
  Button: ({ content }) => (
    <div className="w-full h-full flex items-center justify-center">
      <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        {content || 'Button'}
      </button>
    </div>
  ),

  // Simple Container Component
  Container: ({ content }) => (
    <div className="w-full h-full bg-gray-50 border border-gray-200 p-4">
      <div className="text-sm text-gray-600">Container: {content || 'Leer'}</div>
    </div>
  ),

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
