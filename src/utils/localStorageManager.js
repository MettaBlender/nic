/**
 * LocalStorage Manager für CMS Drafts
 * Verwaltet lokale Speicherung von nicht-veröffentlichten Änderungen
 */

'use client';

const STORAGE_KEYS = {
  DRAFT_CHANGES: 'cms_draft_changes',
  DRAFT_BLOCKS: 'cms_draft_blocks',
  LAST_SAVE: 'cms_last_save',
  PAGE_STATES: 'cms_page_states'
};

/**
 * Speichert Draft-Änderungen in localStorage
 */
export const saveDraftChanges = (changes) => {
  try {
    const data = {
      changes: Array.isArray(changes) ? changes : [],
      timestamp: Date.now(),
      version: '2.0'
    };

    localStorage.setItem(STORAGE_KEYS.DRAFT_CHANGES, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('❌ Failed to save draft changes:', error);
    return false;
  }
};

/**
 * Lädt Draft-Änderungen aus localStorage
 */
export const loadDraftChanges = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DRAFT_CHANGES);
    if (!stored) return [];

    const data = JSON.parse(stored);

    // Validiere Datenstruktur
    if (!data.changes || !Array.isArray(data.changes)) {
      console.warn('⚠️ Invalid draft changes format, clearing...');
      clearDraftChanges();
      return [];
    }

    return data.changes;
  } catch (error) {
    console.error('❌ Failed to load draft changes:', error);
    return [];
  }
};

/**
 * Löscht alle Draft-Änderungen
 */
export const clearDraftChanges = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.DRAFT_CHANGES);
    return true;
  } catch (error) {
    console.error('❌ Failed to clear draft changes:', error);
    return false;
  }
};

/**
 * Speichert Block-Zustand für eine spezifische Seite
 */
export const savePageBlockState = (pageId, blocks) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAGE_STATES) || '{}');

    stored[pageId] = {
      blocks: blocks,
      timestamp: Date.now(),
      version: '2.0'
    };

    localStorage.setItem(STORAGE_KEYS.PAGE_STATES, JSON.stringify(stored));
    return true;
  } catch (error) {
    console.error('❌ Failed to save page block state:', error);
    return false;
  }
};

/**
 * Lädt Block-Zustand für eine spezifische Seite
 */
export const loadPageBlockState = (pageId) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAGE_STATES) || '{}');

    if (stored[pageId] && stored[pageId].blocks) {
      return stored[pageId].blocks;
    }

    return null;
  } catch (error) {
    console.error('❌ Failed to load page block state:', error);
    return null;
  }
};

/**
 * Speichert eine einzelne Block-Änderung
 */
export const saveSingleBlockChange = (blockChange) => {
  const existingChanges = loadDraftChanges();

  // Entferne vorherige Änderungen für denselben Block
  const filteredChanges = existingChanges.filter(change =>
    !(change.blockId === blockChange.blockId && change.type === blockChange.type)
  );

  // Füge neue Änderung hinzu
  filteredChanges.push({
    ...blockChange,
    id: Date.now(),
    timestamp: Date.now()
  });

  return saveDraftChanges(filteredChanges);
};

/**
 * Entfernt eine spezifische Block-Änderung
 */
export const removeDraftChange = (changeId) => {
  const existingChanges = loadDraftChanges();
  const updatedChanges = existingChanges.filter(change => change.id !== changeId);

  return saveDraftChanges(updatedChanges);
};

/**
 * Setzt Last-Save Timestamp
 */
export const setLastSaveTime = (timestamp = Date.now()) => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SAVE, timestamp.toString());
    return true;
  } catch (error) {
    console.error('❌ Failed to set last save time:', error);
    return false;
  }
};

/**
 * Holt Last-Save Timestamp
 */
export const getLastSaveTime = () => {
  try {
    const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_SAVE);
    return timestamp ? parseInt(timestamp) : null;
  } catch (error) {
    console.error('❌ Failed to get last save time:', error);
    return null;
  }
};

/**
 * Bereinigt alte Draft-Daten (älter als 24 Stunden)
 */
export const cleanupOldDrafts = () => {
  try {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    // Bereinige Draft-Änderungen
    const changes = loadDraftChanges();
    const recentChanges = changes.filter(change =>
      change.timestamp && change.timestamp > oneDayAgo
    );

    if (recentChanges.length !== changes.length) {
      saveDraftChanges(recentChanges);
    }

    // Bereinige Page-States
    const pageStates = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAGE_STATES) || '{}');
    const cleanedStates = {};

    Object.entries(pageStates).forEach(([pageId, state]) => {
      if (state.timestamp && state.timestamp > oneDayAgo) {
        cleanedStates[pageId] = state;
      }
    });

    localStorage.setItem(STORAGE_KEYS.PAGE_STATES, JSON.stringify(cleanedStates));

    return true;
  } catch (error) {
    console.error('❌ Failed to cleanup old drafts:', error);
    return false;
  }
};

/**
 * Bereinige alte temp_ IDs aus localStorage blocks
 */
export const cleanupTempBlocks = () => {
  try {
    const storedBlocks = localStorage.getItem('blocks');
    if (!storedBlocks) return true;

    const blocks = JSON.parse(storedBlocks);
    if (!Array.isArray(blocks)) return true;

    // Entferne alle Blöcke mit temp_ IDs die älter als 1 Stunde sind
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const cleanedBlocks = blocks.filter(block => {
      if (!block.id || !block.id.toString().startsWith('temp_')) {
        return true; // Behalte nicht-temp Blöcke
      }

      // Prüfe das Alter basierend auf created_at
      const createdAt = new Date(block.created_at || 0).getTime();
      return createdAt > oneHourAgo; // Behalte nur neue temp Blöcke
    });

    if (cleanedBlocks.length !== blocks.length) {
      localStorage.setItem('blocks', JSON.stringify(cleanedBlocks));
      console.log(`🧹 Cleaned up ${blocks.length - cleanedBlocks.length} old temp blocks from localStorage`);
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to cleanup temp blocks:', error);
    return false;
  }
};

/**
 * Bereinige problematische Draft-Änderungen
 */
export const cleanupProblematicDrafts = () => {
  try {
    const storedDrafts = localStorage.getItem(STORAGE_KEYS.DRAFT_CHANGES);
    if (!storedDrafts) return true;

    const drafts = JSON.parse(storedDrafts);
    if (!Array.isArray(drafts)) return true;

    // Entferne problematische Draft-Änderungen
    const cleanedDrafts = drafts.filter(draft => {
      // Entferne Text-Block CREATE Drafts ohne Inhalt
      if (draft.type === 'create' &&
          draft.data?.block_type === 'Text' &&
          (!draft.data.content ||
           (typeof draft.data.content === 'object' && !draft.data.content.text) ||
           (typeof draft.data.content === 'string' && draft.data.content.trim() === ''))) {
        console.log(`🧹 Removing problematic Text block draft: ${draft.blockId}`);
        return false;
      }

      // Entferne sehr alte Draft-Änderungen (älter als 24 Stunden)
      const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
      if (draft.timestamp < dayAgo) {
        console.log(`🧹 Removing old draft: ${draft.blockId} (${new Date(draft.timestamp).toLocaleString()})`);
        return false;
      }

      return true;
    });

    if (cleanedDrafts.length !== drafts.length) {
      localStorage.setItem(STORAGE_KEYS.DRAFT_CHANGES, JSON.stringify(cleanedDrafts));
      console.log(`🧹 Cleaned up ${drafts.length - cleanedDrafts.length} problematic draft changes`);
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to cleanup problematic drafts:', error);
    return false;
  }
};
