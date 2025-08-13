'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { useCMS } from '@/context/CMSContext';
import { Plus, Eye, EyeOff } from 'lucide-react';

// Definiere verfügbare Block-Typen
const blockTypes = [
  { name: 'Text', component: 'Text', icon: '📝' },
  { name: 'Image', component: 'ImageBlock', icon: '🖼️' },
  { name: 'Button', component: 'ButtonBlock', icon: '🔘' },
  { name: 'Video', component: 'VideoBlock', icon: '🎥' },
  { name: 'Container', component: 'ContainerBlock', icon: '📦' }
];

// Dynamisch importierte Komponenten
const componentMap = {
  Text: dynamic(() => import('@/components/nic/blocks/Text'), { ssr: false }),
  ImageBlock: dynamic(() => import('@/components/nic/blocks/ImageBlock'), { ssr: false }),
  ButtonBlock: dynamic(() => import('@/components/nic/blocks/ButtonBlock'), { ssr: false }),
  VideoBlock: dynamic(() => import('@/components/nic/blocks/VideoBlock'), { ssr: false }),
  ContainerBlock: dynamic(() => import('@/components/nic/blocks/ContainerBlock'), { ssr: false })
};

export default function Components() {
  const { addBlockToPage, currentPage } = useCMS();
  const [previewBlocks, setPreviewBlocks] = useState({});

  const handleAddBlock = async (blockType) => {
    if (!currentPage) {
      alert('Bitte wählen Sie zuerst eine Seite aus');
      return;
    }

    try {
      await addBlockToPage(blockType);
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Blocks:', error);
      alert('Fehler beim Hinzufügen des Blocks');
    }
  };

  const togglePreview = (blockName) => {
    setPreviewBlocks(prev => ({
      ...prev,
      [blockName]: !prev[blockName]
    }));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-white text-center">
          Block Bibliothek
        </h2>
        {currentPage && (
          <p className="text-sm text-gray-300 text-center mt-1">
            Aktuelle Seite: {currentPage.title}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {blockTypes.map(({ name, component, icon }) => {
          const Component = componentMap[component];
          const isPreviewOpen = previewBlocks[name];

          return (
            <div
              key={name}
              className="bg-white/10 rounded-lg p-3 border border-white/20"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <span className="text-white font-medium">{name}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => togglePreview(name)}
                    className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded"
                    title={isPreviewOpen ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
                  >
                    {isPreviewOpen ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => handleAddBlock(component)}
                    className="p-1 text-white bg-blue-500 hover:bg-blue-600 rounded"
                    title="Block hinzufügen"
                    disabled={!currentPage}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {isPreviewOpen && Component && (
                <div className="bg-white rounded p-2 h-20 overflow-hidden">
                  <div className="w-full h-full transform scale-75 origin-top-left">
                    <Component />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

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