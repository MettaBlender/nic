'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { useCMS } from '@/context/CMSContext';
import { Plus, Eye, EyeOff, ChevronDown, ChevronRight, Save, Upload } from 'lucide-react';

// Hilfsfunktion für dynamisches Laden der Komponenten
async function getComponentFiles() {
  try {
    // API-Route aufrufen, die die Komponenten-Struktur zurückgibt
    const response = await fetch('/api/cms/components');
    if (!response.ok) {
      throw new Error('Fehler beim Laden der Komponenten');
    }
    const data = await response.json();
    return data.categories;
  } catch (error) {
    console.error('Fehler beim Lesen der Komponenten:', error);
    return {};
  }
}

export default function Components() {
  const {
    createBlock,
    currentPage,
    draftChanges,
    publishDrafts,
    discardDrafts
  } = useCMS();
  const [componentCategories, setComponentCategories] = useState({});
  const [previewBlocks, setPreviewBlocks] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isDraftMode, setIsDraftMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Lade Komponenten beim Mount
  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    setIsLoading(true);
    const categories = await getComponentFiles();

    // Konvertiere zu dynamischen Imports
    const processedCategories = {};

    Object.entries(categories).forEach(([categoryName, components]) => {
      processedCategories[categoryName] = components.map(comp => ({
        ...comp,
        Component: dynamic(() =>
          import(`@/components/nic/blocks/${categoryName === 'root' ? '' : categoryName + '/'}${comp.file}`)
            .catch(() => import('@/components/nic/blocks/fallback')), // Fallback bei Fehlern
          {
            ssr: false,
            loading: () => (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '32px',
                backgroundColor: '#f3f4f6',
                borderRadius: '4px',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Lädt...</span>
              </div>
            )
          }
        )
      }));
    });

    setComponentCategories(processedCategories);

    // Alle Kategorien standardmäßig zugeklappt
    const initialExpanded = {};
    Object.keys(processedCategories).forEach(category => {
      initialExpanded[category] = false;
    });
    setExpandedCategories(initialExpanded);
    setIsLoading(false);
  };

  const handleAddBlock = async (blockType, categoryName = 'root') => {
    if (!currentPage) {
      alert('Bitte wählen Sie zuerst eine Seite aus');
      return;
    }

    try {
      createBlock(blockType);
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Blocks:', error);
      alert('Fehler beim Hinzufügen des Blocks');
    }
  };

  const handleDragStart = (e, blockType, categoryName = 'root') => {
    // Importiere Config für Standard-Größen
    let defaultSize = { width: 2, height: 1 };

    // Versuche Standard-Größe aus nic.config zu laden
    if (typeof window !== 'undefined' && window.nicConfig) {
      defaultSize = window.nicConfig.defaultBlockSizes[blockType] || defaultSize;
    }

    const dragData = {
      block_type: blockType,
      category: categoryName,
      grid_width: defaultSize.width,
      grid_height: defaultSize.height,
      content: '',
      background_color: 'transparent',
      text_color: '#000000',
      z_index: 1
    };

    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };  const publishChanges = async () => {
    if (draftChanges.length === 0) {
      alert('Keine ausstehenden Änderungen zum Veröffentlichen');
      return;
    }

    try {
      setIsLoading(true);
      await publishDrafts();
      alert(`${draftChanges.length} Änderungen erfolgreich veröffentlicht!`);
    } catch (error) {
      console.error('Fehler beim Veröffentlichen:', error);
      alert('Fehler beim Veröffentlichen der Änderungen');
    } finally {
      setIsLoading(false);
    }
  };

  const discardChanges = () => {
    if (draftChanges.length === 0) {
      alert('Keine ausstehenden Änderungen zum Verwerfen');
      return;
    }

    if (confirm(`${draftChanges.length} ausstehende Änderungen verwerfen?`)) {
      discardDrafts();
    }
  };

  const togglePreview = (blockKey) => {
    setPreviewBlocks(prev => ({
      ...prev,
      [blockKey]: !prev[blockKey]
    }));
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const getCategoryDisplayName = (categoryName) => {
    if (categoryName === 'root') return 'Standard Blöcke';
    return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Lade Komponenten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-white text-center">
          Block Bibliothek
        </h2>
        {currentPage && (
          <p className="text-sm text-gray-300 text-center mt-1">
            Aktuelle Seite: {currentPage.title}
          </p>
        )}

        {/* Draft/Live Toggle */}
        <div className="flex items-center justify-center mt-3 gap-2">
          <button
            onClick={() => setIsDraftMode(!isDraftMode)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isDraftMode
                ? 'bg-yellow-500 text-black'
                : 'bg-green-500 text-white'
            }`}
          >
            {isDraftMode ? '📝 Draft Modus' : '🔴 Live Modus'}
          </button>
        </div>

        {/* Pending Changes */}
        {draftChanges.length > 0 && (
          <div className="mt-3 bg-yellow-500/20 border border-yellow-500/40 rounded p-2">
            <div className="flex items-center justify-between">
              <span className="text-yellow-300 text-sm">
                {draftChanges.length} ausstehende Änderung(en)
              </span>
              <div className="flex gap-1">
                <button
                  onClick={publishChanges}
                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center gap-1"
                >
                  <Upload size={12} />
                  Veröffentlichen
                </button>
                <button
                  onClick={discardChanges}
                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                >
                  Verwerfen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Component Categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {Object.entries(componentCategories).map(([categoryName, components]) => {
          const isExpanded = expandedCategories[categoryName];
          const displayName = getCategoryDisplayName(categoryName);

          return (
            <div key={categoryName} className="bg-white/10 rounded-lg border border-white/20">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(categoryName)}
                className="w-full flex items-center justify-between p-3 text-white hover:bg-white/5 rounded-t-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {categoryName === 'root' ? '🔧' :
                     categoryName === 'layout' ? '📐' :
                     categoryName === 'media' ? '🎬' :
                     categoryName === 'forms' ? '📝' : '📦'}
                  </span>
                  <span className="font-medium">{displayName}</span>
                  <span className="text-xs text-gray-300">({components.length})</span>
                </div>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {/* Category Content */}
              {isExpanded && (
                <div className="border-t border-white/10 p-3 space-y-2">
                  {components.map((component) => {
                    const blockKey = `${categoryName}-${component.name}`;
                    const isPreviewOpen = previewBlocks[blockKey];

                    return (
                      <div
                        key={component.name}
                        className="bg-white/5 rounded p-2 border border-white/10 cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => handleDragStart(e, component.componentName || component.name, categoryName)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{component.icon || '🧩'}</span>
                            <span className="text-white text-sm font-medium">{component.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => togglePreview(blockKey)}
                              className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded"
                              title={isPreviewOpen ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
                            >
                              {isPreviewOpen ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button
                              onClick={() => handleAddBlock(component.componentName || component.name, categoryName)}
                              className="p-1 text-white rounded bg-blue-500 hover:bg-blue-600"
                              title="Block hinzufügen"
                              disabled={!currentPage}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Drag Indicator */}
                        <div className="text-xs text-white/50 mb-2 text-center">
                          🔄 Ziehen zum Hinzufügen
                        </div>

                        {/* Component Description */}
                        {component.description && (
                          <p className="text-xs text-gray-300 mb-2">{component.description}</p>
                        )}

                        {/* Component Preview */}
                        {isPreviewOpen && component.Component && (
                          <div className="bg-white rounded p-2 h-16 overflow-hidden">
                            <div className="w-full h-full transform scale-75 origin-top-left">
                              <React.Suspense fallback={<div className="animate-pulse bg-gray-200 h-full rounded"></div>}>
                                <component.Component />
                              </React.Suspense>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {Object.keys(componentCategories).length === 0 && (
          <div className="text-center text-white/70 py-8">
            <p>Keine Komponenten gefunden.</p>
            <p className="text-sm mt-2">Fügen Sie Komponenten im /components/nic/blocks Ordner hinzu.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {!currentPage && (
        <div className="p-4 border-t border-gray-200">
          <p className="text-yellow-300 text-sm text-center">
            ⚠️ Wählen Sie eine Seite aus, um Blöcke hinzuzufügen
          </p>
        </div>
      )}
    </div>
  );
}