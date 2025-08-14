'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCMS } from '@/context/CMSContext';
import MovableBlock from './MovableBlock';
import { Play, Edit, Trash2, Eye, Plus } from 'lucide-react';

const CMSEditor = () => {
  const {
    currentPage,
    blocks,
    activeBlock,
    mode,
    setMode,
    selectBlock,
    deselectAllBlocks,
    updateBlock,
    deleteBlock,
    containerSize,
    setContainerSize,
    layoutSettings
  } = useCMS();

  const containerRef = useRef(null);
  const [blockComponents, setBlockComponents] = useState({});

  // Dynamisches Laden der Block-Komponenten
  useEffect(() => {
    const loadComponents = async () => {
      const components = {};

      try {
        components.Text = (await import('@/components/nic/blocks/Text')).default;
        components.ImageBlock = (await import('@/components/nic/blocks/ImageBlock')).default;
        components.ButtonBlock = (await import('@/components/nic/blocks/ButtonBlock')).default;
        components.VideoBlock = (await import('@/components/nic/blocks/VideoBlock')).default;
        components.ContainerBlock = (await import('@/components/nic/blocks/ContainerBlock')).default;
      } catch (error) {
        console.error('Fehler beim Laden der Komponenten:', error);
      }

      setBlockComponents(components);
    };

    loadComponents();
  }, []);

  // Container-Größe überwachen
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);

    return () => window.removeEventListener('resize', updateContainerSize);
  }, [setContainerSize]);

  const handleContainerClick = (e) => {
    if (e.target === containerRef.current) {
      deselectAllBlocks();
    }
  };

  const handleBlockUpdate = async (blockId, updatedData) => {
    try {
      await updateBlock(blockId, updatedData);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Blocks:', error);
    }
  };

  const handleBlockDelete = async (blockId) => {
    try {
      await deleteBlock(blockId);
    } catch (error) {
      console.error('Fehler beim Löschen des Blocks:', error);
    }
  };

  const handleBlockSelect = (block) => {
    selectBlock(block);
  };

  const renderBlock = (block) => {
    const Component = blockComponents[block.block_type];
    if (!Component) {
      return <div className="text-red-500">Unbekannter Block-Typ: {block.block_type}</div>;
    }

    const handleContentChange = async (newContent) => {
      await handleBlockUpdate(block.id, { ...block, content: newContent });
    };

    return (
      <Component
        content={block.content}
        onContentChange={handleContentChange}
        editable={mode === 'edit'}
      />
    );
  };

  if (!currentPage) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📄</div>
          <h2 className="text-xl font-semibold mb-2">Keine Seite ausgewählt</h2>
          <p>Wählen Sie eine Seite aus oder erstellen Sie eine neue Seite.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Editor Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{currentPage.title}</h1>
          <span className="text-sm text-gray-500">({currentPage.slug})</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('edit')}
            className={`px-3 py-2 rounded-md flex items-center gap-2 ${
              mode === 'edit'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Edit size={16} />
            Bearbeiten
          </button>

          <button
            onClick={() => setMode('preview')}
            className={`px-3 py-2 rounded-md flex items-center gap-2 ${
              mode === 'preview'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Eye size={16} />
            Vorschau
          </button>

          <button
            onClick={() => setMode('delete')}
            className={`px-3 py-2 rounded-md flex items-center gap-2 ${
              mode === 'delete'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Trash2 size={16} />
            Löschen
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="w-full h-full relative"
          style={{
            backgroundColor: layoutSettings.background_color || '#ffffff',
            backgroundImage: layoutSettings.background_image
              ? `url(${layoutSettings.background_image})`
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '600px'
          }}
          onClick={handleContainerClick}
        >
          {/* Render Blocks */}
          {blocks.map((block) => (
            <MovableBlock
              key={block.id}
              block={block}
              isSelected={activeBlock && activeBlock.id === block.id}
              onSelect={handleBlockSelect}
              onUpdate={handleBlockUpdate}
              onDelete={handleBlockDelete}
            >
              {renderBlock(block)}
            </MovableBlock>
          ))}

          {/* Empty State */}
          {blocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400 bg-white/80 p-8 rounded-lg">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-lg font-semibold mb-2">Leere Seite</h3>
                <p>Fügen Sie Blöcke aus der Sidebar hinzu, um mit der Gestaltung zu beginnen.</p>
              </div>
            </div>
          )}

          {/* Grid Overlay for Edit Mode */}
          {mode === 'edit' && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #000 1px, transparent 1px),
                  linear-gradient(to bottom, #000 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <div>
          Modus: <span className="font-medium capitalize">{mode}</span>
        </div>
        <div>
          Blöcke: {blocks.length} |
          Container: {containerSize.width}x{containerSize.height}px
        </div>
      </div>
    </div>
  );
};

export default CMSEditor;
