'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  generateResponsiveLayouts,
  getBlocksForDevice,
  smartRegenerateLayouts,
  RESPONSIVE_GRIDS
} from '../utils/responsiveLayoutGenerator.js';
import { getComponentFiles } from '@/components/nic/cms/Components.jsx';
import nicConfig from '../../nic.config.js';

const CMSContext = createContext();

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
};

export const CMSProvider = ({ children }) => {
  // Pages Management
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('currentPageId');
        return stored ? { id: parseInt(stored) } : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sidebar Management
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Undo/Redo System
  const [undoHistory, setUndoHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const MAX_HISTORY_SIZE = 50;

  const [selectedBlock, setSelectedBlock] = useState(null);

  // Blocks Management with intelligent batching
  const [blocks, setBlocks] = useState([]);
  const [pendingOperations, setPendingOperations] = useState(new Map());
  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSaveTime, setLastSaveTime] = useState(null);

  const [deviceSize, setDeviceSize] = useState('desktop'); // 'mobile', 'tablet', 'desktop'

  // Responsive Layouts - stores different layouts for each device
  const [responsiveLayouts, setResponsiveLayouts] = useState({});

  const [autoResponsiveEnabled, setAutoResponsiveEnabled] = useState(true);

  // Save current page to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && currentPage?.id) {
      localStorage.setItem('currentPageId', currentPage.id.toString());
    }
  }, [currentPage?.id]);

  // Helper function to save current state - AFTER blocks declaration
  const saveStateToHistory = useCallback(() => {
    const currentState = {
      blocks: [...blocks],
      timestamp: Date.now()
    };
    setUndoHistory(prev => {
      const newHistory = [...prev, currentState];
      // Limit history to MAX_HISTORY_SIZE
      return newHistory.length > MAX_HISTORY_SIZE ? newHistory.slice(-MAX_HISTORY_SIZE) : newHistory;
    });
    // Clear redo history on new action
    setRedoHistory([]);
  }, [blocks]);

  // Undo/Redo Functions - AFTER blocks declaration
  const undo = useCallback(() => {
    if (undoHistory.length === 0) {
      return;
    }

    const lastState = undoHistory[undoHistory.length - 1];
    const currentState = {
      blocks: [...blocks],
      timestamp: Date.now()
    };

    // Set state back
    setBlocks(lastState.blocks);
    setSelectedBlock(null); // Deselect block on undo

    // Remove last state from undo history
    setUndoHistory(prev => prev.slice(0, -1));

    // Add current state to redo history
    setRedoHistory(prev => [...prev, currentState]);
  }, [undoHistory, blocks]);

  const redo = useCallback(() => {
    if (redoHistory.length === 0) {
      return;
    }

    const nextState = redoHistory[redoHistory.length - 1];
    const currentState = {
      blocks: [...blocks],
      timestamp: Date.now()
    };

    // Set state forward
    setBlocks(nextState.blocks);
    setSelectedBlock(null); // Deselektiere Block bei Redo

    // Remove last state from redo history
    setRedoHistory(prev => prev.slice(0, -1));

    // Add current state to undo history
    setUndoHistory(prev => [...prev, currentState]);

  }, [redoHistory, blocks]);

  // Component Definitions Management
  const [componentDefinitions, setComponentDefinitions] = useState({});

  // Load component definitions from API
  const loadComponentDefinitions = useCallback(async () => {
    try {
      const response = await fetch('/api/cms/components');
      if (response.ok) {
        const data = await response.json();

        // Flatten categories to a simple name -> definition mapping
        const definitions = {};
        Object.entries(data.categories || {}).forEach(([categoryName, components]) => {
          components.forEach(component => {
            definitions[component.name] = {
              ...component,
              category: categoryName
            };
          });
        });

        setComponentDefinitions(definitions);
      }
    } catch (error) {
      console.error('❌ Error loading component definitions:', error);
    }
  }, []);

  // Layout Settings Management
  const [layoutSettings, setLayoutSettings] = useState({
    header_component: 'default',
    footer_component: 'default',
    background_color: '#ffffff',
    background_image: null,
    primary_color: '#3b82f6',
    secondary_color: '#64748b'
  });
  const [pendingLayoutChanges, setPendingLayoutChanges] = useState(null);

  // Draft Changes - only in memory now
  const [draftChanges, setDraftChanges] = useState([]);

  // Warning before reload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (pendingOperations.size > 0) {
        e.preventDefault();
        e.returnValue = 'Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingOperations]);

  // Mode Management (Edit/Preview)
  const [mode, setMode] = useState('edit');

  // Auto-Save Debouncing
  const autoSaveTimeoutRef = useRef(null);
  const AUTOSAVE_DELAY = 3000; // 3 seconds

  // Function to apply draft changes to current blocks
  const applyDraftChangesToBlocks = useCallback((drafts, currentBlocks) => {
    if (!drafts || drafts.length === 0) return currentBlocks;

    let updatedBlocks = [...currentBlocks];
    const pendingOps = new Map();

    // Sort draft changes by timestamp
    const sortedDrafts = [...drafts].sort((a, b) => a.timestamp - b.timestamp);

    sortedDrafts.forEach(draft => {

      switch (draft.type) {
        case 'create':
          // Check if block already exists (could have been created by other drafts)
          const existingBlock = updatedBlocks.find(b => b.id === draft.blockId);
          if (!existingBlock) {
            // Process content for create correctly
            let blockData = { ...draft.data };
            if (blockData.content && typeof blockData.content === 'string') {
              try {
                blockData.content = JSON.parse(blockData.content);
              } catch {
                blockData.content = { text: blockData.content };
              }
            }

            console.log(`➕ Adding block from draft: ${draft.blockId} (${blockData.block_type || 'UNKNOWN'})`);
            console.log('📊 Block data:', blockData);

            // SECURITY CHECK: Prevent unwanted text blocks
            if (blockData.block_type === 'Text' && !blockData.content?.text && !blockData.content) {
              console.warn('⚠️ Preventing creation of empty Text block from draft');
              return; // Skip this block
            }

            updatedBlocks.push(blockData);
            pendingOps.set(draft.blockId, {
              operation: 'create',
              data: blockData,
              timestamp: draft.timestamp
            });
          } else {
            console.log(`ℹ️ Block ${draft.blockId} already exists, skipping create`);
          }
          break;

        case 'update':
          const blockIndex = updatedBlocks.findIndex(b => b.id === draft.blockId);
          if (blockIndex !== -1) {
            const currentBlock = updatedBlocks[blockIndex];

            // Verarbeite Content-Updates korrekt
            let processedDraftData = { ...draft.data };

            // Stelle sicher, dass Content-Felder als Objekte verarbeitet werden
            if (processedDraftData.content) {
              if (typeof processedDraftData.content === 'string') {
                try {
                  processedDraftData.content = JSON.parse(processedDraftData.content);
                } catch {
                  processedDraftData.content = { text: processedDraftData.content };
                }
              }
            }

            // IMPORTANT: Merge with the complete current block
            // Keep ALL properties of the current block and only overwrite the changed ones
            const updatedBlock = {
              ...currentBlock, // Keep all current block properties
              ...processedDraftData, // Only overwrite the changed properties
              updated_at: new Date().toISOString()
            };

            updatedBlocks[blockIndex] = updatedBlock;

            // For pending operations: Use the COMPLETE block state
            const fullBlockData = {
              id: updatedBlock.id,
              page_id: updatedBlock.page_id,
              block_type: updatedBlock.block_type,
              content: updatedBlock.content,
              grid_col: updatedBlock.grid_col,
              grid_row: updatedBlock.grid_row,
              grid_width: updatedBlock.grid_width,
              grid_height: updatedBlock.grid_height,
              background_color: updatedBlock.background_color,
              text_color: updatedBlock.text_color,
              z_index: updatedBlock.z_index,
              created_at: updatedBlock.created_at,
              updated_at: updatedBlock.updated_at
            };

            // Merge mit existierenden pending operations
            const existing = pendingOps.get(draft.blockId);
            if (existing && existing.operation === 'update') {
              pendingOps.set(draft.blockId, {
                operation: 'update',
                data: fullBlockData, // Use complete block data
                timestamp: Math.max(existing.timestamp, draft.timestamp)
              });
            } else if (!existing || existing.operation !== 'create') {
              pendingOps.set(draft.blockId, {
                operation: 'update',
                data: fullBlockData, // Use complete block data
                timestamp: draft.timestamp
              });
            }

          }
          break;

        case 'delete':
          updatedBlocks = updatedBlocks.filter(b => b.id !== draft.blockId);
          pendingOps.set(draft.blockId, {
            operation: 'delete',
            data: { id: draft.blockId },
            timestamp: draft.timestamp
          });
          break;

        case 'layout':
          // Layout changes are handled separately
          setPendingLayoutChanges(prevLayout => ({
            ...(prevLayout || {}),
            ...draft.data
          }));
          break;
      }
    });

    // Setze pending operations
    if (pendingOps.size > 0) {
      setPendingOperations(prevOps => {
        const newOps = new Map(prevOps);
        pendingOps.forEach((op, blockId) => {
          newOps.set(blockId, op);
        });
        return newOps;
      });
    }

    return updatedBlocks;
  }, []);

  // No more draft loading from localStorage - everything is in memory

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Load blocks for a specific page - ALWAYS from DB
  const loadBlocks = useCallback(async (pageId) => {
    if (!pageId) {
      return;
    }

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
          z_index: typeof block.z_index === 'number' ? block.z_index : 1,
          content: typeof block.content === 'string' ?
            (() => {
              try {
          return JSON.parse(block.content);
              } catch {
          return {};
              }
            })() :
            block.content || {},
        }));

        setBlocks(validBlocks);
        setPendingOperations(new Map());
        setSaveStatus('saved');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error loading blocks:', error);
      setSaveStatus('error');
      // Set empty blocks on error to prevent stale data
      setBlocks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cms/pages');
      if (response.ok) {
        const data = await response.json();
        setPages(data);

        // Try to restore saved page from localStorage
        let pageToSelect = null;
        if (typeof window !== 'undefined') {
          const savedPageId = localStorage.getItem('currentPageId');
          if (savedPageId) {
            pageToSelect = data.find(p => p.id === parseInt(savedPageId));
          }
        }

        // If no saved page or not found, select home page
        if (!pageToSelect && data.length > 0) {
          pageToSelect = data.find(page =>
            page.slug === 'home' ||
            page.slug === 'index' ||
            page.title?.toLowerCase() === 'home'
          ) || data[0];
        }

        if (pageToSelect) {
          setCurrentPage(pageToSelect);

          // Load blocks from database
          if (pageToSelect.id) {
            await loadBlocks(pageToSelect.id);
          }
        }
      } else {
        console.error('Failed to load pages');
      }
    } catch (error) {
      console.error('❌ Error loading pages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, loadBlocks]);

  // Load layout settings from API
  const loadLayoutSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/cms/layout');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setLayoutSettings(data);
        }
      }
    } catch (error) {
      console.error('❌ Error loading layout settings:', error);
    }
  }, []);

  // Select page and load its blocks
  const selectPage = useCallback((page) => {

    // Warn if there are unsaved changes
    if (pendingOperations.size > 0) {
      const confirmSwitch = window.confirm(
        `Sie haben ${pendingOperations.size} ungespeicherte Änderungen. Möchten Sie wirklich die Seite wechseln? Ungespeicherte Änderungen gehen verloren.`
      );
      if (!confirmSwitch) {
        return; // Cancel page switch
      }
    }

    // Clear current state
    setBlocks([]);
    setPendingOperations(new Map());
    setSaveStatus('saved');
    setDraftChanges([]);

    // Set new page
    setCurrentPage(page);

    // Load blocks from database
    if (page && page.id) {
      loadBlocks(page.id);
    }
  }, [loadBlocks, pendingOperations]);

  // Intelligente Operation mit Batching
  const batchOperation = useCallback((blockId, operation, data) => {
    console.log(`📦 batchOperation: ${operation} for block ${blockId}`, data);

    setPendingOperations(prev => {
      const newOps = new Map(prev);

      if (operation === 'delete') {
        // On delete: remove all other operations for this block
        newOps.delete(blockId);
        newOps.set(blockId, { operation, data, timestamp: Date.now() });
      } else {
        // Bei update/create: überschreibe vorherige Operation
        newOps.set(blockId, { operation, data, timestamp: Date.now() });
      }

      console.log(`✅ pendingOperations now has ${newOps.size} operations`);
      return newOps;
    });

    setSaveStatus('dirty');
  }, []);

  // Block erstellen mit verbesserter Collision Detection und Default-Options
  const createBlock = useCallback((blockData) => {
    console.log('🆕 createBlock called with:', blockData);
    console.trace('📍 createBlock call stack');

    // Validierung: Stelle sicher, dass blockData existiert
    if (!blockData) {
      console.error('❌ createBlock: blockData is undefined or null');
      return null;
    }

    // Normalisiere blockData zu einem konsistenten Format
    const normalizedData = typeof blockData === 'string'
      ? { block_type: blockData }
      : { ...blockData };

    // Stelle sicher, dass block_type existiert
    if (!normalizedData.block_type && !normalizedData.blockType) {
      console.error('❌ createBlock: block_type is missing', normalizedData);
      return null;
    }

    // Normalisiere block_type
    const blockType = normalizedData.block_type || normalizedData.blockType;

    // Lade Default-Options aus Component-Definition
    const componentDef = componentDefinitions[blockType];
    const defaultOptions = componentDef?.options || {};

    const blockId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Finde freie Position mit Collision Detection
    const findFreePosition = (preferredCol = 0, preferredRow = 0) => {
      // Get default sizes from nicConfig
      const defaultSize = nicConfig.defaultBlockSizes?.[blockType] || nicConfig.defaultBlockSizes?.default || { width: 4, height: 2 };

      // Unterstützt sowohl grid_width/grid_height als auch width/height für Flexibilität
      const blockWidth = typeof normalizedData.grid_width === 'number' ? normalizedData.grid_width :
                        typeof normalizedData.width === 'number' ? normalizedData.width :
                        componentDef?.width || defaultSize.width;
      const blockHeight = typeof normalizedData.grid_height === 'number' ? normalizedData.grid_height :
                         typeof normalizedData.height === 'number' ? normalizedData.height :
                         componentDef?.height || defaultSize.height;

      // Prüfe die bevorzugte Position zuerst
      const isPositionFree = (col, row) => {
        return !blocks.some(existingBlock => {
          const exCol = existingBlock.grid_col || 0;
          const exRow = existingBlock.grid_row || 0;
          const exWidth = existingBlock.grid_width || 2;
          const exHeight = existingBlock.grid_height || 1;

          // Prüfe Überlappung
          return !(col + blockWidth <= exCol || col >= exCol + exWidth ||
                   row + blockHeight <= exRow || row >= exRow + exHeight);
        });
      };

      // Versuche bevorzugte Position
      if (isPositionFree(preferredCol, preferredRow)) {
        return { col: preferredCol, row: preferredRow };
      }

      // Suche freie Position von oben links
      const maxRows = Math.max(10, blocks.length > 0 ? Math.max(...blocks.map(b => (b.grid_row || 0) + (b.grid_height || 1))) + 5 : 5);
      for (let row = 0; row < maxRows; row++) {
        for (let col = 0; col <= 12 - blockWidth; col++) {
          if (isPositionFree(col, row)) {
            return { col, row };
          }
        }
      }

      // Fallback: new row at the end
      const lastRow = blocks.length > 0 ? Math.max(...blocks.map(b => (b.grid_row || 0) + (b.grid_height || 1)), 0) : 0;
      return { col: 0, row: lastRow };
    };

    const freePosition = findFreePosition(
      typeof normalizedData.grid_width === 'number' ? normalizedData.grid_width : 0,
      typeof normalizedData.grid_height === 'number' ? normalizedData.grid_height : 0
    );

    // Verwende Default-Options aus Component-Definition als Content-Objekt
    let contentObject = {};

    // Priorisiere explizit übergebenen Content
    if (normalizedData.content) {
      if (typeof normalizedData.content === 'object') {
        contentObject = normalizedData.content;
      } else if (typeof normalizedData.content === 'string') {
        try {
          contentObject = JSON.parse(normalizedData.content);
        } catch {
          contentObject = { text: normalizedData.content };
        }
      }
    } else if (defaultOptions && Object.keys(defaultOptions).length > 0) {
      // Verwende Default-Options als Content
      contentObject = { ...defaultOptions };
    } else {
      // Kein automatischer Fallback mehr - Block muss gültigen Content haben
      console.warn(`Block ${blockType} konnte nicht erstellt werden: Kein gültiger Content oder Default-Options gefunden`);
      return null; // Prevent automatic text block creation
    }

    const newBlock = {
      id: blockId,
      page_id: currentPage?.id,
      block_type: blockType,
      content: contentObject, // Speichere als Objekt im lokalen State
      grid_col: freePosition.col,
      grid_row: freePosition.row,
      grid_width: typeof normalizedData.grid_width === 'number' ? normalizedData.grid_width :
                 typeof normalizedData.width === 'number' ? normalizedData.width :
                 componentDef?.width || 2,
      grid_height: typeof normalizedData.grid_height === 'number' ? normalizedData.grid_height :
                  typeof normalizedData.height === 'number' ? normalizedData.height :
                  componentDef?.height || 1,
      background_color: normalizedData.background_color || 'transparent',
      text_color: normalizedData.text_color || '#000000',
      z_index: typeof normalizedData.z_index === 'number' ? normalizedData.z_index : 1,
      // Speichere Default-Options als separates Feld für Debug-Zwecke
      options: defaultOptions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      saveStateToHistory(); // Speichere Zustand für Undo
      setBlocks(prev => [...prev, newBlock]);
      batchOperation(blockId, 'create', newBlock);

      // Automatisch den neuen Block auswählen
      setSelectedBlock(newBlock);

      // Speichere Draft-Änderung in localStorage
      const draftChange = {
        id: Date.now(),
        type: 'create',
        blockId: blockId,
        data: newBlock,
        timestamp: Date.now()
      };

      setDraftChanges(prev => {
        const updated = [...prev, draftChange];
        saveSingleBlockChange(draftChange);
        return updated;
      });

      console.log(`✅ Created block with temp ID: ${blockId}, type: ${blockType}`);
      return newBlock;
    } catch (error) {
      console.error('❌ Error creating block:', error);
      return null;
    }
  }, [currentPage, batchOperation, blocks, componentDefinitions, saveStateToHistory]);

  // Block aktualisieren
  const updateBlock = useCallback((blockId, updates) => {
    console.log(`🔄 updateBlock called for ${blockId}:`, updates);

    // Sofort UI aktualisieren für responsive Feedback
    saveStateToHistory(); // Speichere Zustand für Undo

    // Force immediate state update with timestamp to trigger re-renders
    const timestamp = new Date().toISOString();
    let currentBlock = null;
    let updatedBlock = null;

    setBlocks(prev => {
      currentBlock = prev.find(b => b.id === blockId);
      const updated = prev.map(block => {
        if (block.id === blockId) {
          updatedBlock = { ...block, ...updates, updated_at: timestamp };
          return updatedBlock;
        }
        return block;
      });
      console.log(`✅ Blocks updated, new position:`, updatedBlock);
      return updated;
    });

    // Aktualisiere selectedBlock falls es das gleiche ist
    setSelectedBlock(prev => {
      if (prev && prev.id === blockId) {
        return { ...prev, ...updates, updated_at: timestamp };
      }
      return prev;
    });

    // Process the update after state is set
    if (currentBlock && updatedBlock) {
      // Stelle sicher, dass Content-Updates korrekt verarbeitet werden
      let processedUpdates = { ...updates };

      // If content is passed as object, keep it as object in local state
      // (Konvertierung zu JSON-String erfolgt nur beim Speichern zur API)
      if (processedUpdates.content && typeof processedUpdates.content === 'string') {
        try {
          processedUpdates.content = JSON.parse(processedUpdates.content);
        } catch {
          // Falls JSON-Parsing fehlschlägt, verwende als Plain-Text
          processedUpdates.content = { text: processedUpdates.content };
        }
      }

      // Wichtig: Wenn Block eine temp_id hat, behandle als CREATE, nicht UPDATE
      const operationType = blockId.toString().startsWith('temp_') ? 'create' : 'update';
      console.log(`📦 Calling batchOperation: ${operationType} for ${blockId}`);
      batchOperation(blockId, operationType, updatedBlock);

      // Speichere Draft-Änderung in localStorage
      const draftChange = {
        id: Date.now(),
        type: operationType,
        blockId: blockId,
        data: operationType === 'create' ? updatedBlock : processedUpdates,
        timestamp: Date.now()
      };

      setDraftChanges(prev => {
        const updated = [...prev, draftChange];
        saveSingleBlockChange(draftChange);
        return updated;
      });

      console.log(`🔄 Updated block ${blockId} (${operationType}):`, Object.keys(updates));
    } else {
      console.warn(`⚠️ Block ${blockId} not found for update`);
    }
  }, [batchOperation, saveStateToHistory]);

  const deleteBlock = useCallback((blockId) => {

    saveStateToHistory(); // Speichere Zustand für Undo
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    batchOperation(blockId, 'delete', { id: blockId });

    // Speichere Draft-Änderung in localStorage
    const draftChange = {
      id: Date.now(),
      type: 'delete',
      blockId: blockId,
      timestamp: Date.now()
    };

    setDraftChanges(prev => {
      const updated = [...prev, draftChange];
      saveSingleBlockChange(draftChange);
      return updated;
    });
  }, [batchOperation, saveStateToHistory]);

  // Layout Settings Management
  const updateLayoutSettings = useCallback((newSettings) => {
    console.log('🎨 Updating layout settings:', newSettings);

    // Validiere die Eingabedaten
    if (!newSettings || typeof newSettings !== 'object') {
      console.error('❌ Invalid layout settings provided:', newSettings);
      return;
    }

    // Check if settings actually changed to prevent unnecessary updates
    const hasChanges = Object.keys(newSettings).some(key =>
      layoutSettings[key] !== newSettings[key]
    );

    if (!hasChanges) {
      console.log('ℹ️ No layout changes detected, skipping update');
      return;
    }

    console.log('📝 Layout changes detected:', Object.keys(newSettings).filter(key =>
      layoutSettings[key] !== newSettings[key]
    ));

    // Aktualisiere lokalen State sofort für sofortiges Feedback
    setLayoutSettings(prev => {
      const updated = { ...prev, ...newSettings };
      console.log('✅ Updated local layout settings:', updated);

      // Markiere als pending für späteren Batch-Upload nur wenn sich was geändert hat
      setPendingLayoutChanges(newSettings);
      setSaveStatus('dirty');

      // Speichere Draft-Änderung in localStorage
      const draftChange = {
        id: Date.now(),
        type: 'layout',
        data: newSettings,
        timestamp: Date.now()
      };

      setDraftChanges(prev => {
        // Entferne nur das letzte Layout-Change, um Duplikate zu vermeiden
        const filtered = prev.filter(change => change.type !== 'layout');
        const updatedDrafts = [...filtered, draftChange];
        saveSingleBlockChange(draftChange);
        console.log('💾 Saved layout draft change to localStorage');
        return updatedDrafts;
      });

      return updated;
    });
  }, [layoutSettings]);

  // Alle Draft-Änderungen veröffentlichen mit verbessertem Batch-API
  const publishDrafts = useCallback(async () => {

    // Sammle alle Änderungen aus verschiedenen Quellen
    const hasBlockChanges = pendingOperations.size > 0;
    const hasLayoutChanges = pendingLayoutChanges !== null;
    const hasDraftChanges = draftChanges.length > 0;
    const allDraftChanges = draftChanges;

    if (!hasBlockChanges && !hasLayoutChanges && allDraftChanges.length === 0) {
      return;
    }

    // IMPORTANT: Load the latest blocks from the database before publishing
    // um sicherzustellen, dass wir mit den aktuellsten Daten arbeiten
    let latestBlocksFromDB = [];
    if (currentPage?.id) {
      try {
        const response = await fetch(`/api/cms/pages/${currentPage.id}/blocks`);
        if (response.ok) {
          latestBlocksFromDB = await response.json();
        }
      } catch (error) {
        console.warn('⚠️ Could not load latest blocks from database, using current state:', error);
      }
    }

    try {
      setSaveStatus('saving');

      console.log(`🚀 Starting publish process with ${blocks.length} current blocks`);

      const promises = [];

      // 1. Verarbeite Draft-Änderungen zu pendingOperations
      if (allDraftChanges.length > 0) {

        // Konvertiere Draft-Änderungen zu pendingOperations Format
        const additionalOperations = new Map();

        allDraftChanges.forEach(draft => {
          switch (draft.type) {
            case 'create':
              additionalOperations.set(draft.blockId, {
                operation: 'create',
                data: draft.data,
                timestamp: draft.timestamp
              });
              break;
            case 'update':
              // Merge mit existierenden pending operations
              const existingOp = pendingOperations.get(draft.blockId) || additionalOperations.get(draft.blockId);
              if (existingOp && existingOp.operation === 'update') {
                additionalOperations.set(draft.blockId, {
                  operation: 'update',
                  data: { ...existingOp.data, ...draft.data },
                  timestamp: Math.max(existingOp.timestamp, draft.timestamp)
                });
              } else {
                additionalOperations.set(draft.blockId, {
                  operation: 'update',
                  data: draft.data,
                  timestamp: draft.timestamp
                });
              }
              break;
            case 'delete':
              additionalOperations.set(draft.blockId, {
                operation: 'delete',
                data: { id: draft.blockId },
                timestamp: draft.timestamp
              });
              break;
            case 'layout':
              // Layout changes are handled separately
              if (!pendingLayoutChanges) {
                setPendingLayoutChanges(draft.data);
              }
              break;
          }
        });

        // Merge zusätzliche Operations mit existierenden
        additionalOperations.forEach((operation, blockId) => {
          if (!pendingOperations.has(blockId)) {
            setPendingOperations(prev => new Map(prev).set(blockId, operation));
          }
        });
      }

      // 2. Sammle alle Block-Operations mit aktuellen Positionen aus dem State
      const allBlockOperations = new Map();

      // Use ONLY the current blocks from state - NOT from localStorage
      // localStorage may contain outdated temp_ IDs that lead to duplicate blocks
      const allCurrentBlocks = [...blocks];

      console.log(`📋 Processing ${allCurrentBlocks.length} blocks from current state`);

      // Process ONLY blocks with temp_ IDs that are also in pendingOperations or draftChanges
      // Das verhindert, dass alte temp_ IDs aus localStorage doppelt erstellt werden
      const tempBlocksToCreate = allCurrentBlocks.filter(block => {
        if (!block.id || !block.id.toString().startsWith('temp_')) {
          return false;
        }

        // Check if this block is in pendingOperations or draftChanges
        const hasPendingOperation = pendingOperations.has(block.id);
        const hasDraftChange = allDraftChanges.some(draft => draft.blockId === block.id);

        return hasPendingOperation || hasDraftChange;
      });

      console.log(`📋 Found ${tempBlocksToCreate.length} temp blocks that need to be created`);

      tempBlocksToCreate.forEach(block => {
        // Neuer Block mit temporärer ID → CREATE Operation
        let operationData = {
          id: block.id,
          page_id: block.page_id || currentPage?.id,
          block_type: block.block_type,
          content: typeof block.content === 'object' ? JSON.stringify(block.content) : block.content,
          grid_col: block.grid_col || 0,
          grid_row: block.grid_row || 0,
          grid_width: block.grid_width || 2,
          grid_height: block.grid_height || 1,
          background_color: block.background_color || 'transparent',
          text_color: block.text_color || '#000000',
          z_index: block.z_index || 1,
          created_at: block.created_at,
          updated_at: block.updated_at
        };

        // Füge nur hinzu wenn noch keine Operation für diesen Block existiert
        if (!allBlockOperations.has(block.id)) {
          allBlockOperations.set(block.id, {
            operation: 'create',
            data: operationData,
            timestamp: new Date(block.created_at || Date.now()).getTime()
          });
        }
      });

      // Sammle existierende pendingOperations
      pendingOperations.forEach((operation, blockId) => {
        // Find the current block from state to get latest position
        const currentBlock = blocks.find(b => b.id === blockId);
        let operationData = operation.data;

        // If we have a current block, use its latest data (for position updates)
        if (currentBlock && operation.operation === 'update') {
          console.log(`🔄 Merging latest block data for ${blockId} from state`);
          operationData = {
            id: currentBlock.id,
            page_id: currentBlock.page_id,
            block_type: currentBlock.block_type,
            content: currentBlock.content,
            grid_col: currentBlock.grid_col,
            grid_row: currentBlock.grid_row,
            grid_width: currentBlock.grid_width,
            grid_height: currentBlock.grid_height,
            background_color: currentBlock.background_color,
            text_color: currentBlock.text_color,
            z_index: currentBlock.z_index,
            created_at: currentBlock.created_at,
            updated_at: currentBlock.updated_at
          };
        }

        // Ensure content is transmitted as JSON string for existing operations
        if (operationData && operationData.content && typeof operationData.content === 'object') {
          operationData = {
            ...operationData,
            content: JSON.stringify(operationData.content)
          };
        }

        // IMPORTANT: If blockId is a temp-ID, ALWAYS treat as CREATE
        const finalOperationType = blockId.toString().startsWith('temp_') ? 'create' : operation.operation;

        allBlockOperations.set(blockId, {
          operation: finalOperationType,
          data: operationData,
          timestamp: operation.timestamp
        });
      });

        // Dann verarbeite Draft-Änderungen und verwende die AKTUELLEN Block-Positionen
        // ABER: Merge mit neuesten Daten aus der Datenbank
        if (allDraftChanges.length > 0) {
          const updatedBlocksMap = new Map();

          // Create a map of current blocks for quick access
          // Priorisiere Datenbank-Daten, dann lokale Änderungen
          const blocksToUse = latestBlocksFromDB.length > 0 ? latestBlocksFromDB : blocks;
          blocksToUse.forEach(block => {
            updatedBlocksMap.set(block.id, block);
          });

          // Überschreibe mit lokalen Änderungen aus dem State (falls neuer)
          blocks.forEach(localBlock => {
            const dbBlock = updatedBlocksMap.get(localBlock.id);
            if (!dbBlock || new Date(localBlock.updated_at || 0) > new Date(dbBlock.updated_at || 0)) {
              updatedBlocksMap.set(localBlock.id, localBlock);
            }
          });

          allDraftChanges.forEach(draft => {
            if (['create', 'update', 'delete'].includes(draft.type)) {
              const currentBlock = updatedBlocksMap.get(draft.blockId);

              let operationData;
              switch (draft.type) {
                case 'create':
                  operationData = draft.data;
                  break;
                case 'update':
                  // Verwende die AKTUELLE Block-Position aus dem State, nicht nur die Draft-Änderung
                  // Stelle sicher, dass ALLE Block-Eigenschaften übertragen werden
                  if (currentBlock) {
                    operationData = {
                      id: currentBlock.id,
                      page_id: currentBlock.page_id,
                      block_type: currentBlock.block_type,
                      content: currentBlock.content,
                      grid_col: currentBlock.grid_col,
                      grid_row: currentBlock.grid_row,
                      grid_width: currentBlock.grid_width,
                      grid_height: currentBlock.grid_height,
                      background_color: currentBlock.background_color,
                      text_color: currentBlock.text_color,
                      z_index: currentBlock.z_index,
                      created_at: currentBlock.created_at,
                      updated_at: currentBlock.updated_at
                    };
                  } else {
                    operationData = draft.data;
                  }
                  break;
                case 'delete':
                  operationData = { id: draft.blockId };
                  break;
              }

              // Ensure content is transmitted as JSON string
              if (operationData && operationData.content && typeof operationData.content === 'object') {
                operationData = {
                  ...operationData,
                  content: JSON.stringify(operationData.content)
                };
              }

              // Prevent duplicate operations for the same block
              if (!allBlockOperations.has(draft.blockId)) {
                // IMPORTANT: If blockId is a temp-ID, ALWAYS treat as CREATE
                const finalOperationType = draft.blockId.toString().startsWith('temp_') ? 'create' : draft.type;

                allBlockOperations.set(draft.blockId, {
                  operation: finalOperationType,
                  data: operationData,
                  timestamp: draft.timestamp
                });
              }
            }
          });
        }      // 3. Veröffentliche Block-Änderungen (falls vorhanden)
      if ((hasBlockChanges || allBlockOperations.size > 0) && currentPage) {

        // Debug: Zeige alle Operations die gesendet werden
        const operations = Array.from(allBlockOperations.values());
        console.log(`📤 Sending ${operations.length} block operations to server:`);
        operations.forEach((op, index) => {
          console.log(`  ${index + 1}. ${op.operation.toUpperCase()}: ${op.data?.block_type || 'unknown'} (ID: ${op.data?.id || 'unknown'})`);
        });

        const blockPromise = fetch(`/api/cms/pages/${currentPage.id}/blocks/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operations: operations, rows: currentPage.rows || 12})
        });
        promises.push({ type: 'blocks', promise: blockPromise });
      }

      // 4. Sammle Layout-Änderungen aus drafts und aktuellen pendingLayoutChanges
      let finalLayoutChanges = pendingLayoutChanges ? { ...pendingLayoutChanges } : null;

      // Sammle alle Layout-Änderungen aus draft changes
      allDraftChanges.forEach(draft => {
        if (draft.type === 'layout') {
          finalLayoutChanges = finalLayoutChanges ?
            { ...finalLayoutChanges, ...draft.data } :
            { ...draft.data };
        }
      });

      // Füge auch aktuelle layoutSettings hinzu, falls finalLayoutChanges existiert
      if (finalLayoutChanges) {
        // Merge mit aktuellen layoutSettings um sicherzustellen, dass alle Felder vorhanden sind
        finalLayoutChanges = {
          header_component: layoutSettings.header_component || 'default',
          footer_component: layoutSettings.footer_component || 'default',
          background_color: layoutSettings.background_color || '#ffffff',
          background_image: layoutSettings.background_image || null,
          primary_color: layoutSettings.primary_color || '#3b82f6',
          secondary_color: layoutSettings.secondary_color || '#64748b',
          ...finalLayoutChanges // Überschreibe mit den tatsächlichen Änderungen
        };

        console.log('📋 Final layout changes to be published:', finalLayoutChanges);
      }

      // 5. Veröffentliche Layout-Änderungen (falls vorhanden)
      if (finalLayoutChanges) {
        console.log('🎨 Publishing layout settings:', finalLayoutChanges);

        const layoutPromise = fetch('/api/cms/layout', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalLayoutChanges)
        });
        promises.push({ type: 'layout', promise: layoutPromise });
      }

      // 6. Wait for all promises
      const results = await Promise.allSettled(promises.map(p => p.promise));

      // 7. Verarbeite Ergebnisse
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const promiseInfo = promises[i];

        if (result.status === 'fulfilled') {
          if (!result.value.ok) {
            const errorData = await result.value.json();
            throw new Error(`${promiseInfo.type} operation failed: ${result.value.status} - ${errorData.error || 'Unknown error'}`);
          }

          const data = await result.value.json();

          if (promiseInfo.type === 'blocks') {

            // Aktualisiere Block-UI mit Server-Response
            if (data.blocks && Array.isArray(data.blocks)) {
              const normalizedBlocks = data.blocks.map(block => ({
                ...block,
                grid_col: typeof block.grid_col === 'number' && !isNaN(block.grid_col) ? block.grid_col : 0,
                grid_row: typeof block.grid_row === 'number' && !isNaN(block.grid_row) ? block.grid_row : 0,
                grid_width: typeof block.grid_width === 'number' && !isNaN(block.grid_width) ? block.grid_width : 2,
                grid_height: typeof block.grid_height === 'number' && !isNaN(block.grid_height) ? block.grid_height : 1,
                background_color: block.background_color || 'transparent',
                text_color: block.text_color || '#000000',
                z_index: typeof block.z_index === 'number' ? block.z_index : 1,
                // Ensure content is correctly processed as object
                content: typeof block.content === 'string' ?
                  (() => {
                    try {
                      return JSON.parse(block.content);
                    } catch {
                      return {};
                    }
                  })() :
                  block.content || {}
              }));

              // Create ID mapping for new blocks (temp_id -> real_id)
              const idMapping = new Map();
              if (data.results) {
                data.results.forEach(result => {
                  if (result.operation === 'create' && result.tempId && result.block) {
                    idMapping.set(result.tempId, result.block.id);
                    console.log(`✅ Block ID mapping: ${result.tempId} → ${result.block.id}`);
                  }
                });
              }

              // Aktualisiere selectedBlock falls es eine temp_id hatte
              if (selectedBlock && selectedBlock.id && idMapping.has(selectedBlock.id)) {
                const newRealId = idMapping.get(selectedBlock.id);
                const updatedSelectedBlock = normalizedBlocks.find(b => b.id === newRealId);
                if (updatedSelectedBlock) {
                  setSelectedBlock(updatedSelectedBlock);
                }
              }

              // Set the final blocks directly from server
              console.log(`✅ Setting ${normalizedBlocks.length} blocks from server response`);
              setBlocks(normalizedBlocks);

              // Aktualisiere localStorage sofort mit den finalen Server-Daten
              if (typeof window !== 'undefined') {
                try {
                  localStorage.setItem('blocks', JSON.stringify(normalizedBlocks));
                  console.log('✅ Updated localStorage with final blocks from server');
                } catch (error) {
                  console.warn('⚠️ Could not update localStorage with server blocks:', error);
                }
              }
            }
          } else if (promiseInfo.type === 'layout') {
            console.log('✅ Layout operation successful:', result.value.status);

            // Aktualisiere Layout-UI mit Server-Daten
            if (data) {
              console.log('🎨 Updated layout settings from server:', data);
              setLayoutSettings(data);

              // Confirm that layout changes were successfully saved
              console.log('✅ Layout settings successfully saved to database');
            } else {
              console.warn('⚠️ Layout operation successful but no data returned');
            }
          }
        } else {
          throw new Error(`${promiseInfo.type} operation failed: ${result.reason}`);
        }
      }

      if (hasBlockChanges || allDraftChanges.some(d => ['create', 'update', 'delete'].includes(d.type))) {
        setPendingOperations(new Map());
      }
      if (hasLayoutChanges || allDraftChanges.some(d => d.type === 'layout')) {
        setPendingLayoutChanges(null);
      }

      setSaveStatus('saved');
      setLastSaveTime(new Date());

      // Verification: Check if all expected blocks are still present after saving
      if (currentPage?.id) {
        setTimeout(async () => {
          try {
            const response = await fetch(`/api/cms/pages/${currentPage.id}/blocks`);
            if (response.ok) {
              const dbBlocks = await response.json();
              console.log(`✅ Verification: Found ${dbBlocks.length} blocks in database after publishing`);

              if (dbBlocks.length === 0 && blocks.length > 0) {
                console.error('❌ CRITICAL: All blocks disappeared after publishing!');
              } else if (dbBlocks.length > 0) {
                console.log('✅ All blocks successfully saved to database');
              }
            }
          } catch (error) {
            console.warn('⚠️ Could not verify blocks after publishing:', error);
          }
        }, 1000);
      }

      // 9. Lösche ALLE Draft-Änderungen (State only)
      setDraftChanges([]);

      console.log('✅ All draft changes published and cleared');

    } catch (error) {
      console.error('❌ Error publishing drafts:', error);
      setSaveStatus('error');
      throw error;
    }
  }, [currentPage, pendingOperations, pendingLayoutChanges, draftChanges, blocks]);

  // Separater useEffect zum Aktualisieren des localStorage nach Block-Änderungen
  useEffect(() => {
    if (typeof window !== 'undefined' && blocks.length >= 0) { // Auch leere Arrays speichern
      // Debounce localStorage updates to avoid excessive writes
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem('blocks', JSON.stringify(blocks));
          console.log(`💾 Saved ${blocks.length} blocks to localStorage`);
        } catch (error) {
          console.warn('⚠️ Could not update localStorage with blocks:', error);
        }
      }, 200); // Schnellere Reaktion für bessere UX

      return () => clearTimeout(timeoutId);
    }
  }, [blocks]);

  // Draft-Änderungen verwerfen
  const discardDrafts = useCallback(() => {

    // Reload blocks when page is selected - explicitly load from DB
    if (currentPage && currentPage.id) {
      loadBlocks(currentPage.id);
    }

    // Lade Layout-Einstellungen neu
    loadLayoutSettings();

    // Bereinige alle Pending-Änderungen
    setPendingOperations(new Map());
    setPendingLayoutChanges(null);
    setSaveStatus('saved');

    // Lösche ALLE Draft-Änderungen (State only)
    setDraftChanges([]);

    console.log('✅ All draft changes discarded, layout settings reloaded');

  }, [currentPage, loadBlocks, loadLayoutSettings, draftChanges, blocks]);

  // Manuelles Speichern
  const saveNow = useCallback(async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    await publishDrafts();
  }, [publishDrafts]);

  // Initialisierung
  useEffect(() => {
    loadPages();
    loadLayoutSettings();
    loadComponentDefinitions();
  }, []);

  // Berechne die Gesamtanzahl der ausstehenden Änderungen (inklusive localStorage)
  const getTotalPendingChanges = useCallback(() => {
    let totalPendingOperations = pendingOperations.size;
    let totalLayoutChanges = pendingLayoutChanges ? 1 : 0;
    let totalDraftChanges = draftChanges.length;

    return totalPendingOperations + totalLayoutChanges + totalDraftChanges;
  }, [pendingOperations.size, pendingLayoutChanges, draftChanges.length]);

  const [componentFiles, setComponentFiles] = useState([]);

  const loadComponents = async () => {
    const components = await getComponentFiles();
    setComponentFiles(components);
  };

  useEffect(() => {
    loadComponents();
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (typeof window === 'undefined') return;

      switch (e.key) {
        case 'blocks':
          setBlocks(e.newValue ? JSON.parse(e.newValue) : []);
          break;
        case 'undoHistory':
          setUndoHistory(e.newValue ? JSON.parse(e.newValue) : []);
          break;
        case 'redoHistory':
          setRedoHistory(e.newValue ? JSON.parse(e.newValue) : []);
          break;
        case 'draftChanges':
          setDraftChanges(e.newValue ? JSON.parse(e.newValue) : []);
          break;
        case 'currentPage':
          setCurrentPage(e.newValue ? JSON.parse(e.newValue) : null);
          break;
        default:
          break;
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Synchronisiere States mit localStorage bei Änderungen (mit Debouncing)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem('undoHistory', JSON.stringify(undoHistory));
          localStorage.setItem('redoHistory', JSON.stringify(redoHistory));
          localStorage.setItem('draftChanges', JSON.stringify(draftChanges));
          localStorage.setItem('currentPage', JSON.stringify(currentPage));
          // Blocks werden separat im anderen useEffect behandelt
        } catch (error) {
          console.warn('⚠️ Could not update localStorage:', error);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [undoHistory, redoHistory, draftChanges, currentPage]);

  // =======================
  // RESPONSIVE LAYOUT SYSTEM
  // =======================

  /**
   * Generate responsive layouts automatically for all devices
   */
  const generateAutoResponsiveLayouts = useCallback(() => {
    if (!autoResponsiveEnabled || !currentPage) return;

    console.log('🔄 Generating auto-responsive layouts...');
    const newLayouts = generateResponsiveLayouts(blocks, deviceSize);

    setResponsiveLayouts(newLayouts);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('responsiveLayouts', JSON.stringify(newLayouts));
        localStorage.setItem(`responsiveLayouts_page_${currentPage.id}`, JSON.stringify(newLayouts));
      } catch (error) {
        console.warn('⚠️ Could not save responsive layouts:', error);
      }
    }

    console.log('✅ Responsive layouts generated', newLayouts);
  }, [blocks, deviceSize, autoResponsiveEnabled, currentPage]);

  /**
   * Toggle auto-responsive mode
   */
  const toggleAutoResponsive = useCallback((enabled) => {
    setAutoResponsiveEnabled(enabled);

    if (enabled) {
      // Generate layouts immediately when enabled
      generateAutoResponsiveLayouts();
    }
  }, [generateAutoResponsiveLayouts]);

  /**
   * Get blocks for current device
   */
  const getCurrentDeviceBlocks = useCallback(() => {
    if (!autoResponsiveEnabled || !responsiveLayouts[deviceSize]) {
      return blocks;
    }

    return responsiveLayouts[deviceSize] || blocks;
  }, [blocks, deviceSize, autoResponsiveEnabled, responsiveLayouts]);

  /**
   * Manually adjust responsive layout for specific device
   */
  const updateResponsiveLayout = useCallback((device, updatedBlocks) => {
    const newLayouts = smartRegenerateLayouts(responsiveLayouts, updatedBlocks, device);
    setResponsiveLayouts(newLayouts);
  }, [responsiveLayouts]);

  /**
   * Get grid configuration for current device
   */
  const getCurrentGridConfig = useCallback(() => {
    return RESPONSIVE_GRIDS[deviceSize] || RESPONSIVE_GRIDS.desktop;
  }, [deviceSize]);

  /**
   * Switch device size and load appropriate layout
   */
  const switchDevice = useCallback((newDevice) => {
    console.log(`📱 Switching to ${newDevice}...`);
    setDeviceSize(newDevice);

    // If auto-responsive is enabled and no layout exists, generate it
    if (autoResponsiveEnabled && !responsiveLayouts[newDevice]) {
      generateAutoResponsiveLayouts();
    }
  }, [autoResponsiveEnabled, responsiveLayouts, generateAutoResponsiveLayouts]);

  // Auto-generate responsive layouts when blocks change significantly
  useEffect(() => {
    if (autoResponsiveEnabled && blocks.length > 0 && currentPage) {
      // Debounce the generation to avoid too many updates
      const timeoutId = setTimeout(() => {
        console.log('🔄 Auto-regenerating responsive layouts due to block changes...');
        generateAutoResponsiveLayouts();
      }, 800); // Increased debounce for better UX

      return () => clearTimeout(timeoutId);
    }
  }, [blocks, autoResponsiveEnabled, currentPage?.id]); // React to any block changes (position, size, etc.)

  // Generate responsive layouts when page changes and auto-responsive is enabled
  useEffect(() => {
    if (currentPage && autoResponsiveEnabled && blocks.length > 0) {
      generateAutoResponsiveLayouts();
    }
  }, [currentPage?.id, autoResponsiveEnabled]);

  // Recalculate pending count whenever dependencies change
  const pendingOperationsCount = React.useMemo(() => {
    const count = getTotalPendingChanges();
    console.log(`📊 pendingOperationsCount updated: ${count} (pendingOps: ${pendingOperations.size}, drafts: ${draftChanges.length})`);
    return count;
  }, [pendingOperations, pendingLayoutChanges, draftChanges.length, getTotalPendingChanges]);

  const value = {
    pages,
    currentPage,
    blocks,
    isLoading,
    saveStatus,
    lastSaveTime,
    // Use memoized count that updates automatically
    pendingOperationsCount,

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
    draftChanges,
    pendingOperations,

    selectedBlock,

    // Additional properties that might be expected by existing components
    activeBlock: null,
    mode,
    setMode,
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

    setSelectedBlock,

    // API Methods that might be expected
    loadPages,
    loadComponentDefinitions,
    componentDefinitions,
    createPage: async (title, slug) => {
      try {

        const response = await fetch('/api/cms/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, slug })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const newPage = await response.json();

        // Aktualisiere die Seiten-Liste
        setPages(prev => [...prev, newPage]);

        return newPage;
      } catch (error) {
        console.error('❌ Error creating page:', error);
        throw error;
      }
    },
    updatePage: async (pageId, title, slug) => {
      try {

        const response = await fetch(`/api/cms/pages/${pageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, slug })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const updatedPage = await response.json();

        // Aktualisiere die Seiten-Liste
        setPages(prev => prev.map(page =>
          page.id === pageId ? updatedPage : page
        ));

        // Aktualisiere currentPage falls es die gleiche ist
        if (currentPage && currentPage.id === pageId) {
          setCurrentPage(updatedPage);
        }

        return updatedPage;
      } catch (error) {
        console.error('❌ Error updating page:', error);
        throw error;
      }
    },
    deletePage: async (pageId) => {
      try {

        const response = await fetch(`/api/cms/pages/${pageId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        // Entferne die Seite aus der Liste
        setPages(prev => prev.filter(page => page.id !== pageId));

        // Falls die aktuelle Seite gelöscht wurde, wähle eine andere aus
        if (currentPage && currentPage.id === pageId) {
          const remainingPages = pages.filter(page => page.id !== pageId);
          if (remainingPages.length > 0) {
            selectPage(remainingPages[0]);
          } else {
            setCurrentPage(null);
            setBlocks([]);
          }
        }

        return true;
      } catch (error) {
        console.error('❌ Error deleting page:', error);
        throw error;
      }
    },
    loadLayoutSettings,
    updateLayoutSettings,
    layoutSettings,
    pendingLayoutChanges,
    snapToGridValue: () => {},
    getSnapLines: () => [],

    componentFiles,
    setComponentFiles,
    loadComponents,

    deviceSize,
    setDeviceSize,
    switchDevice,

    // Responsive Layout System
    responsiveLayouts,
    setResponsiveLayouts,
    autoResponsiveEnabled,
    toggleAutoResponsive,
    generateAutoResponsiveLayouts,
    getCurrentDeviceBlocks,
    updateResponsiveLayout,
    getCurrentGridConfig,
    RESPONSIVE_GRIDS,

    // Helper functions
    getTotalPendingChanges,

    // Debug functions
    debugLocalStorage: () => {
      console.log('🔍 localStorage Debug Info:');
      console.log('Blocks:', JSON.parse(localStorage.getItem('blocks') || '[]'));
      console.log('Draft Changes:', draftChanges);
      console.log('Current Page:', currentPage);
    },

    cleanupAllStorage: () => {
      console.log('🧹 No localStorage cleanup needed - using memory only');
      console.log('✅ Nothing to clean');
    },
  };

  return (
    <CMSContext.Provider value={value}>
      {children}
    </CMSContext.Provider>
  );
};
