'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCMS } from '@/context/CMSContext';
import MovableBlock from './MovableBlock';
import { Play, Edit, Trash2, Eye, Plus, LogOut, Grid3X3, Magnet, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Dynamische Komponenten-Erkennung über API
const getComponentFiles = async () => {
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

      return components;
    }
  } catch (error) {
    console.error('Fehler beim Laden der Komponenten-Liste:', error);
  }

  // Fallback zu statischer Liste wenn API nicht verfügbar
  return [
    {
      name: 'Text',
      componentName: 'Text',
      component: 'Text',
      icon: '�',
      description: 'Einfacher Text Block',
      category: 'root'
    },
    {
      name: 'ButtonBlock',
      componentName: 'ButtonBlock',
      component: 'ButtonBlock',
      icon: '�',
      description: 'Interaktiver Button',
      category: 'root'
    },
    {
      name: 'ImageBlock',
      componentName: 'ImageBlock',
      component: 'ImageBlock',
      icon: '🖼️',
      description: 'Bild Block',
      category: 'root'
    },
    {
      name: 'VideoBlock',
      componentName: 'VideoBlock',
      component: 'VideoBlock',
      icon: '🎥',
      description: 'Video Block',
      category: 'root'
    },
    {
      name: 'ContainerBlock',
      componentName: 'ContainerBlock',
      component: 'ContainerBlock',
      icon: '�',
      description: 'Container für andere Blöcke',
      category: 'root'
    }
  ];
};

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
    duplicateBlock,
    containerSize,
    setContainerSize,
    layoutSettings,
    gridEnabled,
    gridSize,
    snapToGrid,
    showGrid,
    snapToElements,
    setGridEnabled,
    setGridSize,
    setSnapToGrid,
    setShowGrid,
    setSnapToElements
  } = useCMS();

  const containerRef = useRef(null);
  const [blockComponents, setBlockComponents] = useState({});
  const [availableComponents, setAvailableComponents] = useState([]);
  const router = useRouter();

  // Dynamisches Laden der Block-Komponenten
  useEffect(() => {
    const loadComponents = async () => {
      const components = {};
      const availableComps = await getComponentFiles();

      setAvailableComponents(availableComps);

      try {
        // Lade alle verfügbaren Komponenten dynamisch
        for (const comp of availableComps) {
          try {
            const module = await import(`@/components/nic/blocks/${comp.component}`);

            // Verwende sowohl den Namen als auch den Komponentennamen als Key
            components[comp.name] = module.default;
            components[comp.componentName] = module.default;

            // Für Block-Typen auch ohne "Block" Suffix verfügbar machen
            if (comp.component.endsWith('Block')) {
              const shortName = comp.component.replace('Block', '');
              components[shortName] = module.default;
            }

          } catch (importError) {
            console.warn(`Komponente ${comp.component} konnte nicht geladen werden:`, importError);

            // Fallback-Komponente für nicht ladbare Komponenten
            components[comp.name] = ({ content }) => (
              <div className="text-red-500 p-4 border border-red-300 rounded">
                <div className="font-bold">Komponente nicht verfügbar</div>
                <div className="text-sm">Type: {comp.name}</div>
                <div className="text-xs mt-2">{content}</div>
              </div>
            );
          }
        }

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

  const handleBlockDuplicate = async (block) => {
    try {
      await duplicateBlock(block);
    } catch (error) {
      console.error('Fehler beim Duplizieren des Blocks:', error);
    }
  };

  const handleBlockSelect = (block) => {
    selectBlock(block);
  };

  const renderBlock = (block) => {
    const Component = blockComponents[block.block_type];
    if (!Component) {
      return (
        <div className="text-red-500 p-4 border border-red-300 rounded bg-red-50">
          <div className="font-bold">Unbekannter Block-Typ: {block.block_type}</div>
          <div className="text-sm mt-2">Verfügbare Komponenten: {Object.keys(blockComponents).join(', ')}</div>
        </div>
      );
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

  // Funktion um verfügbare Komponenten zu exportieren (für Sidebar etc.)
  const getLoadedComponents = () => {
    return availableComponents.map(comp => ({
      ...comp,
      isLoaded: !!blockComponents[comp.name] || !!blockComponents[comp.componentName]
    }));
  };

  // Mache die Funktion global verfügbar (für andere Komponenten)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.cmsGetAvailableComponents = getLoadedComponents;
    }
  }, [availableComponents, blockComponents]);

  // Funktion um verfügbare Komponenten zu exportieren (für Sidebar etc.)
  const getAvailableComponents = () => {
    return getComponentFiles().map(comp => ({
      ...comp,
      isLoaded: !!blockComponents[comp.name] || !!blockComponents[comp.component]
    }));
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
      router.push('/nic/login');
    } catch (error) {
      console.error('Logout fehler:', error);
    }
  };

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

          {/* Grid Controls */}
          <div className="h-6 w-px bg-gray-300 mx-2"></div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-2 rounded-md flex items-center gap-2 ${
              showGrid
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Raster anzeigen"
          >
            <Grid3X3 size={16} />
          </button>

          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`px-3 py-2 rounded-md flex items-center gap-2 ${
              snapToGrid
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Am Raster einrasten"
          >
            <Magnet size={16} />
          </button>

          <select
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white"
            title="Raster-Größe"
          >
            <option value={10}>10px</option>
            <option value={20}>20px</option>
            <option value={25}>25px</option>
            <option value={50}>50px</option>
          </select>

          {/* Logout Button */}
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <button
            onClick={handleLogout}
            className='px-3 py-2 rounded-md flex items-center gap-2 bg-red-500 text-white hover:bg-red-600'
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="w-full h-full relative select-none"
          data-editor-container="true"
          style={{
            backgroundColor: layoutSettings.background_color || '#ffffff',
            backgroundImage: layoutSettings.background_image
              ? `url(${layoutSettings.background_image})`
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '600px',
            userSelect: 'none',
            webkitUserSelect: 'none',
            msUserSelect: 'none'
          }}
          onClick={handleContainerClick}
          onMouseDown={(e) => {
            // Verbesserte Event-Behandlung für Drag-Operations
            if (e.target === containerRef.current) {
              e.preventDefault();
            }
          }}
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
              onDuplicate={handleBlockDuplicate}
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

          {/* Grid Overlay */}
          {showGrid && mode === 'edit' && (
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(99, 102, 241, 0.3) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: `${gridSize}px ${gridSize}px`
              }}
            />
          )}

          {/* Snap Guidelines */}
          {snapToElements && mode === 'edit' && activeBlock && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Snap lines will be rendered here by Moveable */}
            </div>
          )}

          {/* Edit Mode Grid Overlay (fallback) */}
          {mode === 'edit' && !showGrid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-10 z-5"
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
        <div className="flex items-center gap-4">
          <span>Modus: <span className="font-medium capitalize">{mode}</span></span>
          <span>Komponenten geladen: {Object.keys(blockComponents).length}</span>
          {gridEnabled && (
            <span className="flex items-center gap-1">
              <Grid3X3 size={12} />
              Raster: {gridSize}px
              {snapToGrid && <span className="text-orange-600">(Einrasten aktiv)</span>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Blöcke: {blocks.length}</span>
          <span>Container: {containerSize.width}x{containerSize.height}px</span>
          {activeBlock && (
            <span className="text-blue-600">
              Aktiv: {activeBlock.block_type} #{activeBlock.id}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CMSEditor;
