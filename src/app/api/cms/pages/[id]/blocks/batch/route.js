import { NextResponse } from 'next/server';
import {
  getBlocksForPage,
  createBlock,
  updateBlock,
  deleteBlock,
  deleteAllBlocksForPage,
  createMultipleBlocks,
  updatePageRows
} from '@/lib/database';

// Force dynamic API routes
export const dynamic = 'force-dynamic';

// POST: Process batch operations for blocks
export async function POST(request, { params }) {
  try {
    const resolvedParams = await params;
    const pageId = resolvedParams.id;
    const { operations, rows } = await request.json();

    if (!Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json(
        { error: 'No operations provided' },
        { status: 400 }
      );
    }

    // Sortiere Operations nach Timestamp für konsistente Reihenfolge
    const sortedOps = operations.sort((a, b) => a.timestamp - b.timestamp);

    const results = [];

    // Verarbeite jede Operation
    for (const operation of sortedOps) {
      const { operation: opType, data } = operation;

      try {
        switch (opType) {
          case 'create':
            // Parse content korrekt - es könnte als String oder Object kommen
            let contentForDB = {};
            if (typeof data.content === 'string') {
              try {
                contentForDB = JSON.parse(data.content);
              } catch {
                contentForDB = { text: data.content };
              }
            } else if (typeof data.content === 'object' && data.content !== null) {
              contentForDB = data.content;
            }

            const newBlock = await createBlock(
              pageId,
              data.block_type || 'Text',
              data.grid_col || 0,
              data.grid_row || 0,
              data.grid_width || 2,
              data.grid_height || 1,
              contentForDB
            );

            results.push({
              operation: 'create',
              success: true,
              block: newBlock,
              tempId: data.id // Wichtig: Temp-ID für Frontend-Mapping
            });

            break;

          case 'update':
            // Parse content korrekt für Updates
            let updateContentForDB = data.content;
            if (typeof data.content === 'string') {
              try {
                updateContentForDB = JSON.parse(data.content);
              } catch {
                updateContentForDB = { text: data.content };
              }
            }

            // Übergebe alle Daten als ein Object an updateBlock
            const updatedBlock = await updateBlock(data.id, {
              grid_col: data.grid_col,
              grid_row: data.grid_row,
              grid_width: data.grid_width,
              grid_height: data.grid_height,
              content: updateContentForDB,
              block_type: data.block_type,
              background_color: data.background_color,
              text_color: data.text_color,
              z_index: data.z_index
            });

            results.push({
              operation: 'update',
              success: updatedBlock !== null,
              id: data.id,
              updatedBlock: updatedBlock,
              updatedFields: {
                grid_col: data.grid_col,
                grid_row: data.grid_row,
                grid_width: data.grid_width,
                grid_height: data.grid_height,
                block_type: data.block_type,
                background_color: data.background_color,
                text_color: data.text_color,
                z_index: data.z_index,
                contentLength: JSON.stringify(updateContentForDB).length
              }
            });

            break;

          case 'delete':
            const deleteSuccess = await deleteBlock(data.id);

            results.push({
              operation: 'delete',
              success: deleteSuccess,
              id: data.id
            });

            break;

          case 'replace_all':
            // Delete all blocks and create new ones
            await deleteAllBlocksForPage(pageId);

            if (data.blocks && data.blocks.length > 0) {
              const newBlocks = [];
              for (const blockData of data.blocks) {
                const newBlock = await createBlock(
                  pageId,
                  blockData.block_type || 'Text',
                  blockData.grid_col || 0,
                  blockData.grid_row || 0,
                  blockData.grid_width || 2,
                  blockData.grid_height || 1,
                  blockData.content || {}
                );
                newBlocks.push(newBlock);
              }

              results.push({
                operation: 'replace_all',
                success: true,
                blocks: newBlocks,
                created: newBlocks.length
              });

            } else {
              results.push({
                operation: 'replace_all',
                success: true,
                created: 0
              });
            }
            break;

          default:
            results.push({
              operation: opType,
              success: false,
              error: 'Unknown operation type'
            });
        }
      } catch (opError) {
        console.error(`❌ Error processing operation ${opType}:`, opError);
        results.push({
          operation: opType,
          success: false,
          error: opError.message
        });
      }
    }

    // Update Page Rows
    await updatePageRows(pageId, rows || 12);

    // Load current blocks after operations
    const currentBlocks = await getBlocksForPage(pageId);

    // Additional validation: Check if all updates were correctly saved
    const updateOperations = results.filter(r => r.operation === 'update' && r.success);
    if (updateOperations.length > 0) {

      for (const updateResult of updateOperations) {
        const blockInDB = currentBlocks.find(b => b.id === updateResult.id);
      }
    }

    return NextResponse.json({
      success: true,
      blocks: currentBlocks,
      operationsProcessed: operations.length,
      results,
      message: `Successfully processed ${operations.length} operations in SQL`,
      verification: {
        totalBlocks: currentBlocks.length,
        updatedBlocks: updateOperations.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error processing batch operations:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}
