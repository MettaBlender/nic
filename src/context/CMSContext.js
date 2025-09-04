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

    console.log(`🔧 Applying ${drafts.length} draft changes to ${currentBlocks.length} blocks`);

    let updatedBlocks = [...currentBlocks];
    const pendingOps = new Map();

    // Sortiere Draft-Änderungen nach Timestamp
    const sortedDrafts = [...drafts].sort((a, b) => a.timestamp - b.timestamp);

    sortedDrafts.forEach(draft => {
      console.log(`🔧 Applying draft change: ${draft.type} for block ${draft.blockId}`);

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
            console.log(`✅ Applied create for block ${draft.blockId}`);
          } else {
            console.log(`⚠️ Block ${draft.blockId} already exists, skipping create`);
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

            console.log(`✅ Applied update for block ${draft.blockId} with full block data:`, {
              position: `${updatedBlock.grid_col},${updatedBlock.grid_row}`,
              size: `${updatedBlock.grid_width}x${updatedBlock.grid_height}`,
              colors: `bg:${updatedBlock.background_color}, text:${updatedBlock.text_color}`,
              z_index: updatedBlock.z_index
            });
          } else {
            console.log(`⚠️ Block ${draft.blockId} not found for update`);
          }
          break;

        case 'delete':
          updatedBlocks = updatedBlocks.filter(b => b.id !== draft.blockId);
          pendingOps.set(draft.blockId, {
            operation: 'delete',
            data: { id: draft.blockId },
            timestamp: draft.timestamp
          });
          console.log(`✅ Applied delete for block ${draft.blockId}`);
          break;

        case 'layout':
          // Layout-Änderungen werden separat behandelt
          console.log(`🎨 Found layout change in drafts`);
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
      console.log(`📝 Set ${pendingOps.size} pending operations from drafts`);
    }

    return updatedBlocks;
  }, []);

  // Erweiterte Funktion zum Laden und Anwenden von Draft-Änderungen
  const loadAndApplyDrafts = useCallback(() => {
    const savedDrafts = loadDraftChanges();
    if (savedDrafts.length > 0) {
      console.log(`📂 Loading and applying ${savedDrafts.length} draft changes from localStorage`);

      // Wende Draft-Änderungen auf aktuelle Blöcke an
      setBlocks(prevBlocks => {
        const updatedBlocks = applyDraftChangesToBlocks(savedDrafts, prevBlocks);
        console.log(`🔧 Applied drafts to ${updatedBlocks.length} blocks`);

        // Debug: Zeige die finalen Block-Positionen nach dem Anwenden der Drafts
        updatedBlocks.forEach(block => {
          console.log(`🔧 Final block ${block.id} position: ${block.grid_col},${block.grid_row} size: ${block.grid_width}x${block.grid_height}`);
        });

        return updatedBlocks;
      });

      // Überschreibe draftChanges komplett mit den geladenen Drafts (keine Deduplication)
      // um sicherzustellen, dass alle Draft-Änderungen erhalten bleiben
      setDraftChanges(savedDrafts);

      setSaveStatus('dirty');
      console.log(`📂 Loaded and applied ${savedDrafts.length} draft changes from localStorage`);
    } else {
      console.log(`📂 No draft changes found in localStorage`);
    }
  }, [loadDraftChanges, applyDraftChangesToBlocks]);

  // Lade Draft-Änderungen beim Start und synchronisiere mit localStorage
  useEffect(() => {
    const savedDrafts = loadDraftChanges();
    if (savedDrafts.length > 0) {
      console.log(`📂 Loading ${savedDrafts.length} draft changes from localStorage`);

      // Überschreibe draftChanges komplett mit den geladenen Drafts
      // um sicherzustellen, dass alle Draft-Änderungen erhalten bleiben
      setDraftChanges(savedDrafts);

      setSaveStatus('dirty');
      console.log(`📂 Loaded ${savedDrafts.length} draft changes from localStorage`);
    }

    // Bereinige alte Drafts
    cleanupOldDrafts();
  }, []);

  // State um zu verfolgen, ob Draft-Änderungen bereits angewendet wurden
  const [draftsApplied, setDraftsApplied] = useState(false);

  // Zusätzlicher useEffect, der Draft-Änderungen anwendet, sobald Blöcke geladen sind
  useEffect(() => {
    if (blocks.length > 0 && !draftsApplied && draftChanges.length > 0) {
      console.log(`🔄 Applying ${draftChanges.length} draft changes to ${blocks.length} blocks...`);
      console.log(`🔄 DEBUG: Current block positions before applying drafts:`, blocks.map(b => ({
        id: b.id,
        position: `${b.grid_col},${b.grid_row}`,
        size: `${b.grid_width}x${b.grid_height}`
      })));

      // Kleiner Delay um sicherzustellen, dass Blöcke vollständig geladen sind
      const timer = setTimeout(() => {
        const updatedBlocks = applyDraftChangesToBlocks(draftChanges, blocks);

        console.log(`🔄 DEBUG: Block positions after applying drafts:`, updatedBlocks.map(b => ({
          id: b.id,
          position: `${b.grid_col},${b.grid_row}`,
          size: `${b.grid_width}x${b.grid_height}`
        })));

        setBlocks(updatedBlocks);
        setDraftsApplied(true);

        console.log(`✅ Applied ${draftChanges.length} draft changes to blocks`);
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
        console.log('✅ Pages loaded:', data.length);

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
            console.log('🔄 Restoring saved page from localStorage:', foundPage.title);
            setCurrentPage(foundPage);

            // Verwende Blöcke aus localStorage anstatt von der DB zu laden
            console.log('📦 Using blocks from localStorage instead of fetching from database');
            // Die Blöcke sind bereits im useState Initializer aus localStorage geladen worden
            // Wende Draft-Änderungen an falls vorhanden
            setTimeout(() => {
              loadAndApplyDrafts();
            }, 100);

            return; // Verlasse die Funktion früh, da wir die gespeicherte Seite gefunden haben
          } else {
            console.warn('⚠️ Saved page not found in current pages, clearing localStorage');
            localStorage.removeItem('currentPage');
          }
        }        // Automatisch Home-Seite auswählen wenn keine Seite ausgewählt ist und keine im localStorage gespeichert war
        if (!currentPage && data.length > 0) {
          const homePage = data.find(page =>
            page.slug === 'home' ||
            page.slug === 'index' ||
            page.title?.toLowerCase() === 'home'
          ) || data[0];

          console.log('🏠 Auto-selecting home page:', homePage.title);
          setCurrentPage(homePage);

          // Prüfe ob bereits Blöcke im localStorage vorhanden sind
          if (blocks.length > 0) {
            console.log('📦 Using existing blocks from localStorage');
            // Wende Draft-Änderungen an
            setTimeout(() => {
              loadAndApplyDrafts();
            }, 100);
          } else {
            // Nur laden wenn keine Blöcke im localStorage vorhanden sind
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
              setBlocks(validBlocks);
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
      const response = await fetch('/api/cms/layout');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setLayoutSettings(data);
          console.log('✅ Layout settings loaded');
        }
      } else {
        console.warn('⚠️ Could not load layout settings, using defaults');
      }
    } catch (error) {
      console.error('❌ Error loading layout settings:', error);
    }
  }, []);

  // Load blocks for a specific page
  const loadBlocks = useCallback(async (pageId, forceFromDB = false) => {
    if (!pageId) {
      console.log('📦 No page ID provided, skipping block loading');
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
          console.log(`� Using ${pageBlocks.length} blocks from localStorage for page ${pageId}`);
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

    console.log(`�🔄 Loading blocks from database for page ID: ${pageId}`);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/blocks`);
      if (response.ok) {
        const data = await response.json();

        console.log(`📦 Fetched ${data.length} blocks from server for page ${pageId}`);

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
  }, [loadDraftChanges, applyDraftChangesToBlocks]);

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
    // NICHT die draftChanges leeren - sie werden beim Laden neu gesetzt
    // setDraftChanges([]); // Entfernt um Draft-Änderungen zu bewahren

    // Set new page
    console.log('Setting current page to:', page);
    setCurrentPage(page);

    // Load blocks for new page
    if (page && page.id) {
      console.log(`📦 Loading blocks for page: ${page.title} (ID: ${page.id})`);

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
          console.log(`📦 Using ${pageBlocks.length} blocks from localStorage for page ${page.id}`);
          console.log(`📦 DEBUG: Block positions from localStorage:`, pageBlocks.map(b => ({
            id: b.id,
            position: `${b.grid_col},${b.grid_row}`,
            size: `${b.grid_width}x${b.grid_height}`
          })));

          // Setze zuerst die Blöcke ohne Draft-Änderungen
          setBlocks(pageBlocks);

          // Lade Draft-Änderungen
          const savedDrafts = loadDraftChanges();
          setDraftChanges(savedDrafts);

          // Markiere, dass Draft-Änderungen noch angewendet werden müssen
          setDraftsApplied(false);

          setSaveStatus(savedDrafts.length > 0 ? 'dirty' : 'saved');

          console.log(`📦 Set ${pageBlocks.length} blocks from localStorage, ${savedDrafts.length} draft changes will be applied by useEffect`);
        } else {
          console.log(`📦 No blocks in localStorage for page ${page.id}, loading from database`);
          loadBlocks(page.id);
        }
      } catch (error) {
        console.warn('⚠️ Error reading blocks from localStorage, loading from database:', error);
        loadBlocks(page.id);
      }
    } else {
      console.log('📦 No page selected, clearing blocks');
    }
  }, [loadBlocks]); // Entferne pendingOperations.size aus Abhängigkeiten

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

      console.log(`✅ Created block: ${newBlock.block_type} at (${newBlock.grid_col}, ${newBlock.grid_row}) with content:`, contentObject);
      return newBlock;
    } catch (error) {
      console.error('❌ Error creating block:', error);
      return null;
    }
  }, [currentPage, batchOperation, blocks, componentDefinitions, saveStateToHistory]);

  // Block aktualisieren
  const updateBlock = useCallback((blockId, updates) => {
    console.log(`🔄 Updating block ${blockId}:`, Object.keys(updates));

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
      batchOperation(blockId, 'update', updatedBlock);

      // Speichere Draft-Änderung in localStorage
      const draftChange = {
        id: Date.now(),
        type: 'update',
        blockId: blockId,
        data: processedUpdates,
        timestamp: Date.now()
      };

      setDraftChanges(prev => {
        // Behalte ALLE Draft-Änderungen, auch mehrere Updates für den gleichen Block
        const updated = [...prev, draftChange];
        saveSingleBlockChange(draftChange);
        return updated;
      });
    }
  }, [blocks, batchOperation, saveStateToHistory]);

  const deleteBlock = useCallback((blockId) => {
    console.log(`🗑️ Deleting block ${blockId}`);

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
    console.log('🎨 Updating layout settings:', Object.keys(newSettings));

    // Check if settings actually changed to prevent unnecessary updates
    const hasChanges = Object.keys(newSettings).some(key =>
      layoutSettings[key] !== newSettings[key]
    );

    if (!hasChanges) {
      console.log('No layout changes detected, skipping update');
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
    console.log('🚀 Starting publishDrafts...');

    // Sammle alle Änderungen aus verschiedenen Quellen
    const hasBlockChanges = pendingOperations.size > 0;
    const hasLayoutChanges = pendingLayoutChanges !== null;
    const hasDraftChanges = draftChanges.length > 0;

    // Lade auch Draft-Änderungen aus localStorage
    let localStorageDrafts = [];
    try {
      const storedDrafts = loadDraftChanges();
      localStorageDrafts = storedDrafts || [];
      console.log(`📂 Loaded ${localStorageDrafts.length} draft changes from localStorage`);
    } catch (error) {
      console.warn('⚠️ Error loading draft changes from localStorage:', error);
    }

    // Kombiniere alle Draft-Änderungen
    const allDraftChanges = [...draftChanges, ...localStorageDrafts.filter(draft =>
      !draftChanges.some(existing => existing.id === draft.id)
    )];

    console.log(`📊 Changes summary:
    - Pending Operations: ${pendingOperations.size}
    - Layout Changes: ${hasLayoutChanges ? 'Yes' : 'No'}
    - Draft Changes (State): ${draftChanges.length}
    - Draft Changes (localStorage): ${localStorageDrafts.length}
    - Total Draft Changes: ${allDraftChanges.length}`);

    if (!hasBlockChanges && !hasLayoutChanges && allDraftChanges.length === 0) {
      console.log('📄 No changes to publish');
      return;
    }

    try {
      setSaveStatus('saving');
      console.log(`🚀 Publishing changes... Blocks: ${pendingOperations.size}, Layout: ${hasLayoutChanges ? 'Yes' : 'No'}, Drafts: ${allDraftChanges.length}`);

      const promises = [];

      // 1. Verarbeite Draft-Änderungen zu pendingOperations
      if (allDraftChanges.length > 0) {
        console.log('📝 Processing draft changes...');

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
            console.log(`📝 Adding draft operation for block ${blockId}: ${operation.operation}`);
            setPendingOperations(prev => new Map(prev).set(blockId, operation));
          }
        });
      }

      // 2. Sammle alle Block-Operations mit aktuellen Positionen aus dem State
      const allBlockOperations = new Map();

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

        allBlockOperations.set(blockId, {
          ...operation,
          data: operationData
        });
      });

      // Dann verarbeite Draft-Änderungen und verwende die AKTUELLEN Block-Positionen
      if (allDraftChanges.length > 0) {
        const updatedBlocksMap = new Map();

        // Erstelle eine Map der aktuellen Blöcke für schnellen Zugriff
        blocks.forEach(block => {
          updatedBlocksMap.set(block.id, block);
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
              allBlockOperations.set(draft.blockId, {
                operation: draft.type,
                data: operationData,
                timestamp: draft.timestamp
              });
              console.log(`📝 Added operation ${draft.type} for block ${draft.blockId} with current position`);
            }
          }
        });
      }

      // 3. Veröffentliche Block-Änderungen (falls vorhanden)
      if ((hasBlockChanges || allBlockOperations.size > 0) && currentPage) {
        console.log(`📦 Publishing ${allBlockOperations.size} block operations...`);

        // Debug: Zeige alle Operations die gesendet werden
        const operations = Array.from(allBlockOperations.values());
        console.log('🔍 DEBUG: Operations being sent to API:', operations.map(op => ({
          operation: op.operation,
          blockId: op.data?.id || 'temp',
          blockType: op.data?.block_type,
          content: op.data?.content ? (typeof op.data.content === 'string' ? 'JSON string' : 'Object') : 'none',
          position: op.data ? `${op.data.grid_col || 0},${op.data.grid_row || 0}` : 'none',
          size: op.data ? `${op.data.grid_width || 2}x${op.data.grid_height || 1}` : 'none',
          backgroundColor: op.data?.background_color || 'default',
          textColor: op.data?.text_color || 'default',
          zIndex: op.data?.z_index || 'default'
        })));

        console.log('🔍 DEBUG: Full operation data:', operations.map(op => ({
          operation: op.operation,
          data: op.data,
          timestamp: op.timestamp
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
        console.log('🎨 Publishing layout changes...');

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

              // Intelligent merge: Behalte lokale Änderungen für Blöcke, die nicht gespeichert wurden
              const currentBlocksMap = new Map();
              blocks.forEach(block => {
                currentBlocksMap.set(block.id, block);
              });

              const mergedBlocks = normalizedBlocks.map(serverBlock => {
                const localBlock = currentBlocksMap.get(serverBlock.id);

                // Wenn der Block lokal existiert, überprüfe ob er neuere Änderungen hat
                if (localBlock && localBlock.updated_at && serverBlock.updated_at) {
                  const localTime = new Date(localBlock.updated_at).getTime();
                  const serverTime = new Date(serverBlock.updated_at).getTime();

                  // Wenn lokale Version neuer ist, behalte lokale Daten aber server-ID
                  if (localTime > serverTime) {
                    console.log(`🔄 Keeping local changes for block ${serverBlock.id} (local newer)`);
                    return {
                      ...serverBlock, // Server-ID und Basis-Daten
                      ...localBlock,  // Lokale Änderungen überschreiben
                      id: serverBlock.id, // Aber server ID beibehalten
                      updated_at: localBlock.updated_at
                    };
                  }
                }

                return serverBlock;
              });

              // Füge auch ID-Mappings für neue Blöcke hinzu
              if (idMapping.size > 0) {
                setBlocks(prevBlocks => {
                  return prevBlocks.map(block => {
                    if (idMapping.has(block.id)) {
                      const newId = idMapping.get(block.id);
                      const serverBlock = mergedBlocks.find(b => b.id === newId);
                      if (serverBlock) {
                        return {
                          ...block,
                          id: newId,
                          ...serverBlock
                        };
                      }
                    }
                    return block;
                  });
                });
              } else {
                setBlocks(mergedBlocks);
              }

              console.log(`✅ Updated UI with ${mergedBlocks.length} blocks from server (with local merge)`);
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

      // 8. Bereinige alle Pending-States und Draft-Änderungen
      console.log('🧹 Cleaning up pending states and draft changes...');

      if (hasBlockChanges || allDraftChanges.some(d => ['create', 'update', 'delete'].includes(d.type))) {
        setPendingOperations(new Map());
      }
      if (hasLayoutChanges || allDraftChanges.some(d => d.type === 'layout')) {
        setPendingLayoutChanges(null);
      }

      setSaveStatus('saved');
      setLastSaveTime(new Date());

      // 9. Lösche ALLE Draft-Änderungen (State + localStorage)
      setDraftChanges([]);
      clearDraftChanges(); // Lösche localStorage

      console.log(`✅ Successfully published all changes and cleared drafts`);
      console.log(`🔍 DEBUG: Final verification - Page ${currentPage.id} should now show updated content on public site`);
      console.log(`🔍 DEBUG: Public URL to check: /${currentPage.slug || currentPage.id}`);

      // Optional: Force page refresh for immediate feedback (nur im Development)
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log(`🔄 DEBUG: Development mode - Consider checking the public page for changes`);
      }

    } catch (error) {
      console.error('❌ Error publishing drafts:', error);
      setSaveStatus('error');
      throw error;
    }
  }, [currentPage, pendingOperations, pendingLayoutChanges, draftChanges, loadDraftChanges]);

  // Draft-Änderungen verwerfen
  const discardDrafts = useCallback(() => {
    console.log('🗑️ Discarding all draft changes');

    // Lade auch Draft-Änderungen aus localStorage für vollständige Bereinigung
    let localStorageDrafts = [];
    try {
      localStorageDrafts = loadDraftChanges() || [];
      console.log(`📂 Found ${localStorageDrafts.length} draft changes in localStorage to discard`);
    } catch (error) {
      console.warn('⚠️ Error loading localStorage drafts for discard:', error);
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

    console.log(`✅ Discarded ${localStorageDrafts.length + draftChanges.length} draft changes`);
  }, [currentPage, loadBlocks, loadLayoutSettings, draftChanges, loadDraftChanges]);

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

  // Synchronisiere States mit localStorage bei Änderungen
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('blocks', JSON.stringify(blocks));
      localStorage.setItem('undoHistory', JSON.stringify(undoHistory));
      localStorage.setItem('redoHistory', JSON.stringify(redoHistory));
      localStorage.setItem('draftChanges', JSON.stringify(draftChanges));
      localStorage.setItem('currentPage', JSON.stringify(currentPage));
    }
  }, [blocks, undoHistory, redoHistory, draftChanges, currentPage]);

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

    // Helper functions
    getTotalPendingChanges,
  };

  return (
    <CMSContext.Provider value={value}>
      {children}
    </CMSContext.Provider>
  );
};
