'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  saveDraftChanges,
  loadDraftChanges,
  clearDraftChanges,
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
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('currentPage');
        const parsed = JSON.parse(stored);
        return parsed && typeof parsed === 'object' ? parsed : null;
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
    const [undoHistory, setUndoHistory] = useState(() => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('undoHistory');
          const parsed = JSON.parse(stored);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    });
  const [redoHistory, setRedoHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('redoHistory');
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  });
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

  const [deviceSize, setDeviceSize] = useState('desktop'); // 'mobile', 'tablet', 'desktop'

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

    // Setze den Zustand vorwärts
    setBlocks(nextState.blocks);
    setSelectedBlock(null); // Deselektiere Block bei Redo

    // Entferne den letzten Zustand aus Redo-Historie
    setRedoHistory(prev => prev.slice(0, -1));

    // Füge den aktuellen Zustand zur Undo-Historie hinzu
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

  // Draft Changes für localStorage-Persistierung
  const [draftChanges, setDraftChanges] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('draftChanges');
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Mode Management (Edit/Preview)
  const [mode, setMode] = useState('edit');

  // Auto-Save Debouncing
  const autoSaveTimeoutRef = useRef(null);
  const AUTOSAVE_DELAY = 3000; // 3 Sekunden

  // Funktion zum Anwenden von Draft-Änderungen auf die aktuellen Blöcke
  const applyDraftChangesToBlocks = useCallback((drafts, currentBlocks) => {
    if (!drafts || drafts.length === 0) return currentBlocks;

    let updatedBlocks = [...currentBlocks];
    const pendingOps = new Map();

    // Sortiere Draft-Änderungen nach Timestamp
    const sortedDrafts = [...drafts].sort((a, b) => a.timestamp - b.timestamp);

    sortedDrafts.forEach(draft => {

      switch (draft.type) {
        case 'create':
          // Prüfe ob Block bereits existiert (könnte durch andere Drafts erstellt worden sein)
          if (!updatedBlocks.find(b => b.id === draft.blockId)) {
            // Verarbeite Content für create korrekt
            let blockData = { ...draft.data };
            if (blockData.content && typeof blockData.content === 'string') {
              try {
                blockData.content = JSON.parse(blockData.content);
              } catch {
                blockData.content = { text: blockData.content };
              }
            }

            updatedBlocks.push(blockData);
            pendingOps.set(draft.blockId, {
              operation: 'create',
              data: blockData,
              timestamp: draft.timestamp
            });
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

            // WICHTIG: Merge mit dem vollständigen aktuellen Block
            // Behalte ALLE Eigenschaften des aktuellen Blocks und überschreibe nur die geänderten
            const updatedBlock = {
              ...currentBlock, // Alle aktuellen Block-Eigenschaften beibehalten
              ...processedDraftData, // Nur die geänderten Eigenschaften überschreiben
              updated_at: new Date().toISOString()
            };

            updatedBlocks[blockIndex] = updatedBlock;

            // Für pending operations: Verwende den VOLLSTÄNDIGEN Block-State
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
                data: fullBlockData, // Verwende vollständige Block-Daten
                timestamp: Math.max(existing.timestamp, draft.timestamp)
              });
            } else if (!existing || existing.operation !== 'create') {
              pendingOps.set(draft.blockId, {
                operation: 'update',
                data: fullBlockData, // Verwende vollständige Block-Daten
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
          // Layout-Änderungen werden separat behandelt
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

  // Erweiterte Funktion zum Laden und Anwenden von Draft-Änderungen
  const loadAndApplyDrafts = useCallback(() => {
    const savedDrafts = loadDraftChanges();
    if (savedDrafts.length > 0) {

      // Wende Draft-Änderungen auf aktuelle Blöcke an
      setBlocks(prevBlocks => {
        const updatedBlocks = applyDraftChangesToBlocks(savedDrafts, prevBlocks);

        return updatedBlocks;
      });

      // Überschreibe draftChanges komplett mit den geladenen Drafts (keine Deduplication)
      // um sicherzustellen, dass alle Draft-Änderungen erhalten bleiben
      setDraftChanges(savedDrafts);

      setSaveStatus('dirty');
    }
  }, [loadDraftChanges, applyDraftChangesToBlocks]);

  // Lade Draft-Änderungen beim Start und synchronisiere mit localStorage
  useEffect(() => {
    const savedDrafts = loadDraftChanges();
    if (savedDrafts.length > 0) {

      // Überschreibe draftChanges komplett mit den geladenen Drafts
      // um sicherzustellen, dass alle Draft-Änderungen erhalten bleiben
      setDraftChanges(savedDrafts);

      setSaveStatus('dirty');
    }

    // Bereinige alte Drafts
    cleanupOldDrafts();
  }, []);

  // State um zu verfolgen, ob Draft-Änderungen bereits angewendet wurden
  const [draftsApplied, setDraftsApplied] = useState(false);

  // Zusätzlicher useEffect, der Draft-Änderungen anwendet, sobald Blöcke geladen sind
  useEffect(() => {
    if (blocks.length > 0 && !draftsApplied && draftChanges.length > 0) {

      // Kleiner Delay um sicherzustellen, dass Blöcke vollständig geladen sind
      const timer = setTimeout(() => {
        const updatedBlocks = applyDraftChangesToBlocks(draftChanges, blocks);

        setBlocks(updatedBlocks);
        setDraftsApplied(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [blocks.length, draftsApplied, draftChanges.length, applyDraftChangesToBlocks, blocks, draftChanges]);

  // Reset draftsApplied when page changes
  useEffect(() => {
    setDraftsApplied(false);
  }, [currentPage?.id]);

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

  const loadPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cms/pages');
      if (response.ok) {
        const data = await response.json();
        setPages(data);

        const savedCurrentPage = localStorage.getItem('currentPage');
        let savedPage = null;
        try {
          savedPage = savedCurrentPage ? JSON.parse(savedCurrentPage) : null;
        } catch {
          savedPage = null;
        }

        // Wenn eine Seite im localStorage gespeichert ist, versuche sie zu finden
        if (savedPage && savedPage.id) {
          const foundPage = data.find(page => page.id === savedPage.id);
          if (foundPage) {
            setCurrentPage(foundPage);

            // Verwende Blöcke aus localStorage anstatt von der DB zu laden
            // Die Blöcke sind bereits im useState Initializer aus localStorage geladen worden
            // Wende Draft-Änderungen an falls vorhanden
            setTimeout(() => {
              loadAndApplyDrafts();
            }, 100);

            return; // Verlasse die Funktion früh, da wir die gespeicherte Seite gefunden haben
          } else {
            localStorage.removeItem('currentPage');
          }
        }        // Automatisch Home-Seite auswählen wenn keine Seite ausgewählt ist und keine im localStorage gespeichert war
        if (!currentPage && data.length > 0) {
          const homePage = data.find(page =>
            page.slug === 'home' ||
            page.slug === 'index' ||
            page.title?.toLowerCase() === 'home'
          ) || data[0];

          setCurrentPage(homePage);

          // Prüfe ob bereits Blöcke im localStorage vorhanden sind
          if (blocks.length > 0) {
            // Wende Draft-Änderungen an
            setTimeout(() => {
              loadAndApplyDrafts();
            }, 100);
          } else {
            // Nur laden wenn keine Blöcke im localStorage vorhanden sind
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
              setBlocks(validBlocks);
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

  // Load blocks for a specific page
  const loadBlocks = useCallback(async (pageId, forceFromDB = false) => {
    if (!pageId) {
      return;
    }

    // Wenn nicht explizit von DB geladen werden soll, prüfe localStorage zuerst
    if (!forceFromDB) {
      try {
        const storedBlocks = localStorage.getItem('blocks');
        const parsedBlocks = storedBlocks ? JSON.parse(storedBlocks) : [];
        const pageBlocks = parsedBlocks.filter(block =>
          block.page_id === pageId ||
          block.page_id === String(pageId) ||
          String(block.page_id) === String(pageId)
        );

        if (pageBlocks.length > 0) {
          setBlocks(pageBlocks);
          setPendingOperations(new Map());
          setSaveStatus('saved');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.warn('⚠️ Error reading localStorage, falling back to database:', error);
      }
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

        // Aktualisiere localStorage mit den neuen Daten von der DB
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('blocks', JSON.stringify(validBlocks));
          } catch (error) {
            console.warn('⚠️ Could not update localStorage with loaded blocks:', error);
          }
        }
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
  }, [loadDraftChanges, applyDraftChangesToBlocks]);

  // Select page and load its blocks
  const selectPage = useCallback((page) => {

    // Warn if there are unsaved changes
    if (pendingOperations.size > 0) {
      console.warn(`⚠️ Switching pages with ${pendingOperations.size} unsaved changes. Consider saving first.`);
    }

    // Clear current state
    setBlocks([]);
    setPendingOperations(new Map());
    setSaveStatus('saved');
    // NICHT die draftChanges leeren - sie werden beim Laden neu gesetzt
    // setDraftChanges([]); // Entfernt um Draft-Änderungen zu bewahren

    // Set new page
    setCurrentPage(page);

    // Load blocks for new page
    if (page && page.id) {

      // Prüfe ob bereits Blöcke für diese Seite im localStorage sind
      try {
        const storedBlocks = localStorage.getItem('blocks');
        const parsedBlocks = storedBlocks ? JSON.parse(storedBlocks) : [];

        // Filtere Blöcke für die aktuelle Seite (sowohl string als auch number IDs berücksichtigen)
        const pageBlocks = parsedBlocks.filter(block =>
          block.page_id === page.id ||
          block.page_id === String(page.id) ||
          String(block.page_id) === String(page.id)
        );

        if (pageBlocks.length > 0) {

          // Setze zuerst die Blöcke ohne Draft-Änderungen
          setBlocks(pageBlocks);

          // Lade Draft-Änderungen
          const savedDrafts = loadDraftChanges();
          setDraftChanges(savedDrafts);

          // Markiere, dass Draft-Änderungen noch angewendet werden müssen
          setDraftsApplied(false);

          setSaveStatus(savedDrafts.length > 0 ? 'dirty' : 'saved');
        } else {
          loadBlocks(page.id);
        }
      } catch (error) {
        console.warn('⚠️ Error reading blocks from localStorage, loading from database:', error);
        loadBlocks(page.id);
      }
    }
  }, [loadBlocks]); // Entferne pendingOperations.size aus Abhängigkeiten

  // Intelligente Operation mit Batching
  const batchOperation = useCallback((blockId, operation, data) => {

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

    const blockId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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


    // Sofort UI aktualisieren für responsive Feedback
    saveStateToHistory(); // Speichere Zustand für Undo
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

    const currentBlock = blocks.find(b => b.id === blockId);
    if (currentBlock) {
      // Stelle sicher, dass Content-Updates korrekt verarbeitet werden
      let processedUpdates = { ...updates };

      // Wenn content als Objekt übergeben wird, lass es als Objekt im lokalen State
      // (Konvertierung zu JSON-String erfolgt nur beim Speichern zur API)
      if (processedUpdates.content && typeof processedUpdates.content === 'string') {
        try {
          processedUpdates.content = JSON.parse(processedUpdates.content);
        } catch {
          // Falls JSON-Parsing fehlschlägt, verwende als Plain-Text
          processedUpdates.content = { text: processedUpdates.content };
        }
      }

      const updatedBlock = {
        ...currentBlock,
        ...processedUpdates,
        updated_at: new Date().toISOString()
      };

      // Wichtig: Wenn Block eine temp_id hat, behandle als CREATE, nicht UPDATE
      const operationType = blockId.toString().startsWith('temp_') ? 'create' : 'update';
      batchOperation(blockId, operationType, updatedBlock);

      // Speichere Draft-Änderung in localStorage
      const draftChange = {
        id: Date.now(),
        type: operationType, // Verwende den korrekten Typ
        blockId: blockId,
        data: operationType === 'create' ? updatedBlock : processedUpdates, // Vollständige Daten für CREATE
        timestamp: Date.now()
      };

      setDraftChanges(prev => {
        // Behalte ALLE Draft-Änderungen, auch mehrere Updates für den gleichen Block
        const updated = [...prev, draftChange];
        saveSingleBlockChange(draftChange);
        return updated;
      });

      console.log(`🔄 Updated block ${blockId} (${operationType}):`, Object.keys(updates));
    }
  }, [blocks, batchOperation, saveStateToHistory]);

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

    // Check if settings actually changed to prevent unnecessary updates
    const hasChanges = Object.keys(newSettings).some(key =>
      layoutSettings[key] !== newSettings[key]
    );

    if (!hasChanges) {
      return;
    }

    // Aktualisiere lokalen State sofort für sofortiges Feedback
    setLayoutSettings(prev => {
      const updated = { ...prev, ...newSettings };

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
        const filtered = prev.filter(change => change.type !== 'layout');
        const updatedDrafts = [...filtered, draftChange];
        saveSingleBlockChange(draftChange);
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

    // Lade auch Draft-Änderungen aus localStorage
    let localStorageDrafts = [];
    try {
      const storedDrafts = loadDraftChanges();
      localStorageDrafts = storedDrafts || [];
    } catch (error) {
      console.warn('⚠️ Error loading draft changes from localStorage:', error);
    }

    // Kombiniere alle Draft-Änderungen
    const allDraftChanges = [...draftChanges, ...localStorageDrafts.filter(draft =>
      !draftChanges.some(existing => existing.id === draft.id)
    )];

    if (!hasBlockChanges && !hasLayoutChanges && allDraftChanges.length === 0) {
      return;
    }

    // WICHTIG: Lade die neuesten Blöcke aus der Datenbank vor dem Veröffentlichen
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
              // Layout-Änderungen werden separat behandelt
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

      // Sammle ALLE aktuellen Blöcke (sowohl existierende als auch neue mit temp IDs)
      const allCurrentBlocks = [...blocks];

      // Füge auch Blöcke aus localStorage hinzu, die noch nicht im State sind
      try {
        const storedBlocks = localStorage.getItem('blocks');
        if (storedBlocks) {
          const localStorageBlocks = JSON.parse(storedBlocks);
          localStorageBlocks.forEach(localBlock => {
            if (!allCurrentBlocks.find(b => b.id === localBlock.id)) {
              allCurrentBlocks.push(localBlock);
            }
          });
        }
      } catch (error) {
        console.warn('⚠️ Could not load additional blocks from localStorage:', error);
      }

      // Verarbeite alle aktuellen Blöcke
      allCurrentBlocks.forEach(block => {
        if (block.id && block.id.toString().startsWith('temp_')) {
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

          allBlockOperations.set(block.id, {
            operation: 'create',
            data: operationData,
            timestamp: new Date(block.created_at || Date.now()).getTime()
          });
        }
      });

      // Zuerst sammle existierende pendingOperations
      pendingOperations.forEach((operation, blockId) => {
        let operationData = operation.data;

        // Stelle sicher, dass content als JSON-String übertragen wird für existierende Operations
        if (operationData && operationData.content && typeof operationData.content === 'object') {
          operationData = {
            ...operationData,
            content: JSON.stringify(operationData.content)
          };
        }

        // WICHTIG: Wenn blockId eine temp-ID ist, behandle IMMER als CREATE
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

          // Erstelle eine Map der aktuellen Blöcke für schnellen Zugriff
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

              // Stelle sicher, dass content als JSON-String übertragen wird
              if (operationData && operationData.content && typeof operationData.content === 'object') {
                operationData = {
                  ...operationData,
                  content: JSON.stringify(operationData.content)
                };
              }

              // Überschreibe nur wenn noch keine Operation für diesen Block existiert
              if (!allBlockOperations.has(draft.blockId)) {
                // WICHTIG: Wenn blockId eine temp-ID ist, behandle IMMER als CREATE
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
        console.log(`📤 Sending ${operations.length} block operations to server:`, operations.map(op => ({
          operation: op.operation,
          blockId: op.data?.id,
          blockType: op.data?.block_type,
          isTemp: op.data?.id?.toString().startsWith('temp_')
        })));

        const blockPromise = fetch(`/api/cms/pages/${currentPage.id}/blocks/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operations: operations, rows: currentPage.rows || 12})
        });
        promises.push({ type: 'blocks', promise: blockPromise });
      }

      // 4. Sammle Layout-Änderungen aus drafts
      let finalLayoutChanges = pendingLayoutChanges;
      allDraftChanges.forEach(draft => {
        if (draft.type === 'layout') {
          finalLayoutChanges = finalLayoutChanges ?
            { ...finalLayoutChanges, ...draft.data } :
            draft.data;
        }
      });

      // 5. Veröffentliche Layout-Änderungen (falls vorhanden)
      if (finalLayoutChanges) {

        const layoutPromise = fetch('/api/cms/layout', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalLayoutChanges)
        });
        promises.push({ type: 'layout', promise: layoutPromise });
      }

      // 6. Warte auf alle Promises
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
                // Stelle sicher, dass content korrekt als Objekt verarbeitet wird
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

              // Erstelle ID-Mapping für neue Blöcke (temp_id -> real_id)
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

              // Setze die finalen Blöcke direkt vom Server
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

            // Aktualisiere Layout-UI mit Server-Daten
            if (data) {
              setLayoutSettings(data);
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

      // Verifizierung: Prüfe ob alle erwarteten Blöcke nach dem Speichern noch vorhanden sind
      if (currentPage?.id) {
        setTimeout(async () => {
          try {
            const response = await fetch(`/api/cms/pages/${currentPage.id}/blocks`);
            if (response.ok) {
              const dbBlocks = await response.json();
              console.log(`✅ Verification: Found ${dbBlocks.length} blocks in database after publishing`);

              if (dbBlocks.length === 0 && blocks.length > 0) {
                console.error('❌ CRITICAL: All blocks disappeared after publishing!');
                // Wiederherstelle aus Backup falls vorhanden
                try {
                  const backup = localStorage.getItem('blocks_backup');
                  if (backup) {
                    console.warn('⚠️ Kritischer Fehler: Alle Blöcke sind verschwunden! Versuche Wiederherstellung aus Backup...');
                    const backupData = JSON.parse(backup);
                    if (backupData.blocks && Array.isArray(backupData.blocks)) {
                      setBlocks(backupData.blocks);
                    }
                  } else {
                    console.error('❌ Kritischer Fehler: Alle Blöcke sind verschwunden und kein Backup verfügbar!');
                  }
                } catch (backupError) {
                  console.error('❌ Could not restore from backup:', backupError);
                  console.error('❌ Kritischer Fehler: Alle Blöcke sind verschwunden und Backup-Wiederherstellung fehlgeschlagen!');
                }
              } else if (dbBlocks.length > 0) {
                console.log('✅ All blocks successfully saved to database');
              }
            }
          } catch (error) {
            console.warn('⚠️ Could not verify blocks after publishing:', error);
          }
        }, 1000);
      }

      // 9. Lösche ALLE Draft-Änderungen (State + localStorage) und synchronisiere mit DB
      setDraftChanges([]);
      clearDraftChanges(); // Lösche localStorage

    } catch (error) {
      console.error('❌ Error publishing drafts:', error);
      setSaveStatus('error');
      throw error;
    }
  }, [currentPage, pendingOperations, pendingLayoutChanges, draftChanges, loadDraftChanges, blocks]);

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

    // Lade auch Draft-Änderungen aus localStorage für vollständige Bereinigung
    let localStorageDrafts = [];
    try {
      localStorageDrafts = loadDraftChanges() || [];
    } catch (error) {
      console.warn('⚠️ Error loading localStorage drafts for discard:', error);
    }

    // Sichere aktuelle Blöcke bevor sie überschrieben werden
    if (typeof window !== 'undefined' && blocks.length > 0) {
      try {
        localStorage.setItem('blocks_backup', JSON.stringify({
          blocks: blocks,
          timestamp: new Date().toISOString(),
          reason: 'discard_drafts'
        }));
      } catch (error) {
        console.warn('⚠️ Could not create blocks backup:', error);
      }
    }

    // Lade Blöcke neu wenn Seite ausgewählt - explizit von DB laden
    if (currentPage && currentPage.id) {
      loadBlocks(currentPage.id, true); // forceFromDB = true
    }

    // Lade Layout-Einstellungen neu
    loadLayoutSettings();

    // Bereinige alle Pending-Änderungen
    setPendingOperations(new Map());
    setPendingLayoutChanges(null);
    setSaveStatus('saved');

    // Lösche ALLE Draft-Änderungen (State + localStorage)
    setDraftChanges([]);
    clearDraftChanges();

  }, [currentPage, loadBlocks, loadLayoutSettings, draftChanges, loadDraftChanges, blocks]);

  // Backup and recovery functions
  const hasBackup = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const backup = localStorage.getItem('blocks_backup');
        return backup !== null;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  const restoreFromBackup = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const backup = localStorage.getItem('blocks_backup');
        if (backup) {
          const backupData = JSON.parse(backup);
          if (backupData.blocks && Array.isArray(backupData.blocks)) {
            setBlocks(backupData.blocks);
            alert(`✅ Blöcke aus Backup wiederhergestellt (${backupData.timestamp})`);
            return true;
          }
        }
        alert('❌ Kein Backup gefunden');
        return false;
      } catch (error) {
        console.error('❌ Error restoring from backup:', error);
        alert('❌ Fehler beim Wiederherstellen des Backups');
        return false;
      }
    }
    return false;
  }, []);

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

    // Prüfe auch localStorage für zusätzliche Draft-Änderungen
    try {
      const localStorageDrafts = loadDraftChanges() || [];
      const uniqueLocalStorageDrafts = localStorageDrafts.filter(draft =>
        !draftChanges.some(existing => existing.id === draft.id)
      );
      totalDraftChanges += uniqueLocalStorageDrafts.length;
    } catch (error) {
      console.warn('⚠️ Error counting localStorage drafts:', error);
    }

    return totalPendingOperations + totalLayoutChanges + totalDraftChanges;
  }, [pendingOperations.size, pendingLayoutChanges, draftChanges.length, loadDraftChanges]);

  // Warnung vor Seitenverlassen mit ungespeicherten Änderungen
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (getTotalPendingChanges() > 0) {
        e.preventDefault();
        e.returnValue = 'Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [getTotalPendingChanges]);

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

  const value = {
    pages,
    currentPage,
    blocks,
    isLoading,
    saveStatus,
    lastSaveTime,
    // Verbesserte Berechnung der ausstehenden Änderungen (inklusive localStorage)
    pendingOperationsCount: getTotalPendingChanges(),

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

    // Helper functions
    getTotalPendingChanges,

    // Backup and recovery functions
    restoreFromBackup,
    hasBackup,
  };

  return (
    <CMSContext.Provider value={value}>
      {children}
    </CMSContext.Provider>
  );
};
