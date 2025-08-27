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

// POST: Batch-Operations für Blöcke verarbeiten
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

    console.log(`🔄 Processing ${operations.length} batch operations for page ${pageId} in SQL`);

    // Sortiere Operations nach Timestamp für konsistente Reihenfolge
    const sortedOps = operations.sort((a, b) => a.timestamp - b.timestamp);

    const results = [];

    // Verarbeite jede Operation
    for (const operation of sortedOps) {
      const { operation: opType, data } = operation;

      try {
        switch (opType) {
          case 'create':
            const newBlock = await createBlock(
              pageId,
              data.block_type || 'Text',
              data.grid_col || 0,
              data.grid_row || 0,
              data.grid_width || 2,
              data.grid_height || 1,
              data.content || {}
            );

            results.push({
              operation: 'create',
              success: true,
              block: newBlock,
              tempId: data.id
            });

            console.log(`✅ Created block in SQL: ${newBlock.id} (${data.block_type})`);
            break;

          case 'update':
            const updateSuccess = await updateBlock(
              data.id,
              data.grid_col,
              data.grid_row,
              data.grid_width,
              data.grid_height,
              data.content
            );

            results.push({
              operation: 'update',
              success: updateSuccess,
              id: data.id
            });

            if (updateSuccess) {
              console.log(`✅ Updated block in SQL: ${data.id}`);
            } else {
              console.warn(`⚠️ Block not found for update: ${data.id}`);
            }
            break;

          case 'delete':
            const deleteSuccess = await deleteBlock(data.id);

            results.push({
              operation: 'delete',
              success: deleteSuccess,
              id: data.id
            });

            if (deleteSuccess) {
              console.log(`✅ Deleted block from SQL: ${data.id}`);
            } else {
              console.warn(`⚠️ Block not found for deletion: ${data.id}`);
            }
            break;

          case 'replace_all':
            // Lösche alle Blöcke und erstelle neue
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

              console.log(`✅ Replaced all blocks in SQL: ${newBlocks.length} new blocks`);
            } else {
              results.push({
                operation: 'replace_all',
                success: true,
                created: 0
              });
              console.log(`✅ Cleared all blocks in SQL for page ${pageId}`);
            }
            break;

          default:
            console.warn(`⚠️ Unknown operation type: ${opType}`);
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
    console.log(`✅ Updated page rows in SQL: ${rows || 12}`);

    // Lade aktuelle Blöcke nach den Operationen
    const currentBlocks = await getBlocksForPage(pageId);

    console.log(`✅ Batch operations completed in SQL: ${operations.length} operations processed`);

    return NextResponse.json({
      success: true,
      blocks: currentBlocks,
      operationsProcessed: operations.length,
      results,
      message: `Successfully processed ${operations.length} operations in SQL`
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
