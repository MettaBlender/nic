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
      const data = await response.json();
      setBlocks(data);
    } catch (error) {
      console.error('Fehler beim Laden der Blöcke:', error);
    } finally {
      setIsLoading(false);
    }
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

  const createBlock = async (blockData) => {
    try {
      const response = await fetch('/api/cms/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockData)
      });
      const newBlock = await response.json();
      setBlocks(prev => [...prev, newBlock]);
      return newBlock;
    } catch (error) {
      console.error('Fehler beim Erstellen des Blocks:', error);
      throw error;
    }
  };

  const updateBlock = async (id, blockData) => {
    try {
      const response = await fetch(`/api/cms/blocks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockData)
      });
      const updatedBlock = await response.json();
      setBlocks(prev => prev.map(block => block.id === id ? updatedBlock : block));
      return updatedBlock;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Blocks:', error);
      throw error;
    }
  };

  const deleteBlock = async (id) => {
    try {
      await fetch(`/api/cms/blocks/${id}`, { method: 'DELETE' });
      setBlocks(prev => prev.filter(block => block.id !== id));
      if (activeBlock && activeBlock.id === id) {
        setActiveBlock(null);
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Blocks:', error);
      throw error;
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

  // Block Utilities
  const addBlockToPage = async (blockType, position) => {
    if (!currentPage) return;

    const maxZ = blocks.length > 0 ? Math.max(...blocks.map(b => b.z_index || 0)) : 0;

    // Automatische Positionierung wenn keine Position angegeben
    let blockPosition = position;
    if (!blockPosition) {
      const offset = blocks.length * 5; // Versatz für jeden neuen Block
      blockPosition = {
        x: 10 + offset,
        y: 10 + offset
      };
    }

    const blockData = {
      page_id: currentPage.id,
      block_type: blockType,
      content: getDefaultContent(blockType),
      position_x: blockPosition.x,
      position_y: blockPosition.y,
      width: 20,
      height: 20,
      rotation: 0,
      scale_x: 1,
      scale_y: 1,
      z_index: maxZ + 1,
      background_color: '#ffffff',
      text_color: '#000000',
      order_index: blocks.length
    };

    return await createBlock(blockData);
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
    loadLayoutSettings,
    updateLayoutSettings,

    // Utilities
    addBlockToPage,
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
