/**
 * API Route Tests
 * Tests für die Block-Management API Routes
 */

import { POST } from '@/app/api/cms/pages/[id]/blocks/batch/route';
import * as db from '@/lib/database';

// Mock database functions
jest.mock('@/lib/database', () => ({
  getBlocksForPage: jest.fn(),
  createBlock: jest.fn(),
  updateBlock: jest.fn(),
  deleteBlock: jest.fn(),
  deleteAllBlocksForPage: jest.fn(),
  updatePageRows: jest.fn(),
}));

describe('API: /api/cms/pages/[id]/blocks/batch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST - Batch Operations', () => {
    it('should create a new block', async () => {
      const mockNewBlock = {
        id: 1,
        page_id: 1,
        block_type: 'Text',
        grid_col: 0,
        grid_row: 0,
        grid_width: 4,
        grid_height: 2,
        content: { text: 'Hello' },
      };

      db.createBlock.mockResolvedValue(mockNewBlock);
      db.getBlocksForPage.mockResolvedValue([mockNewBlock]);
      db.updatePageRows.mockResolvedValue(true);

      const request = new Request('http://localhost/api/cms/pages/1/blocks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations: [{
            operation: 'create',
            data: {
              id: 'temp_123',
              block_type: 'Text',
              grid_col: 0,
              grid_row: 0,
              grid_width: 4,
              grid_height: 2,
              content: { text: 'Hello' },
            },
            timestamp: Date.now(),
          }],
          rows: 12,
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.blocks).toHaveLength(1);
      expect(db.createBlock).toHaveBeenCalledWith(
        '1',
        'Text',
        0,
        0,
        4,
        2,
        { text: 'Hello' }
      );
    });

    it('should update block position', async () => {
      const mockUpdatedBlock = {
        id: 1,
        page_id: 1,
        block_type: 'Text',
        grid_col: 5,
        grid_row: 3,
        grid_width: 4,
        grid_height: 2,
        content: { text: 'Hello' },
      };

      db.updateBlock.mockResolvedValue(mockUpdatedBlock);
      db.getBlocksForPage.mockResolvedValue([mockUpdatedBlock]);
      db.updatePageRows.mockResolvedValue(true);

      const request = new Request('http://localhost/api/cms/pages/1/blocks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations: [{
            operation: 'update',
            data: {
              id: 1,
              grid_col: 5,
              grid_row: 3,
              grid_width: 4,
              grid_height: 2,
              block_type: 'Text',
              content: { text: 'Hello' },
              background_color: 'transparent',
              text_color: '#000000',
              z_index: 1,
            },
            timestamp: Date.now(),
          }],
          rows: 12,
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(db.updateBlock).toHaveBeenCalledWith(1, expect.objectContaining({
        grid_col: 5,
        grid_row: 3,
      }));
    });

    it('should handle position (0,0) correctly', async () => {
      const mockUpdatedBlock = {
        id: 1,
        page_id: 1,
        block_type: 'Text',
        grid_col: 0,
        grid_row: 0,
        grid_width: 4,
        grid_height: 2,
        content: { text: 'Hello' },
      };

      db.updateBlock.mockResolvedValue(mockUpdatedBlock);
      db.getBlocksForPage.mockResolvedValue([mockUpdatedBlock]);
      db.updatePageRows.mockResolvedValue(true);

      const request = new Request('http://localhost/api/cms/pages/1/blocks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations: [{
            operation: 'update',
            data: {
              id: 1,
              grid_col: 0,
              grid_row: 0,
              grid_width: 4,
              grid_height: 2,
              block_type: 'Text',
              content: { text: 'Hello' },
            },
            timestamp: Date.now(),
          }],
          rows: 12,
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(db.updateBlock).toHaveBeenCalledWith(1, expect.objectContaining({
        grid_col: 0,
        grid_row: 0,
      }));
    });

    it('should delete a block', async () => {
      db.deleteBlock.mockResolvedValue(true);
      db.getBlocksForPage.mockResolvedValue([]);
      db.updatePageRows.mockResolvedValue(true);

      const request = new Request('http://localhost/api/cms/pages/1/blocks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations: [{
            operation: 'delete',
            data: { id: 1 },
            timestamp: Date.now(),
          }],
          rows: 12,
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(db.deleteBlock).toHaveBeenCalledWith(1);
    });

    it('should handle multiple operations in order', async () => {
      const mockBlock1 = {
        id: 1,
        block_type: 'Text',
        grid_col: 0,
        grid_row: 0,
      };
      const mockBlock2 = {
        id: 2,
        block_type: 'Image',
        grid_col: 4,
        grid_row: 0,
      };

      db.createBlock.mockResolvedValueOnce(mockBlock1);
      db.createBlock.mockResolvedValueOnce(mockBlock2);
      db.getBlocksForPage.mockResolvedValue([mockBlock1, mockBlock2]);
      db.updatePageRows.mockResolvedValue(true);

      const request = new Request('http://localhost/api/cms/pages/1/blocks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations: [
            {
              operation: 'create',
              data: {
                id: 'temp_1',
                block_type: 'Text',
                grid_col: 0,
                grid_row: 0,
                content: {},
              },
              timestamp: Date.now(),
            },
            {
              operation: 'create',
              data: {
                id: 'temp_2',
                block_type: 'Image',
                grid_col: 4,
                grid_row: 0,
                content: {},
              },
              timestamp: Date.now() + 1,
            },
          ],
          rows: 12,
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.operationsProcessed).toBe(2);
      expect(db.createBlock).toHaveBeenCalledTimes(2);
    });

    it('should return 400 if no operations provided', async () => {
      const request = new Request('http://localhost/api/cms/pages/1/blocks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations: [],
          rows: 12,
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) });

      expect(response.status).toBe(400);
    });

    it('should handle database errors gracefully', async () => {
      db.updateBlock.mockRejectedValue(new Error('Database error'));
      db.getBlocksForPage.mockResolvedValue([]);
      db.updatePageRows.mockResolvedValue(true);

      const request = new Request('http://localhost/api/cms/pages/1/blocks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations: [{
            operation: 'update',
            data: {
              id: 1,
              grid_col: 5,
              grid_row: 3,
            },
            timestamp: Date.now(),
          }],
          rows: 12,
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].success).toBe(false);
      expect(data.results[0].error).toBe('Database error');
    });

    it('should handle JSON parsing of content', async () => {
      const mockBlock = {
        id: 1,
        block_type: 'Text',
        content: { text: 'Test', style: 'bold' },
      };

      db.createBlock.mockResolvedValue(mockBlock);
      db.getBlocksForPage.mockResolvedValue([mockBlock]);
      db.updatePageRows.mockResolvedValue(true);

      const request = new Request('http://localhost/api/cms/pages/1/blocks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations: [{
            operation: 'create',
            data: {
              id: 'temp_1',
              block_type: 'Text',
              content: JSON.stringify({ text: 'Test', style: 'bold' }),
              grid_col: 0,
              grid_row: 0,
            },
            timestamp: Date.now(),
          }],
          rows: 12,
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(db.createBlock).toHaveBeenCalledWith(
        '1',
        'Text',
        0,
        0,
        expect.any(Number),
        expect.any(Number),
        { text: 'Test', style: 'bold' }
      );
    });
  });
});
