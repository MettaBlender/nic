'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  saveDraftChanges,
  loadDraftChanges,
  clearDraftChanges,
  savePageBlockState,
  loadPageBlockState,
  saveSingleBlockChange,
  cleanupOldDrafts
} from '../utils/localStorageManager.js';
import { getComponentFiles } from '@/components/nic/cms/Components.jsx';

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

  // Undo/Redo System
  const [undoHistory, setUndoHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const MAX_HISTORY_SIZE = 50;

  const [selectedBlock, setSelectedBlock] = useState(null);

  // Blöcke Management mit intelligentem Batching
  const [blocks, setBlocks] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('blocks');
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [pendingOperations, setPendingOperations] = useState(new Map());
  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSaveTime, setLastSaveTime] = useState(null);

  // Ursprüngliche Block-Positionen aus der Datenbank (für Vergleich)
  const [originalBlockPositions, setOriginalBlockPositions] = useState(new Map());

  // Hilfsfunktion zum Speichern des aktuellen Zustands - NACH blocks Deklaration
  const saveStateToHistory = useCallback(() => {
    const currentState = {
      blocks: [...blocks],
      timestamp: Date.now()
    };
    setUndoHistory(prev => {
      const newHistory = [...prev, currentState];
      // Begrenze die Historie auf MAX_HISTORY_SIZE
      return newHistory.length > MAX_HISTORY_SIZE ? newHistory.slice(-MAX_HISTORY_SIZE) : newHistory;
    });
    // Leere Redo-Historie bei neuer Aktion
    setRedoHistory([]);
  }, [blocks]);

  // Undo/Redo Funktionen - NACH blocks Deklaration
  const undo = useCallback(() => {
    if (undoHistory.length === 0) {
      console.log('No actions to undo');
      return;
    }

    const lastState = undoHistory[undoHistory.length - 1];
    const currentState = {
      blocks: [...blocks],
      timestamp: Date.now()
    };

    // Setze den Zustand zurück
    setBlocks(lastState.blocks);
    setSelectedBlock(null); // Deselektiere Block bei Undo

    // Entferne den letzten Zustand aus Undo-Historie
    setUndoHistory(prev => prev.slice(0, -1));

    // Füge den aktuellen Zustand zur Redo-Historie hinzu
    setRedoHistory(prev => [...prev, currentState]);

    console.log('Undo performed');
  }, [undoHistory, blocks]);

  const redo = useCallback(() => {
    if (redoHistory.length === 0) {
      console.log('No actions to redo');
      return;
    }

    const nextState = redoHistory[redoHistory.length - 1];
    const currentState = {
      blocks: [...blocks],
      timestamp: Date.now()
    };

    // Setze den Zustand vorwärts
    setBlocks(nextState.blocks);
    setSelectedBlock(null); // Deselektiere Block bei Redo

    // Entferne den letzten Zustand aus Redo-Historie
    setRedoHistory(prev => prev.slice(0, -1));

    // Füge den aktuellen Zustand zur Undo-Historie hinzu
    setUndoHistory(prev => [...prev, currentState]);

    console.log('Redo performed');
  }, [redoHistory, blocks]);

  // Component Definitions Management
  const [componentDefinitions, setComponentDefinitions] = useState({});

  // Load component definitions from API
  const loadComponentDefinitions = useCallback(async () => {
    try {
      console.log('🧩 Loading component definitions...');
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
        console.log(`✅ Loaded ${Object.keys(definitions).length} component definitions`);
      } else {
        console.warn('⚠️ Could not load component definitions');
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

  // Draft Changes für localStorage-Persistierung
  const [draftChanges, setDraftChanges] = useState([]);

  // Mode Management (Edit/Preview)
  const [mode, setMode] = useState('edit');

  // Auto-Save Debouncing
  const autoSaveTimeoutRef = useRef(null);
  const AUTOSAVE_DELAY = 3000; // 3 Sekunden

  // Lade Draft-Änderungen beim Start
  useEffect(() => {
    const savedDrafts = loadDraftChanges();
    if (savedDrafts.length > 0) {
      setDraftChanges(savedDrafts);
      setSaveStatus('dirty');
      console.log(`📂 Loaded ${savedDrafts.length} draft changes from localStorage`);
    }

    // Bereinige alte Drafts
    cleanupOldDrafts();
  }, []);

  // Speichere Draft-Änderungen bei Änderungen
  useEffect(() => {
    if (draftChanges.length > 0) {
      saveDraftChanges(draftChanges);
    }
  }, [draftChanges]);

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-Save wenn Änderungen vorhanden - DEAKTIVIERT für jetzt um Loops zu vermeiden
  // useEffect(() => {
  //   const hasChanges = pendingOperations.size > 0 || pendingLayoutChanges !== null;

  //   if (hasChanges && saveStatus === 'dirty') {
  //     if (autoSaveTimeoutRef.current) {
  //       clearTimeout(autoSaveTimeoutRef.current);
  //     }

  //     autoSaveTimeoutRef.current = setTimeout(() => {
  //       console.log('🔄 Auto-saving pending changes...');
  //       // Verwende eine separate Funktion um forward reference zu vermeiden
  //       publishDrafts();
  //     }, AUTOSAVE_DELAY);
  //   }

  //   return () => {
  //     if (autoSaveTimeoutRef.current) {
  //       clearTimeout(autoSaveTimeoutRef.current);
  //     }
  //   };
  // }, [pendingOperations.size, pendingLayoutChanges, saveStatus]); // Entferne publishDrafts dependency  // Load pages from API
  const loadPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cms/pages');
      if (response.ok) {
        const data = await response.json();
        setPages(data);
        console.log('✅ Pages loaded:', data.length);

        // Automatisch Home-Seite auswählen wenn keine Seite ausgewählt ist - nur bei Initialisierung
        if (!currentPage && data.length > 0) {
          const homePage = data.find(page =>
            page.slug === 'home' ||
            page.slug === 'index' ||
            page.title?.toLowerCase() === 'home'
          ) || data[0];

          console.log('🏠 Auto-selecting home page:', homePage.title);
          setCurrentPage(homePage);

          // Lade Blöcke direkt ohne selectPage zu verwenden
          if (homePage && homePage.id) {
            console.log(`📦 Loading blocks for page: ${homePage.title} (ID: ${homePage.id})`);
            const blocksResponse = await fetch(`/api/cms/pages/${homePage.id}/blocks`);
            if (blocksResponse.ok) {
              const blocksData = await blocksResponse.json();
              const validBlocks = blocksData.map(block => ({
                ...block,
                grid_col: typeof block.grid_col === 'number' && !isNaN(block.grid_col) ? block.grid_col : 0,
                grid_row: typeof block.grid_row === 'number' && !isNaN(block.grid_row) ? block.grid_row : 0,
                grid_width: typeof block.grid_width === 'number' && !isNaN(block.grid_width) ? block.grid_width : 2,
                grid_height: typeof block.grid_height === 'number' && !isNaN(block.grid_height) ? block.grid_height : 1,
                background_color: block.background_color || 'transparent',
                text_color: block.text_color || '#000000',
                z_index: typeof block.z_index === 'number' ? block.z_index : 1
              }));
              // setBlocks(validBlocks);
              console.log(`✅ Loaded ${validBlocks.length} blocks for page ${homePage.id}`);
            }
          }
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
  }, []); // Keine Dependencies - wird nur einmal beim Mount aufgerufen

  // Load layout settings from API
  const loadLayoutSettings = useCallback(async () => {
    try {
      console.log('🎨 Loading layout settings...');

      // Versuche zuerst aus localStorage zu laden (ungespeicherte Änderungen)
      if (typeof window !== 'undefined') {
        const layoutKey = `layout_settings_${currentPage?.id || 'global'}`;
        const storedLayout = localStorage.getItem(layoutKey);
        if (storedLayout) {
          const parsedLayout = JSON.parse(storedLayout);
          setLayoutSettings(parsedLayout);
          setPendingLayoutChanges(parsedLayout);
          setSaveStatus('dirty');
          console.log('✅ Layout settings loaded from localStorage');
          return;
        }
      }

      // Fallback: Lade von API
      const response = await fetch('/api/cms/layout');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setLayoutSettings(data);
          console.log('✅ Layout settings loaded from API');
        }
      } else {
        console.warn('⚠️ Could not load layout settings, using defaults');
        // Setze Default-Werte wenn nichts geladen werden kann
        const defaultSettings = {
          header_component: 'default',
          footer_component: 'default',
          background_color: '#ffffff',
          background_image: null,
          primary_color: '#3b82f6',
          secondary_color: '#64748b'
        };
        setLayoutSettings(defaultSettings);
      }
    } catch (error) {
      console.error('❌ Error loading layout settings:', error);
      // Bei Fehler auch Default-Werte setzen
      const defaultSettings = {
        header_component: 'default',
        footer_component: 'default',
        background_color: '#ffffff',
        background_image: null,
        primary_color: '#3b82f6',
        secondary_color: '#64748b'
      };
      setLayoutSettings(defaultSettings);
    }
  }, []); // Entferne currentPage Abhängigkeit um Loops zu vermeiden

  // Load blocks for a specific page
  const loadBlocks = useCallback(async (pageId) => {
    if (!pageId) {
      console.log('📦 No page ID provided, skipping block loading');
      return;
    }

    console.log(`🔄 Loading blocks for page ID: ${pageId}`);
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

        // Speichere ursprüngliche Positionen für Vergleich
        const originalPositions = new Map();
        validBlocks.forEach(block => {
          originalPositions.set(block.id, {
            grid_col: block.grid_col,
            grid_row: block.grid_row,
            grid_width: block.grid_width,
            grid_height: block.grid_height,
            background_color: block.background_color,
            text_color: block.text_color,
            z_index: block.z_index,
            content: block.content
          });
        });
        setOriginalBlockPositions(originalPositions);

        console.log(`✅ Loaded ${validBlocks.length} blocks for page ${pageId}`);
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

  // Select page and load its blocks
  const selectPage = useCallback((page) => {
    console.log(`🔄 Switching to page: ${page ? page.title : 'none'}`);

    // Warn if there are unsaved changes
    if (pendingOperations.size > 0) {
      console.warn(`⚠️ Switching pages with ${pendingOperations.size} unsaved changes. Consider saving first.`);
    }

    console.log('Clearing current blocks and pending operations', blocks);

    // Clear current state
    setBlocks([]);
    setPendingOperations(new Map());
    setSaveStatus('saved');
    setDraftChanges([]);
    setOriginalBlockPositions(new Map()); // Ursprüngliche Positionen zurücksetzen

    // Set new page
    console.log('Setting current page to:', page);
    setCurrentPage(page);

    // Load blocks for new page
    if (page && page.id) {
      console.log(`📦 Loading blocks for page: ${page.title} (ID: ${page.id})`);
      loadBlocks(page.id);
    } else {
      console.log('📦 No page selected, clearing blocks');
    }

    // Load layout settings for new page
    console.log(`🎨 Loading layout settings for page: ${page ? page.title : 'global'}`);
    loadLayoutSettings();
  }, [loadBlocks]); // Entferne loadLayoutSettings aus Dependencies um Loops zu vermeiden

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

  // Block erstellen mit verbesserter Collision Detection und Default-Options
  const createBlock = useCallback((blockData) => {
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

    console.log(`🧩 Creating block "${blockType}" with default options:`, defaultOptions);

    const blockId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log("Creating block with data:", { blockType, normalizedData, componentDef });

    // Finde freie Position mit Collision Detection
    const findFreePosition = (preferredCol = 0, preferredRow = 0) => {
      // Unterstützt sowohl grid_width/grid_height als auch width/height für Flexibilität
      const blockWidth = typeof normalizedData.grid_width === 'number' ? normalizedData.grid_width :
                        typeof normalizedData.width === 'number' ? normalizedData.width :
                        componentDef?.width || 2;
      const blockHeight = typeof normalizedData.grid_height === 'number' ? normalizedData.grid_height :
                         typeof normalizedData.height === 'number' ? normalizedData.height :
                         componentDef?.height || 1;

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

      // Fallback: neue Zeile am Ende
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
      // Fallback für Text-Blöcke
      contentObject = { text: blockType === 'Text' ? 'Neuer Text' : '' };
    }

    console.log(`🧩 Creating block "${blockType}" with content object:`, contentObject);

    const newBlock = {
      id: blockId,
      page_id: currentPage?.id,
      block_type: blockType,
      content: JSON.stringify(contentObject), // Immer als JSON String speichern
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

      console.log(`✅ Created block: ${newBlock.block_type} at (${newBlock.grid_col}, ${newBlock.grid_row}) with content:`, contentObject);

      // Aktualisiere ursprüngliche Positionen für den neuen Block
      setOriginalBlockPositions(prev => new Map(prev).set(blockId, {
        grid_col: freePosition.col,
        grid_row: freePosition.row,
        grid_width: newBlock.grid_width,
        grid_height: newBlock.grid_height,
        background_color: newBlock.background_color,
        text_color: newBlock.text_color,
        z_index: newBlock.z_index,
        content: newBlock.content
      }));

      return newBlock;
    } catch (error) {
      console.error('❌ Error creating block:', error);
      return null;
    }
  }, [currentPage, batchOperation, blocks, componentDefinitions, saveStateToHistory]);

  // Block aktualisieren
  const updateBlock = useCallback((blockId, updates) => {
    console.log(`🔄 Updating block ${blockId}:`, Object.keys(updates));

    const currentBlock = blocks.find(b => b.id === blockId);
    if (!currentBlock) {
      console.warn(`Block ${blockId} not found`);
      return;
    }

    // Hole ursprüngliche Position aus der Datenbank
    const originalPosition = originalBlockPositions.get(blockId);
    if (!originalPosition) {
      console.warn(`No original position found for block ${blockId}`);
      return;
    }

    // Prüfe ob alle Updates die ursprünglichen Werte wiederherstellen
    const isReturningToOriginal = Object.keys(updates).every(key => {
      if (key === 'updated_at') return true; // updated_at ignorieren
      return updates[key] === originalPosition[key];
    });

    // Wenn alle Änderungen zur ursprünglichen Position zurückführen
    if (isReturningToOriginal) {
      console.log(`↩️ Block ${blockId} moved back to original position, removing pending updates`);

      // Entferne aus pending operations
      setPendingOperations(prev => {
        const newOps = new Map(prev);
        newOps.delete(blockId);
        return newOps;
      });

      // Entferne aus draft changes
      setDraftChanges(prev => prev.filter(change => change.blockId !== blockId));

      // Setze Block auf ursprüngliche Position zurück
      setBlocks(prev => prev.map(block =>
        block.id === blockId
          ? { ...block, ...originalPosition, updated_at: new Date().toISOString() }
          : block
      ));

      // Aktualisiere selectedBlock falls es das gleiche ist
      setSelectedBlock(prev => {
        if (prev && prev.id === blockId) {
          return { ...prev, ...originalPosition, updated_at: new Date().toISOString() };
        }
        return prev;
      });

      // Prüfe ob noch Änderungen vorhanden sind
      const hasOtherChanges = Array.from(pendingOperations.keys()).some(id => id !== blockId) || pendingLayoutChanges !== null;
      if (!hasOtherChanges) {
        setSaveStatus('saved');
      }
      return;
    }

    // Normale Aktualisierung
    saveStateToHistory(); // Speichere Zustand für Undo

    // Sofort UI aktualisieren für responsive Feedback
    setBlocks(prev => prev.map(block =>
      block.id === blockId
        ? { ...block, ...updates, updated_at: new Date().toISOString() }
        : block
    ));

    // Aktualisiere selectedBlock falls es das gleiche ist
    setSelectedBlock(prev => {
      if (prev && prev.id === blockId) {
        return { ...prev, ...updates, updated_at: new Date().toISOString() };
      }
      return prev;
    });

    const updatedBlock = {
      ...currentBlock,
      ...updates,
      updated_at: new Date().toISOString()
    };
    batchOperation(blockId, 'update', updatedBlock);

    // Speichere Draft-Änderung in localStorage
    const draftChange = {
      id: Date.now(),
      type: 'update',
      blockId: blockId,
      data: updates,
      timestamp: Date.now()
    };

    setDraftChanges(prev => {
      const filtered = prev.filter(change => !(change.blockId === blockId && change.type === 'update'));
      const updated = [...filtered, draftChange];
      saveSingleBlockChange(draftChange);
      return updated;
    });
  }, [blocks, batchOperation, saveStateToHistory, originalBlockPositions, pendingOperations, pendingLayoutChanges]);

  const deleteBlock = useCallback((blockId) => {
    console.log(`🗑️ Deleting block ${blockId}`);

    saveStateToHistory(); // Speichere Zustand für Undo
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    batchOperation(blockId, 'delete', { id: blockId });

    // Entferne ursprüngliche Position
    setOriginalBlockPositions(prev => {
      const newMap = new Map(prev);
      newMap.delete(blockId);
      return newMap;
    });

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
    console.log('🎨 Updating layout settings:', Object.keys(newSettings));
    console.log('🎨 New settings:', newSettings);

    // Speichere aktuelle Layout-Einstellungen für Undo
    saveStateToHistory();

    // Aktualisiere lokalen State sofort für sofortiges Feedback
    setLayoutSettings(prev => {
      const updated = { ...prev, ...newSettings };
      console.log('🎨 Updated layoutSettings state:', updated);
      return updated;
    });

    // Markiere als pending für späteren Batch-Upload
    setPendingLayoutChanges(newSettings);
    setSaveStatus('dirty');

    // Speichere Layout-Änderung in localStorage
    const draftChange = {
      id: Date.now(),
      type: 'layout',
      data: newSettings,
      timestamp: Date.now()
    };

    setDraftChanges(prev => {
      const filtered = prev.filter(change => change.type !== 'layout');
      const updated = [...filtered, draftChange];
      saveSingleBlockChange(draftChange);
      return updated;
    });

    // Speichere Layout-Änderungen sofort im localStorage
    if (typeof window !== 'undefined') {
      const layoutKey = `layout_settings_${currentPage?.id || 'global'}`;
      localStorage.setItem(layoutKey, JSON.stringify(newSettings));
      console.log('🎨 Saved to localStorage:', layoutKey, newSettings);
    }
  }, [currentPage, saveStateToHistory]);

  // Alle Draft-Änderungen veröffentlichen mit verbessertem Batch-API
  const publishDrafts = useCallback(async () => {
    const hasBlockChanges = pendingOperations.size > 0;
    const hasLayoutChanges = pendingLayoutChanges !== null;

    if (!hasBlockChanges && !hasLayoutChanges) {
      console.log('📄 No changes to publish');
      return;
    }

    try {
      setSaveStatus('saving');
      console.log(`🚀 Publishing changes... Blocks: ${pendingOperations.size}, Layout: ${hasLayoutChanges ? 'Yes' : 'No'}`);

      const promises = [];

      // 1. Veröffentliche Block-Änderungen (falls vorhanden)
      if (hasBlockChanges && currentPage) {
        console.log(`📦 Publishing ${pendingOperations.size} block operations...`);

        const operations = Array.from(pendingOperations.values());
        const blockPromise = fetch(`/api/cms/pages/${currentPage.id}/blocks/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operations: operations, rows: currentPage.rows || 12})
        });
        promises.push({ type: 'blocks', promise: blockPromise });
      }

      // 2. Veröffentliche Layout-Änderungen (falls vorhanden)
      if (hasLayoutChanges) {
        console.log('🎨 Publishing layout changes...');

        const layoutPromise = fetch('/api/cms/layout', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingLayoutChanges)
        });
        promises.push({ type: 'layout', promise: layoutPromise });
      }

      // 3. Warte auf alle Promises
      const results = await Promise.allSettled(promises.map(p => p.promise));

      // 4. Verarbeite Ergebnisse
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
            console.log(`✅ Block operations completed:`, data);

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
                z_index: typeof block.z_index === 'number' ? block.z_index : 1
              }));

              // Erstelle ID-Mapping für neue Blöcke (temp_id -> real_id)
              const idMapping = new Map();
              if (data.results) {
                data.results.forEach(result => {
                  if (result.operation === 'create' && result.tempId && result.block) {
                    idMapping.set(result.tempId, result.block.id);
                    console.log(`🔄 ID Mapping: ${result.tempId} -> ${result.block.id}`);
                  }
                });
              }

              // Aktualisiere selectedBlock falls es eine temp_id hatte
              if (selectedBlock && selectedBlock.id && idMapping.has(selectedBlock.id)) {
                const newRealId = idMapping.get(selectedBlock.id);
                const updatedSelectedBlock = normalizedBlocks.find(b => b.id === newRealId);
                if (updatedSelectedBlock) {
                  setSelectedBlock(updatedSelectedBlock);
                  console.log(`🔄 Updated selectedBlock ID: ${selectedBlock.id} -> ${newRealId}`);
                }
              }

              setBlocks(normalizedBlocks);
              console.log(`✅ Updated UI with ${normalizedBlocks.length} blocks from server`);

              // Aktualisiere ursprüngliche Positionen nach erfolgreichem Publishing
              const updatedOriginalPositions = new Map();
              normalizedBlocks.forEach(block => {
                updatedOriginalPositions.set(block.id, {
                  grid_col: block.grid_col,
                  grid_row: block.grid_row,
                  grid_width: block.grid_width,
                  grid_height: block.grid_height,
                  background_color: block.background_color,
                  text_color: block.text_color,
                  z_index: block.z_index,
                  content: block.content
                });
              });
              setOriginalBlockPositions(updatedOriginalPositions);
            }
          } else if (promiseInfo.type === 'layout') {
            console.log(`✅ Layout settings updated:`, data);

            // Aktualisiere Layout-UI mit Server-Daten
            if (data) {
              setLayoutSettings(data);
            }
          }
        } else {
          throw new Error(`${promiseInfo.type} operation failed: ${result.reason}`);
        }
      }

      // 5. Bereinige Pending-States
      if (hasBlockChanges) {
        setPendingOperations(new Map());
      }
      if (hasLayoutChanges) {
        setPendingLayoutChanges(null);
      }

      setSaveStatus('saved');
      setLastSaveTime(new Date());

      // 6. Lösche Draft-Änderungen nach erfolgreichem Publishing
      setDraftChanges([]);
      clearDraftChanges();

      // Lösche gespeicherte Layout-Änderungen aus localStorage
      if (typeof window !== 'undefined' && hasLayoutChanges) {
        const layoutKey = `layout_settings_${currentPage?.id || 'global'}`;
        localStorage.removeItem(layoutKey);
      }

      console.log(`✅ Successfully published all changes`);

    } catch (error) {
      console.error('❌ Error publishing drafts:', error);
      setSaveStatus('error');
      throw error;
    }
  }, [currentPage, pendingOperations, pendingLayoutChanges]);

  // Draft-Änderungen verwerfen
  const discardDrafts = useCallback(() => {
    console.log('🗑️ Discarding all draft changes');

    // Lade Blöcke neu wenn Seite ausgewählt
    if (currentPage && currentPage.id) {
      loadBlocks(currentPage.id);
    }

    // Lade Layout-Einstellungen neu (löscht ungespeicherte Änderungen)
    loadLayoutSettings();

    // Bereinige alle Pending-Änderungen
    setPendingOperations(new Map());
    setPendingLayoutChanges(null);
    setSaveStatus('saved');

    // Lösche Layout-Änderungen aus localStorage
    if (typeof window !== 'undefined') {
      const layoutKey = `layout_settings_${currentPage?.id || 'global'}`;
      localStorage.removeItem(layoutKey);
    }

    // Lösche Draft-Änderungen aus localStorage
    setDraftChanges([]);
    clearDraftChanges();
  }, [currentPage, loadBlocks]); // Entferne loadLayoutSettings aus Dependencies

  // Manuelles Speichern
  const saveNow = useCallback(async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    await publishDrafts();
  }, [publishDrafts]);

  // Initialisierung
  useEffect(() => {
    console.log('🚀 Initializing CMS - ONE TIME ONLY...');
    loadPages();
    loadLayoutSettings();
    loadComponentDefinitions();
  }, []); // Nur einmal beim Mount ausführen

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
        default:
          break;
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Synchronisiere States mit localStorage bei Änderungen
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('blocks', JSON.stringify(blocks));
    }
  }, [blocks]);

  const value = {
    pages,
    currentPage,
    blocks,
    isLoading,
    saveStatus,
    lastSaveTime,
    // Verbesserte Berechnung der ausstehenden Änderungen (vermeidet Doppelzählung)
    pendingOperationsCount: (() => {
      const blockChanges = new Set(pendingOperations.keys());
      const layoutChanges = pendingLayoutChanges ? 1 : 0;
      const otherDraftChanges = draftChanges.filter(change =>
        change.type !== 'update' || !blockChanges.has(change.blockId)
      ).length;
      return blockChanges.size + layoutChanges + otherDraftChanges;
    })(),

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
    layoutSettings,
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
        console.log(`📝 Creating new page: ${title} (${slug})`);

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
        console.log('✅ Page created:', newPage);

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
        console.log(`📝 Updating page ${pageId}: ${title} (${slug})`);

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
        console.log('✅ Page updated:', updatedPage);

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
        console.log(`🗑️ Deleting page ${pageId}`);

        const response = await fetch(`/api/cms/pages/${pageId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        console.log('✅ Page deleted');

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
  };

  return (
    <CMSContext.Provider value={value}>
      {children}
    </CMSContext.Provider>
  );
};
