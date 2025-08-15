'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Blöcke Management
  const [blocks, setBlocks] = useState([]);
  const [activeBlock, setActiveBlock] = useState(null);
  const [selectedBlocks, setSelectedBlocks] = useState([]);

  // Draft & Publishing System
  const [draftChanges, setDraftChanges] = useState([]);
  const [isDraftMode, setIsDraftMode] = useState(true);
  const [undoHistory, setUndoHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);

  // CMS Modus
  const [mode, setMode] = useState('edit'); // 'edit', 'free', 'move', 'precise', 'preview', 'delete'
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Layout Einstellungen
  const [layoutSettings, setLayoutSettings] = useState({
    header_component: 'default',
    footer_component: 'default',
    background_color: '#ffffff',
    background_image: null,
    primary_color: '#3b82f6',
    secondary_color: '#64748b'
  });

  // Drag & Drop State
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Container Größe für Prozentuale Positionierung
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Persistente Draft-Änderungen (über localStorage)
  useEffect(() => {
    if (currentPage) {
      const savedDrafts = localStorage.getItem(`nic-drafts-${currentPage.id}`);
      if (savedDrafts) {
        try {
          const parsedDrafts = JSON.parse(savedDrafts);
          setDraftChanges(parsedDrafts);
        } catch (error) {
          console.error('Fehler beim Laden der Draft-Änderungen:', error);
        }
      }
    }
  }, [currentPage]);

  // Speichere Draft-Änderungen in localStorage
  useEffect(() => {
    if (currentPage && draftChanges.length > 0) {
      localStorage.setItem(`nic-drafts-${currentPage.id}`, JSON.stringify(draftChanges));
    }
  }, [draftChanges, currentPage]);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Undo/Redo Funktionen
  const undo = () => {
    if (undoHistory.length === 0) return;

    const lastAction = undoHistory[undoHistory.length - 1];
    setRedoHistory(prev => [...prev, { type: 'current_state', blocks: [...blocks] }]);
    setUndoHistory(prev => prev.slice(0, -1));

    // Wende die Rückgängig-Operation an
    if (lastAction.type === 'add_block') {
      setBlocks(prev => prev.filter(block => block.id !== lastAction.blockId));
    } else if (lastAction.type === 'delete_block') {
      setBlocks(prev => [...prev, lastAction.block]);
    } else if (lastAction.type === 'update_block') {
      setBlocks(prev => prev.map(block =>
        block.id === lastAction.blockId ? lastAction.oldData : block
      ));
    }
  };

  const redo = () => {
    if (redoHistory.length === 0) return;

    const nextAction = redoHistory[redoHistory.length - 1];
    setUndoHistory(prev => [...prev, { type: 'current_state', blocks: [...blocks] }]);
    setRedoHistory(prev => prev.slice(0, -1));

    if (nextAction.type === 'current_state') {
      setBlocks(nextAction.blocks);
    }
  };

  // Hilfsfunktion für Undo-History
  const addToUndoHistory = (action) => {
    setUndoHistory(prev => [...prev.slice(-19), action]); // Maximal 20 Undo-Schritte
    setRedoHistory([]); // Redo-History zurücksetzen
  };

  // API Calls
  const loadPages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cms/pages');
      const data = await response.json();
      setPages(data);
    } catch (error) {
      console.error('Fehler beim Laden der Seiten:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBlocks = async (pageId) => {
    if (!pageId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cms/blocks?pageId=${pageId}`);
      let data = await response.json();

      // Wende Draft-Änderungen an (nur in NIC, nicht auf der veröffentlichten Seite)
      data = applyDraftChangesToBlocks(data);

      setBlocks(data);
    } catch (error) {
      console.error('Fehler beim Laden der Blöcke:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Wende Draft-Änderungen auf Blöcke an
  const applyDraftChangesToBlocks = (originalBlocks) => {
    let modifiedBlocks = [...originalBlocks];

    draftChanges.forEach(change => {
      if (change.type === 'add') {
        // Temporäre IDs für Draft-Blöcke
        const tempBlock = {
          id: `temp-${change.id}`,
          page_id: currentPage?.id,
          block_type: change.blockType,
          content: getDefaultContent(change.blockType),
          position_x: 10 + (modifiedBlocks.length * 5),
          position_y: 10 + (modifiedBlocks.length * 5),
          width: 20,
          height: 20,
          rotation: 0,
          scale_x: 1,
          scale_y: 1,
          z_index: Math.max(...modifiedBlocks.map(b => b.z_index || 0), 0) + 1,
          background_color: '#ffffff',
          text_color: '#000000',
          order_index: modifiedBlocks.length,
          isDraft: true // Markierung für Draft-Blöcke
        };
        modifiedBlocks.push(tempBlock);
      } else if (change.type === 'delete') {
        modifiedBlocks = modifiedBlocks.filter(block => block.id !== change.blockId);
      } else if (change.type === 'update') {
        modifiedBlocks = modifiedBlocks.map(block =>
          block.id === change.blockId ? { ...block, ...change.data } : block
        );
      }
    });

    return modifiedBlocks;
  };

  const createPage = async (title, slug) => {
    try {
      const response = await fetch('/api/cms/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug })
      });
      const newPage = await response.json();
      setPages(prev => [newPage, ...prev]);
      return newPage;
    } catch (error) {
      console.error('Fehler beim Erstellen der Seite:', error);
      throw error;
    }
  };

  const updatePage = async (id, title, slug) => {
    try {
      const response = await fetch(`/api/cms/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug })
      });
      const updatedPage = await response.json();
      setPages(prev => prev.map(page => page.id === id ? updatedPage : page));
      if (currentPage && currentPage.id === id) {
        setCurrentPage(updatedPage);
      }
      return updatedPage;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Seite:', error);
      throw error;
    }
  };

  const deletePage = async (id) => {
    try {
      await fetch(`/api/cms/pages/${id}`, { method: 'DELETE' });
      setPages(prev => prev.filter(page => page.id !== id));
      if (currentPage && currentPage.id === id) {
        setCurrentPage(null);
        setBlocks([]);
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Seite:', error);
      throw error;
    }
  };

  const createBlock = (blockType) => {
    // Erstelle Draft-Änderung statt direkter Datenbankänderung
    const draftId = Date.now(); // Temporäre ID für Draft

    const newDraftChange = {
      id: draftId,
      type: 'add',
      blockType: blockType,
      timestamp: Date.now()
    };

    addToUndoHistory({
      type: 'undo_add',
      draftChangeId: draftId
    });

    setDraftChanges(prev => {
      const updated = [...prev, newDraftChange];
      localStorage.setItem('cms_draft_changes', JSON.stringify(updated));
      return updated;
    });

    // Lade Blöcke neu, um Draft-Änderungen anzuzeigen
    loadBlocks(currentPage?.id);
  };

  const updateBlock = (id, blockData) => {
    // Erstelle Draft-Änderung für Update
    const newDraftChange = {
      id: Date.now(),
      type: 'update',
      blockId: id,
      data: blockData,
      timestamp: Date.now()
    };

    addToUndoHistory({
      type: 'undo_update',
      blockId: id,
      previousData: blocks.find(b => b.id === id)
    });

    setDraftChanges(prev => {
      const updated = [...prev, newDraftChange];
      localStorage.setItem('cms_draft_changes', JSON.stringify(updated));
      return updated;
    });

    // Lade Blöcke neu, um Draft-Änderungen anzuzeigen
    loadBlocks(currentPage?.id);
  };

  const deleteBlock = (id) => {
    // Erstelle Draft-Änderung für Delete
    const blockToDelete = blocks.find(b => b.id === id);

    const newDraftChange = {
      id: Date.now(),
      type: 'delete',
      blockId: id,
      timestamp: Date.now()
    };

    addToUndoHistory({
      type: 'undo_delete',
      blockData: blockToDelete
    });

    setDraftChanges(prev => {
      const updated = [...prev, newDraftChange];
      localStorage.setItem('cms_draft_changes', JSON.stringify(updated));
      return updated;
    });

    if (activeBlock && activeBlock.id === id) {
      setActiveBlock(null);
    }

    // Lade Blöcke neu, um Draft-Änderungen anzuzeigen
    loadBlocks(currentPage?.id);
  };

  // Veröffentliche alle Draft-Änderungen in die Datenbank
  const publishDrafts = async () => {
    if (draftChanges.length === 0) return;

    try {
      for (const change of draftChanges) {
        if (change.type === 'add') {
          const blockData = {
            page_id: currentPage.id,
            block_type: change.blockType,
            content: getDefaultContent(change.blockType),
            position_x: 10 + (blocks.length * 5),
            position_y: 10 + (blocks.length * 5),
            width: 20,
            height: 20,
            rotation: 0,
            scale_x: 1,
            scale_y: 1,
            z_index: Math.max(...blocks.map(b => b.z_index || 0), 0) + 1,
            background_color: '#ffffff',
            text_color: '#000000',
            order_index: blocks.length
          };

          await fetch('/api/cms/blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(blockData)
          });
        } else if (change.type === 'update') {
          await fetch(`/api/cms/blocks/${change.blockId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(change.data)
          });
        } else if (change.type === 'delete') {
          await fetch(`/api/cms/blocks/${change.blockId}`, {
            method: 'DELETE'
          });
        }
      }

      // Lösche Draft-Änderungen nach Veröffentlichung
      setDraftChanges([]);
      localStorage.removeItem('cms_draft_changes');

      // Lade veröffentlichte Blöcke
      loadBlocks(currentPage?.id);

    } catch (error) {
      console.error('Fehler beim Veröffentlichen der Drafts:', error);
    }
  };

  const loadLayoutSettings = async () => {
    try {
      const response = await fetch('/api/cms/layout');
      const data = await response.json();
      setLayoutSettings(data);
    } catch (error) {
      console.error('Fehler beim Laden der Layout-Einstellungen:', error);
    }
  };

  const updateLayoutSettings = async (settings) => {
    try {
      const response = await fetch('/api/cms/layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const updatedSettings = await response.json();
      setLayoutSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Layout-Einstellungen:', error);
      throw error;
    }
  };

  const getDefaultContent = (blockType) => {
    switch (blockType) {
      case 'Text':
        return 'Neuer Text';
      case 'ImageBlock':
        return '';
      case 'ButtonBlock':
        return 'Button';
      case 'VideoBlock':
        return '';
      case 'ContainerBlock':
        return 'Container';
      default:
        return '';
    }
  };

  const selectBlock = (block) => {
    setActiveBlock(block);
    if (!selectedBlocks.find(b => b.id === block.id)) {
      setSelectedBlocks([block]);
    }
  };

  const deselectAllBlocks = () => {
    setActiveBlock(null);
    setSelectedBlocks([]);
  };

  const duplicateBlock = async (block) => {
    const duplicatedData = {
      ...block,
      id: undefined,
      position_x: block.position_x + 5,
      position_y: block.position_y + 5,
      z_index: Math.max(...blocks.map(b => b.z_index || 0), 0) + 1,
      order_index: blocks.length
    };
    delete duplicatedData.id;
    delete duplicatedData.created_at;
    delete duplicatedData.updated_at;

    return await createBlock(duplicatedData);
  };

  // Initialisierung
  useEffect(() => {
    loadPages();
    loadLayoutSettings();
  }, []);

  useEffect(() => {
    if (currentPage) {
      loadBlocks(currentPage.id);
    }
  }, [currentPage]);

  const value = {
    // State
    pages,
    currentPage,
    blocks,
    activeBlock,
    selectedBlocks,
    mode,
    sidebarOpen,
    layoutSettings,
    draggedBlock,
    isDragging,
    containerSize,
    isLoading,
    draftChanges,
    undoHistory,
    redoHistory,

    // Setters
    setPages,
    setCurrentPage,
    setBlocks,
    setActiveBlock,
    setSelectedBlocks,
    setMode,
    setSidebarOpen,
    setLayoutSettings,
    setDraggedBlock,
    setIsDragging,
    setContainerSize,

    // API Methods
    loadPages,
    loadBlocks,
    createPage,
    updatePage,
    deletePage,
    createBlock,
    updateBlock,
    deleteBlock,
    publishDrafts,
    discardDrafts: () => {
      setDraftChanges([]);
      localStorage.removeItem('cms_draft_changes');
      loadBlocks(currentPage?.id);
    },
    undo,
    redo,
    deleteBlock,
    loadLayoutSettings,
    updateLayoutSettings,

    // Utilities
    selectBlock,
    deselectAllBlocks,
    duplicateBlock
  };

  return (
    <CMSContext.Provider value={value}>
      {children}
    </CMSContext.Provider>
  );
};
