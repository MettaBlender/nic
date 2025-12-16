/**
 * CMSContext Tests
 * Tests für die Kernfunktionalität des CMS Context:
 * - Block CRUD Operations
 * - Pending Operations Tracking
 * - LocalStorage Integration für currentPage
 * - Save Status Management
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CMSProvider, useCMS } from '@/context/CMSContext';

// Mock fetch globally
global.fetch = jest.fn();

// Mock dependencies
jest.mock('@/components/nic/cms/Components.jsx', () => ({
  getComponentFiles: jest.fn().mockResolvedValue({
    Text: {
      name: 'Text',
      options: { defaultText: 'Hello' },
      width: 2,
      height: 1
    },
    Image: {
      name: 'Image',
      options: { src: '' },
      width: 4,
      height: 2
    }
  })
}));

jest.mock('../../../nic.config.js', () => ({
  defaultBlockSizes: {
    default: { width: 2, height: 1 },
    Text: { width: 2, height: 1 },
    Image: { width: 4, height: 2 }
  }
}));

jest.mock('../../utils/responsiveLayoutGenerator.js', () => ({
  generateResponsiveLayouts: jest.fn(),
  getBlocksForDevice: jest.fn((blocks) => blocks),
  smartRegenerateLayouts: jest.fn(),
  RESPONSIVE_GRIDS: {
    desktop: { columns: 12 },
    tablet: { columns: 8 },
    mobile: { columns: 4 }
  }
}));

jest.mock('../../utils/localStorageManager.js', () => ({
  saveSingleBlockChange: jest.fn(),
  saveDraftChanges: jest.fn(),
  getDraftChanges: jest.fn().mockReturnValue([]),
  clearDraftChanges: jest.fn(),
  saveBlocksToLocalStorage: jest.fn(),
  getBlocksFromLocalStorage: jest.fn().mockReturnValue(null)
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

describe('CMSContext', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();

    // Default fetch mock response
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ([]),
    });
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      expect(result.current.pages).toEqual([]);
      expect(result.current.currentPage).toBeNull();
      expect(result.current.blocks).toEqual([]);
      expect(result.current.pendingOperationsCount).toBe(0);
      expect(result.current.saveStatus).toBe('saved');
    });

    it('should restore currentPage from localStorage', async () => {
      const mockPages = [
        { id: 1, title: 'Page 1', slug: 'page-1' },
        { id: 2, title: 'Page 2', slug: 'page-2' },
      ];

      localStorage.setItem('currentPageId', '2');

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPages,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      await waitFor(() => {
        expect(result.current.currentPage?.id).toBe(2);
      });
    });
  });

  describe('Block Operations', () => {
    it('should create a block and add to pendingOperations', async () => {
      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      act(() => {
        result.current.createBlock({
          block_type: 'Text',
          grid_col: 0,
          grid_row: 0,
          content: { text: 'Test' }
        });
      });

      await waitFor(() => {
        expect(result.current.blocks.length).toBe(1);
        expect(result.current.blocks[0].block_type).toBe('Text');
        expect(result.current.pendingOperationsCount).toBe(2); // 1 pending op + 1 draft change
        expect(result.current.saveStatus).toBe('dirty');
      });
    });

    it('should update block position and track in pendingOperations', async () => {
      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      // Create a block first
      let blockId;
      act(() => {
        const block = result.current.createBlock({
          block_type: 'Text',
          grid_col: 0,
          grid_row: 0,
          content: { text: 'Test' }
        });
        if (block) blockId = block.id;
      });

      // Update block position
      act(() => {
        if (blockId) {
          result.current.updateBlock(blockId, {
            grid_col: 5,
            grid_row: 3,
          });
        }
      });

      await waitFor(() => {
        const updatedBlock = result.current.blocks.find(b => b.id === blockId);
        expect(updatedBlock).toBeDefined();
        expect(updatedBlock.grid_col).toBe(5);
        expect(updatedBlock.grid_row).toBe(3);
        expect(result.current.pendingOperationsCount).toBeGreaterThan(0);
        expect(result.current.saveStatus).toBe('dirty');
      });
    });

    it('should handle multiple block updates correctly', async () => {
      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      let block1Id, block2Id;

      act(() => {
        const b1 = result.current.createBlock({ block_type: 'Text', content: { text: '1' } });
        const b2 = result.current.createBlock({ block_type: 'Image', content: { src: '2' } });
        if (b1) block1Id = b1.id;
        if (b2) block2Id = b2.id;
      });

      act(() => {
        if (block1Id && block2Id) {
          result.current.updateBlock(block1Id, { grid_col: 0, grid_row: 0 });
          result.current.updateBlock(block2Id, { grid_col: 4, grid_row: 0 });
          result.current.updateBlock(block1Id, { grid_col: 2, grid_row: 1 });
        }
      });

      await waitFor(() => {
        const b1 = result.current.blocks.find(b => b.id === block1Id);
        const b2 = result.current.blocks.find(b => b.id === block2Id);

        expect(b1).toBeDefined();
        expect(b2).toBeDefined();
        expect(b1.grid_col).toBe(2);
        expect(b1.grid_row).toBe(1);
        expect(b2.grid_col).toBe(4);
        expect(b2.grid_row).toBe(0);
        expect(result.current.pendingOperationsCount).toBe(7); // 2 creates (2*2) + 3 updates (3*1) = 7
      });
    });

    it('should delete a block and track in pendingOperations', async () => {
      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      let blockId;
      act(() => {
        const block = result.current.createBlock({ block_type: 'Text', content: { text: 'Test' } });
        if (block) blockId = block.id;
      });

      act(() => {
        if (blockId) {
          result.current.deleteBlock(blockId);
        }
      });

      await waitFor(() => {
        expect(result.current.blocks.find(b => b.id === blockId)).toBeUndefined();
        expect(result.current.pendingOperationsCount).toBeGreaterThan(0);
      });
    });
  });

  describe('Pending Operations', () => {
    it('should track pending operations count correctly', async () => {
      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      expect(result.current.pendingOperationsCount).toBe(0);

      act(() => {
        result.current.createBlock({ block_type: 'Text', content: { text: 'Test' } });
      });

      await waitFor(() => {
        expect(result.current.pendingOperationsCount).toBe(2);
      });

      act(() => {
        result.current.createBlock({ block_type: 'Image', content: { src: 'test.jpg' } });
      });

      await waitFor(() => {
        expect(result.current.pendingOperationsCount).toBe(4);
      });
    });

    it('should clear pending operations after successful publish', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          blocks: [],
          results: [],
        }),
      });

      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      // Set up a page first
      act(() => {
        result.current.setCurrentPage({ id: 1, title: 'Test Page' });
      });

      act(() => {
        result.current.createBlock({ block_type: 'Text', content: { text: 'Test' } });
      });

      await waitFor(() => {
        expect(result.current.pendingOperationsCount).toBe(2);
      });

      await act(async () => {
        await result.current.publishDrafts();
      });

      await waitFor(() => {
        expect(result.current.pendingOperationsCount).toBe(0);
        expect(result.current.saveStatus).toBe('saved');
      });
    });
  });

  describe('Save Status', () => {
    it('should update saveStatus to dirty when block is modified', async () => {
      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      expect(result.current.saveStatus).toBe('saved');

      act(() => {
        result.current.createBlock({ block_type: 'Text', content: { text: 'Test' } });
      });

      await waitFor(() => {
        expect(result.current.saveStatus).toBe('dirty');
      });
    });

    it('should update saveStatus to saving during publish', async () => {
      let resolvePublish;
      const publishPromise = new Promise(resolve => {
        resolvePublish = resolve;
      });

      global.fetch.mockImplementation((url) => {
        if (url.includes('/blocks/batch')) {
          return publishPromise.then(() => ({
            ok: true,
            json: async () => ({ success: true, blocks: [], results: [] }),
          }));
        }
        // Default response for other requests (like getting blocks)
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      });

      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      act(() => {
        result.current.setCurrentPage({ id: 1, title: 'Test Page' });
        result.current.createBlock({ block_type: 'Text', content: { text: 'Test' } });
      });

      act(() => {
        result.current.publishDrafts();
      });

      await waitFor(() => {
        expect(result.current.saveStatus).toBe('saving');
      });

      act(() => {
        resolvePublish();
      });

      await waitFor(() => {
        expect(result.current.saveStatus).toBe('saved');
      });
    });
  });

  describe('LocalStorage Integration', () => {
    it('should save currentPage.id to localStorage when page changes', async () => {
      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      const testPage = { id: 42, title: 'Test Page', slug: 'test' };

      act(() => {
        result.current.setCurrentPage(testPage);
      });

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('currentPageId', '42');
      });
    });

    it('should not save to localStorage when currentPage is null', async () => {
      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      act(() => {
        result.current.setCurrentPage(null);
      });

      await waitFor(() => {
        expect(localStorage.setItem).not.toHaveBeenCalledWith('currentPageId', expect.anything());
      });
    });
  });

  describe('Position Update Reliability', () => {
    it('should ensure grid_col and grid_row are always numbers', async () => {
      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      let blockId;
      act(() => {
        const block = result.current.createBlock({
          block_type: 'Text',
          grid_col: 0,
          grid_row: 0,
          content: { text: 'Test' }
        });
        if (block) blockId = block.id;
      });

      act(() => {
        if (blockId) {
          result.current.updateBlock(blockId, {
            grid_col: 5,
            grid_row: 3,
          });
        }
      });

      await waitFor(() => {
        const block = result.current.blocks.find(b => b.id === blockId);
        expect(block).toBeDefined();
        expect(typeof block.grid_col).toBe('number');
        expect(typeof block.grid_row).toBe('number');
        expect(block.grid_col).toBe(5);
        expect(block.grid_row).toBe(3);
      });
    });

    it('should handle position 0,0 correctly', async () => {
      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      let blockId;
      act(() => {
        const block = result.current.createBlock({
          block_type: 'Text',
          grid_col: 5,
          grid_row: 5,
          content: { text: 'Test' }
        });
        if (block) blockId = block.id;
      });

      act(() => {
        if (blockId) {
          result.current.updateBlock(blockId, {
            grid_col: 0,
            grid_row: 0,
          });
        }
      });

      await waitFor(() => {
        const block = result.current.blocks.find(b => b.id === blockId);
        expect(block).toBeDefined();
        expect(block.grid_col).toBe(0);
        expect(block.grid_row).toBe(0);
      });
    });
  });

  describe('Batch Operations', () => {
    it('should batch multiple updates to same block', async () => {
      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      let blockId;
      act(() => {
        const block = result.current.createBlock({ block_type: 'Text', content: { text: 'Test' } });
        if (block) blockId = block.id;
      });

      act(() => {
        if (blockId) {
          result.current.updateBlock(blockId, { grid_col: 1 });
          result.current.updateBlock(blockId, { grid_row: 2 });
          result.current.updateBlock(blockId, { grid_col: 3 });
        }
      });

      await waitFor(() => {
        // Should have 1 pending operation (create) + 4 draft changes (1 create + 3 updates) = 5
        expect(result.current.pendingOperationsCount).toBe(5);

        const block = result.current.blocks.find(b => b.id === blockId);
        expect(block).toBeDefined();
        expect(block.grid_col).toBe(3);
        expect(block.grid_row).toBe(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle publish failure gracefully', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/blocks/batch')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Server error' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      });

      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      act(() => {
        result.current.setCurrentPage({ id: 1, title: 'Test Page' });
        result.current.createBlock({ block_type: 'Text', content: { text: 'Test' } });
      });

      await act(async () => {
        try {
          await result.current.publishDrafts();
        } catch (error) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        // Pending operations should still exist after failed publish
        expect(result.current.pendingOperationsCount).toBeGreaterThan(0);
      });
    });

    it('should handle network errors during publish', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/blocks/batch')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      });

      const { result } = renderHook(() => useCMS(), {
        wrapper: CMSProvider,
      });

      act(() => {
        result.current.setCurrentPage({ id: 1, title: 'Test Page' });
        result.current.createBlock({ block_type: 'Text', content: { text: 'Test' } });
      });

      await act(async () => {
        try {
          await result.current.publishDrafts();
        } catch (error) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.pendingOperationsCount).toBeGreaterThan(0);
      });
    });
  });
});
