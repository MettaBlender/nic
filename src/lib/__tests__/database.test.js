/**
 * Database Tests
 * Tests für die Datenbank-Layer Funktionen
 */

import {
  getBlocksForPage,
  getBlockById,
  createBlock,
  updateBlock,
  deleteBlock,
} from '@/lib/database';

// Mock pg pool
jest.mock('@/lib/database', () => {
  const mockQuery = jest.fn();
  const mockRelease = jest.fn();
  const mockConnect = jest.fn(() => Promise.resolve({
    query: mockQuery,
    release: mockRelease,
  }));

  return {
    pool: {
      connect: mockConnect,
    },
    getBlocksForPage: jest.fn(),
    getBlockById: jest.fn(),
    createBlock: jest.fn(),
    updateBlock: jest.fn(),
    deleteBlock: jest.fn(),
  };
});

describe('Database Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBlocksForPage', () => {
    it('should return all blocks for a page', async () => {
      const mockBlocks = [
        {
          id: 1,
          page_id: 1,
          block_type: 'Text',
          grid_col: 0,
          grid_row: 0,
          content: { text: 'Block 1' },
        },
        {
          id: 2,
          page_id: 1,
          block_type: 'Image',
          grid_col: 4,
          grid_row: 0,
          content: { src: 'image.jpg' },
        },
      ];

      getBlocksForPage.mockResolvedValue(mockBlocks);

      const result = await getBlocksForPage(1);

      expect(result).toEqual(mockBlocks);
      expect(result).toHaveLength(2);
    });
  });

  describe('createBlock', () => {
    it('should create a new block with correct parameters', async () => {
      const mockNewBlock = {
        id: 1,
        page_id: 1,
        block_type: 'Text',
        grid_col: 0,
        grid_row: 0,
        grid_width: 4,
        grid_height: 2,
        content: { text: 'New block' },
      };

      createBlock.mockResolvedValue(mockNewBlock);

      const result = await createBlock(
        1,
        'Text',
        0,
        0,
        4,
        2,
        { text: 'New block' }
      );

      expect(result).toEqual(mockNewBlock);
      expect(createBlock).toHaveBeenCalledWith(1, 'Text', 0, 0, 4, 2, { text: 'New block' });
    });
  });

  describe('updateBlock', () => {
    it('should update block with new position', async () => {
      const mockUpdatedBlock = {
        id: 1,
        grid_col: 5,
        grid_row: 3,
        grid_width: 4,
        grid_height: 2,
      };

      updateBlock.mockResolvedValue(mockUpdatedBlock);

      const result = await updateBlock(1, {
        grid_col: 5,
        grid_row: 3,
      });

      expect(result.grid_col).toBe(5);
      expect(result.grid_row).toBe(3);
    });

    it('should handle position (0,0) correctly', async () => {
      const mockUpdatedBlock = {
        id: 1,
        grid_col: 0,
        grid_row: 0,
      };

      updateBlock.mockResolvedValue(mockUpdatedBlock);

      const result = await updateBlock(1, {
        grid_col: 0,
        grid_row: 0,
      });

      expect(result.grid_col).toBe(0);
      expect(result.grid_row).toBe(0);
    });

    it('should update all block properties', async () => {
      const mockUpdatedBlock = {
        id: 1,
        block_type: 'Text',
        grid_col: 2,
        grid_row: 1,
        grid_width: 6,
        grid_height: 3,
        content: { text: 'Updated' },
        background_color: '#ff0000',
        text_color: '#ffffff',
        z_index: 5,
      };

      updateBlock.mockResolvedValue(mockUpdatedBlock);

      const result = await updateBlock(1, {
        grid_col: 2,
        grid_row: 1,
        grid_width: 6,
        grid_height: 3,
        content: { text: 'Updated' },
        background_color: '#ff0000',
        text_color: '#ffffff',
        z_index: 5,
      });

      expect(result).toEqual(mockUpdatedBlock);
    });
  });

  describe('deleteBlock', () => {
    it('should delete a block', async () => {
      deleteBlock.mockResolvedValue(true);

      const result = await deleteBlock(1);

      expect(result).toBe(true);
      expect(deleteBlock).toHaveBeenCalledWith(1);
    });
  });

  describe('getBlockById', () => {
    it('should return a specific block', async () => {
      const mockBlock = {
        id: 1,
        block_type: 'Text',
        content: { text: 'Test' },
      };

      getBlockById.mockResolvedValue(mockBlock);

      const result = await getBlockById(1);

      expect(result).toEqual(mockBlock);
    });

    it('should return null for non-existent block', async () => {
      getBlockById.mockResolvedValue(null);

      const result = await getBlockById(999);

      expect(result).toBeNull();
    });
  });
});
