/**
 * Enhanced Block Renderer
 * Rendert Blöcke mit automatischer Komponenten-Erkennung
 */

'use client';

import React, { Suspense } from 'react';
import { resolveComponent, resolveComponentSync } from '@/utils/hybridComponentResolver';

/**
 * Async Block Renderer (bevorzugt für neue Komponenten)
 */
export const AsyncBlockRenderer = ({ block, ...props }) => {
  const [Component, setComponent] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadComponent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const resolvedComponent = await resolveComponent(block.block_type);

        if (isMounted) {
          setComponent(() => resolvedComponent);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error(`Failed to load component ${block.block_type}:`, err);
          setError(err);
          setIsLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [block.block_type]);

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded">
        <div className="text-red-700 font-medium">Fehler beim Laden</div>
        <div className="text-red-600 text-sm">{block.block_type}</div>
        <div className="text-red-500 text-xs mt-1">{error.message}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-100 border border-gray-300 rounded animate-pulse">
        <div className="text-gray-500 text-sm">Lade {block.block_type}...</div>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
        <div className="text-yellow-700 font-medium">Komponente nicht gefunden</div>
        <div className="text-yellow-600 text-sm">{block.block_type}</div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="p-4 bg-gray-100 border border-gray-300 rounded animate-pulse">
        <div className="text-gray-500 text-sm">Lade {block.block_type}...</div>
      </div>
    }>
      <Component
        {...props}
        block={block}
        content={block.content}
        id={block.id}
        componentName={block.block_type}
      />
    </Suspense>
  );
};

/**
 * Sync Block Renderer (für bekannte/cached Komponenten)
 */
export const SyncBlockRenderer = ({ block, ...props }) => {
  const Component = resolveComponentSync(block.block_type);

  if (!Component) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
        <div className="text-yellow-700 font-medium">Komponente nicht gefunden (Sync)</div>
        <div className="text-yellow-600 text-sm">{block.block_type}</div>
        <div className="text-yellow-500 text-xs mt-1">
          Content: {typeof block.content === 'object' ? JSON.stringify(block.content) : String(block.content)}
        </div>
      </div>
    );
  }

  return (
    <Component
      {...props}
      block={block}
      content={block.content}
      id={block.id}
      componentName={block.block_type}
    />
  );
};

/**
 * Smart Block Renderer (automatische Wahl zwischen async/sync)
 */
export const SmartBlockRenderer = ({ block, preferAsync = false, ...props }) => {
  // Für Entwicklungsumgebung oder neue Komponenten: async
  // Für bekannte Komponenten: sync
  const useAsync = preferAsync || process.env.NODE_ENV === 'development';

  if (useAsync) {
    return <AsyncBlockRenderer block={block} {...props} />;
  } else {
    return <SyncBlockRenderer block={block} {...props} />;
  }
};

/**
 * Block Grid Renderer (für Grid-Layout)
 */
export const GridBlockRenderer = ({ block, className = '', ...props }) => {
  const gridStyle = {
    gridColumn: `${(block.grid_col || 0) + 1} / span ${block.grid_width || 2}`,
    gridRow: `${(block.grid_row || 0) + 1} / span ${block.grid_height || 1}`,
    backgroundColor: block.background_color || 'transparent',
    color: block.text_color || 'inherit',
    zIndex: block.z_index || 1
  };

  return (
    <div
      className={`block-grid-item ${className}`}
      style={gridStyle}
      data-block-id={block.id}
      data-block-type={block.block_type}
    >
      <SmartBlockRenderer block={block} {...props} />
    </div>
  );
};

/**
 * Block List Renderer (für Listen-Layout)
 */
export const ListBlockRenderer = ({ blocks, renderMode = 'smart', ...props }) => {
  const Renderer = renderMode === 'async' ? AsyncBlockRenderer :
                   renderMode === 'sync' ? SyncBlockRenderer :
                   SmartBlockRenderer;

  return (
    <>
      {blocks.map((block) => (
        <div key={block.id} className="block-list-item mb-4">
          <Renderer block={block} {...props} />
        </div>
      ))}
    </>
  );
};

/**
 * Default Export
 */
export default SmartBlockRenderer;
