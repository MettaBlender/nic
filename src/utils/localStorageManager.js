/**
 * LocalStorage Manager for CMS Drafts
 * Manages local storage of unpublished changes
 */

'use client';

const STORAGE_KEYS = {
  DRAFT_CHANGES: 'cms_draft_changes',
  DRAFT_BLOCKS: 'cms_draft_blocks',
  LAST_SAVE: 'cms_last_save',
  PAGE_STATES: 'cms_page_states'
};

/**
 * Saves draft changes to localStorage
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
 * Loads draft changes from localStorage
 */
export const loadDraftChanges = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DRAFT_CHANGES);
    if (!stored) return [];

    const data = JSON.parse(stored);

    // Validate data structure
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
 * Clears all draft changes
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
 * Saves block state for a specific page
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
 * Loads block state for a specific page
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
 * Saves a single block change
 */
export const saveSingleBlockChange = (blockChange) => {
  const existingChanges = loadDraftChanges();

  // Remove previous changes for the same block
  const filteredChanges = existingChanges.filter(change =>
    !(change.blockId === blockChange.blockId && change.type === blockChange.type)
  );

  // Add new change
  filteredChanges.push({
    ...blockChange,
    id: Date.now(),
    timestamp: Date.now()
  });

  return saveDraftChanges(filteredChanges);
};

/**
 * Removes a specific block change
 */
export const removeDraftChange = (changeId) => {
  const existingChanges = loadDraftChanges();
  const updatedChanges = existingChanges.filter(change => change.id !== changeId);

  return saveDraftChanges(updatedChanges);
};

/**
 * Sets last save timestamp
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
 * Gets last save timestamp
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
 * Cleans up old draft data (older than 24 hours)
 */
export const cleanupOldDrafts = () => {
  try {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    // Clean draft changes
    const changes = loadDraftChanges();
    const recentChanges = changes.filter(change =>
      change.timestamp && change.timestamp > oneDayAgo
    );

    if (recentChanges.length !== changes.length) {
      saveDraftChanges(recentChanges);
    }

    // Clean page states
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
 * Clean up old temp_ IDs from localStorage blocks
 */
export const cleanupTempBlocks = () => {
  try {
    const storedBlocks = localStorage.getItem('blocks');
    if (!storedBlocks) return true;

    const blocks = JSON.parse(storedBlocks);
    if (!Array.isArray(blocks)) return true;

    // Remove all blocks with temp_ IDs older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const cleanedBlocks = blocks.filter(block => {
      if (!block.id || !block.id.toString().startsWith('temp_')) {
        return true; // Keep non-temp blocks
      }

      // Check age based on created_at
      const createdAt = new Date(block.created_at || 0).getTime();
      return createdAt > oneHourAgo; // Keep only new temp blocks
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
 * Clean up problematic draft changes
 */
export const cleanupProblematicDrafts = () => {
  try {
    const storedDrafts = localStorage.getItem(STORAGE_KEYS.DRAFT_CHANGES);
    if (!storedDrafts) return true;

    const drafts = JSON.parse(storedDrafts);
    if (!Array.isArray(drafts)) return true;

    // Remove problematic draft changes
    const cleanedDrafts = drafts.filter(draft => {
      // Remove Text block CREATE drafts without content
      if (draft.type === 'create' &&
          draft.data?.block_type === 'Text' &&
          (!draft.data.content ||
           (typeof draft.data.content === 'object' && !draft.data.content.text) ||
           (typeof draft.data.content === 'string' && draft.data.content.trim() === ''))) {
        console.log(`🧹 Removing problematic Text block draft: ${draft.blockId}`);
        return false;
      }

      // Remove very old draft changes (older than 24 hours)
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
