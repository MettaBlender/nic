/**
 * Tester für das verbesserte Block-System
 * Diese Komponente demonstriert das automatische Laden von Komponenten
 */

'use client';

import React, { useState, useEffect } from 'react';
import { scanAvailableBlocks, clearComponentCache } from '@/utils/dynamicBlockScanner';
import { SmartBlockRenderer } from '@/components/nic/renderers/BlockRenderer';

const BlockSystemTester = () => {
  const [availableBlocks, setAvailableBlocks] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [testBlocks, setTestBlocks] = useState([]);

  // Lade verfügbare Blöcke
  const loadAvailableBlocks = async () => {
    setIsLoading(true);
    try {
      const blocks = await scanAvailableBlocks();
      setAvailableBlocks(blocks);
      console.log('📋 Available blocks:', Array.from(blocks.keys()));
    } catch (error) {
      console.error('❌ Failed to load blocks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Erstelle Test-Blöcke
  const createTestBlocks = () => {
    const blockTypes = ['Test', 'CustomBlock', 'TestAaron', 'Text', 'Button', 'Image'];
    const blocks = blockTypes.map((type, index) => ({
      id: `test-${index}`,
      block_type: type,
      content: type === 'Test' ? { title: 'Test Block', description: 'Auto-erkannt!' } :
               type === 'CustomBlock' ? { title: 'Custom Block', description: 'Dynamisch geladen!' } :
               type === 'TestAaron' ? 'Aaron\'s Test Component' :
               type === 'Text' ? 'Dies ist ein Text Block' :
               type === 'Button' ? { text: 'Test Button' } :
               type === 'Image' ? { src: '/placeholder.jpg', alt: 'Test Image' } : {},
      grid_col: index * 2,
      grid_row: 0,
      grid_width: 2,
      grid_height: 1,
      background_color: index % 2 === 0 ? '#f0f9ff' : '#fef3c7',
      text_color: '#1f2937'
    }));
    setTestBlocks(blocks);
  };

  // Leere Cache
  const clearCache = () => {
    clearComponentCache();
    setAvailableBlocks(new Map());
    console.log('🧹 Cache cleared');
  };

  useEffect(() => {
    loadAvailableBlocks();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🔧 Block System Tester</h1>
        <p className="text-gray-600 mb-6">
          Dieses Tool testet das automatische Block-Erkennungs-System und localStorage-Persistierung.
        </p>

        <div className="flex gap-4 mb-6">
          <button
            onClick={loadAvailableBlocks}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? '⏳ Lade...' : '🔄 Blöcke scannen'}
          </button>

          <button
            onClick={createTestBlocks}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            🎨 Test-Blöcke erstellen
          </button>

          <button
            onClick={clearCache}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            🧹 Cache leeren
          </button>
        </div>
      </div>

      {/* Verfügbare Blöcke */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">📋 Verfügbare Blöcke ({availableBlocks.size})</h2>
        <div className="grid grid-cols-4 gap-2">
          {Array.from(availableBlocks.keys()).map((blockName) => (
            <div
              key={blockName}
              className="p-2 bg-gray-100 rounded text-sm text-center hover:bg-gray-200 transition-colors"
            >
              {blockName}
            </div>
          ))}
        </div>
      </div>

      {/* Test-Blöcke Renderer */}
      {testBlocks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">🎨 Test-Blöcke</h2>
          <div className="grid grid-cols-12 gap-4 auto-rows-min">
            {testBlocks.map((block) => (
              <div
                key={block.id}
                className="border rounded p-2"
                style={{
                  gridColumn: `${block.grid_col + 1} / span ${block.grid_width}`,
                  backgroundColor: block.background_color,
                  color: block.text_color
                }}
              >
                <div className="text-xs font-medium mb-2 opacity-60">
                  {block.block_type}
                </div>
                <SmartBlockRenderer block={block} preferAsync={true} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* localStorage Status */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">💾 localStorage Status</h2>
        <div className="bg-gray-50 p-4 rounded">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Draft Changes:</strong> {typeof window !== 'undefined' && localStorage.getItem('cms_draft_changes') ? 'Gespeichert' : 'Leer'}
            </div>
            <div>
              <strong>Page States:</strong> {typeof window !== 'undefined' && localStorage.getItem('cms_page_states') ? 'Gespeichert' : 'Leer'}
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-blue-50 p-4 rounded">
        <h3 className="font-bold mb-2">ℹ️ System Features</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Automatische Block-Erkennung im <code>blocks/Aaron/</code> Ordner</li>
          <li>✅ Dynamisches Laden neuer .jsx Komponenten</li>
          <li>✅ localStorage-Persistierung für Draft-Änderungen</li>
          <li>✅ Intelligent Component Caching</li>
          <li>✅ Async/Sync Rendering je nach Bedarf</li>
          <li>✅ Fallback-Komponenten bei Fehlern</li>
        </ul>
      </div>
    </div>
  );
};

export default BlockSystemTester;
