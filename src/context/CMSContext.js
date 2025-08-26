'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const CMSContext = createContext();

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
};

export const CMSProvider = ({ children }) => {
  // Seiten Management
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sidebar Management
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Undo/Redo System (vereinfacht)
  const [undoHistory, setUndoHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);

  const undo = useCallback(() => {
    // Vereinfachte Undo-Funktion - könnte bei Bedarf erweitert werden
    console.log('Undo currently not implemented in new version');
  }, []);

  const redo = useCallback(() => {
    // Vereinfachte Redo-Funktion - könnte bei Bedarf erweitert werden
    console.log('Redo currently not implemented in new version');
  }, []);

  // Blöcke Management mit intelligentem Batching
  const [blocks, setBlocks] = useState([]);
  const [pendingOperations, setPendingOperations] = useState(new Map());
  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSaveTime, setLastSaveTime] = useState(null);

  // Auto-Save Debouncing
  const autoSaveTimeoutRef = useRef(null);
  const AUTOSAVE_DELAY = 3000; // 3 Sekunden

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-Save wenn Änderungen vorhanden
  useEffect(() => {
    if (pendingOperations.size > 0 && saveStatus === 'dirty') {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Auto-saving pending changes...');
        publishDrafts();
      }, AUTOSAVE_DELAY);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [pendingOperations.size, saveStatus]);

  // Load pages from API
  const loadPages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cms/pages');
      if (response.ok) {
        const data = await response.json();
        setPages(data);
        console.log('✅ Pages loaded:', data.length);

        // Automatisch Home-Seite auswählen wenn keine Seite ausgewählt ist
        if (!currentPage && data.length > 0) {
          // Suche nach Home-Seite (slug: 'home', 'index', oder erste Seite)
          const homePage = data.find(page =>
            page.slug === 'home' ||
            page.slug === 'index' ||
            page.title?.toLowerCase() === 'home'
          ) || data[0]; // Fallback zur ersten Seite

          console.log('🏠 Auto-selecting home page:', homePage.title);
          selectPage(homePage);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error loading pages:', error);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load blocks for a specific page
  const loadBlocks = async (pageId) => {
    if (!pageId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/blocks`);
      if (response.ok) {
        const data = await response.json();

        // Validiere und normalisiere Block-Daten
        const validBlocks = data.map(block => ({
          ...block,
          grid_col: typeof block.grid_col === 'number' && !isNaN(block.grid_col) ? block.grid_col : 0,
          grid_row: typeof block.grid_row === 'number' && !isNaN(block.grid_row) ? block.grid_row : 0,
          grid_width: typeof block.grid_width === 'number' && !isNaN(block.grid_width) ? block.grid_width : 2,
          grid_height: typeof block.grid_height === 'number' && !isNaN(block.grid_height) ? block.grid_height : 1,
          background_color: block.background_color || 'transparent',
          text_color: block.text_color || '#000000',
          z_index: typeof block.z_index === 'number' ? block.z_index : 1
        }));

        setBlocks(validBlocks);
        setPendingOperations(new Map());
        setSaveStatus('saved');
        console.log(`✅ Loaded ${validBlocks.length} blocks for page ${pageId}`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error loading blocks:', error);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Select page and load its blocks
  const selectPage = (page) => {
    setCurrentPage(page);
    if (page) {
      loadBlocks(page.id);
    } else {
      setBlocks([]);
      setPendingOperations(new Map());
      setSaveStatus('saved');
    }
  };

  // Intelligente Operation mit Batching
  const batchOperation = useCallback((blockId, operation, data) => {
    console.log(`📝 Batching operation: ${operation} for block ${blockId}`);

    setPendingOperations(prev => {
      const newOps = new Map(prev);

      if (operation === 'delete') {
        // Bei Delete: entferne alle anderen Operations für diesen Block
        newOps.delete(blockId);
        newOps.set(blockId, { operation, data, timestamp: Date.now() });
      } else {
        // Bei update/create: überschreibe vorherige Operation
        newOps.set(blockId, { operation, data, timestamp: Date.now() });
      }

      return newOps;
    });

    setSaveStatus('dirty');
  }, []);

  // Block erstellen
  const createBlock = useCallback((blockData) => {
    const blockId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newBlock = {
      id: blockId,
      page_id: currentPage?.id,
      block_type: typeof blockData === 'string' ? blockData : blockData.block_type,
      content: blockData.content || '',
      grid_col: typeof blockData.grid_col === 'number' ? blockData.grid_col : 0,
      grid_row: typeof blockData.grid_row === 'number' ? blockData.grid_row : 0,
      grid_width: typeof blockData.grid_width === 'number' ? blockData.grid_width : 2,
      grid_height: typeof blockData.grid_height === 'number' ? blockData.grid_height : 1,
      background_color: blockData.background_color || 'transparent',
      text_color: blockData.text_color || '#000000',
      z_index: typeof blockData.z_index === 'number' ? blockData.z_index : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setBlocks(prev => [...prev, newBlock]);
    batchOperation(blockId, 'create', newBlock);

    console.log(`✅ Created block: ${newBlock.block_type} at (${newBlock.grid_col}, ${newBlock.grid_row})`);
    return newBlock;
  }, [currentPage, batchOperation]);

  // Block aktualisieren
  const updateBlock = useCallback((blockId, updates) => {
    console.log(`🔄 Updating block ${blockId}:`, Object.keys(updates));

    setBlocks(prev => prev.map(block =>
      block.id === blockId
        ? { ...block, ...updates, updated_at: new Date().toISOString() }
        : block
    ));

    const currentBlock = blocks.find(b => b.id === blockId);
    if (currentBlock) {
      const updatedBlock = {
        ...currentBlock,
        ...updates,
        updated_at: new Date().toISOString()
      };
      batchOperation(blockId, 'update', updatedBlock);
    }
  }, [blocks, batchOperation]);

  // Block löschen
  const deleteBlock = useCallback((blockId) => {
    console.log(`🗑️ Deleting block ${blockId}`);

    setBlocks(prev => prev.filter(block => block.id !== blockId));
    batchOperation(blockId, 'delete', { id: blockId });
  }, [batchOperation]);

  // Alle Draft-Änderungen veröffentlichen mit Batch-API
  const publishDrafts = async () => {
    if (pendingOperations.size === 0) {
      console.log('📄 No changes to publish');
      return;
    }

    if (!currentPage) {
      console.error('❌ No current page selected');
      return;
    }

    try {
      setSaveStatus('saving');
      console.log(`🚀 Publishing ${pendingOperations.size} batched operations...`);

      // Konvertiere Map zu Array für API
      const operations = Array.from(pendingOperations.values());

      const response = await fetch(`/api/cms/pages/${currentPage.id}/blocks/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations })
      });

      if (!response.ok) {
        throw new Error(`Batch operation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Batch operations completed:`, result);

      // Lade die aktualisierten Blöcke von der DB
      await loadBlocks(currentPage.id);

      setPendingOperations(new Map());
      setSaveStatus('saved');
      setLastSaveTime(new Date());

      console.log(`✅ Successfully published ${operations.length} operations via batch API`);

    } catch (error) {
      console.error('❌ Error publishing drafts:', error);
      setSaveStatus('error');
      throw error;
    }
  };

  // Draft-Änderungen verwerfen
  const discardDrafts = useCallback(() => {
    console.log('🗑️ Discarding all draft changes');

    if (currentPage) {
      loadBlocks(currentPage.id);
    }

    setPendingOperations(new Map());
    setSaveStatus('saved');
  }, [currentPage]);

  // Manuelles Speichern
  const saveNow = useCallback(async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    await publishDrafts();
  }, []);

  // Initialisierung
  useEffect(() => {
    loadPages();
  }, []);

  const value = {
    pages,
    currentPage,
    blocks,
    isLoading,
    saveStatus,
    lastSaveTime,
    pendingOperationsCount: pendingOperations.size,

    // Sidebar
    sidebarOpen,
    setSidebarOpen,

    // Undo/Redo
    undo,
    redo,
    undoHistory,
    redoHistory,

    // Page Management
    selectPage,
    setCurrentPage,

    // Block Management
    createBlock,
    updateBlock,
    deleteBlock,
    publishDrafts,
    discardDrafts,
    saveNow,
    loadBlocks,

    // Legacy compatibility for old components
    draftChanges: Array.from(pendingOperations.values()),

    // Additional properties that might be expected by existing components
    activeBlock: null,
    mode: 'edit',
    setMode: () => {},
    selectBlock: () => {},
    deselectAllBlocks: () => {},
    duplicateBlock: () => {},
    containerSize: { width: 0, height: 0 },
    setContainerSize: () => {},
    layoutSettings: {},
    gridEnabled: true,
    gridSize: 20,
    snapToGrid: true,
    showGrid: false,
    snapToElements: false,
    setGridEnabled: () => {},
    setGridSize: () => {},
    setSnapToGrid: () => {},
    setShowGrid: () => {},
    setSnapToElements: () => {},
    setLayoutSettings: () => {},
    draggedBlock: null,
    setDraggedBlock: () => {},
    isDragging: false,
    setIsDragging: () => {},

    // API Methods that might be expected
    loadPages,
    createPage: () => {},
    updatePage: () => {},
    deletePage: () => {},
    loadLayoutSettings: () => {},
    updateLayoutSettings: () => {},
    snapToGridValue: () => {},
    getSnapLines: () => []
  };

  return (
    <CMSContext.Provider value={value}>
      {children}
    </CMSContext.Provider>
  );
};
