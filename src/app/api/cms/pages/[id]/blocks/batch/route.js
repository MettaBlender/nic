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

            console.log(`✅ Created block in SQL: ${newBlock.id} (${data.block_type}) - Temp ID: ${data.id}`);
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

            console.log(`🔄 Updating block ${data.id} with full data:`, {
              id: data.id,
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

            if (updatedBlock) {
              console.log(`✅ Updated block in SQL: ${data.id} with all properties - DB confirms:`, {
                position: `${updatedBlock.grid_col},${updatedBlock.grid_row}`,
                size: `${updatedBlock.grid_width}x${updatedBlock.grid_height}`,
                type: updatedBlock.block_type,
                colors: `bg:${updatedBlock.background_color}, text:${updatedBlock.text_color}`,
                z_index: updatedBlock.z_index
              });
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

    // Zusätzliche Validierung: Prüfe ob alle Updates korrekt gespeichert wurden
    const updateOperations = results.filter(r => r.operation === 'update' && r.success);
    if (updateOperations.length > 0) {
      console.log(`🔍 Verifying ${updateOperations.length} successful update operations in database...`);

      for (const updateResult of updateOperations) {
        const blockInDB = currentBlocks.find(b => b.id === updateResult.id);
        if (blockInDB) {
          console.log(`✅ Verified block ${updateResult.id} in database:`, {
            position: `${blockInDB.grid_col},${blockInDB.grid_row}`,
            size: `${blockInDB.grid_width}x${blockInDB.grid_height}`,
            type: blockInDB.block_type,
            background: blockInDB.background_color,
            text_color: blockInDB.text_color,
            z_index: blockInDB.z_index,
            updated_at: blockInDB.updated_at
          });
        } else {
          console.warn(`⚠️ Updated block ${updateResult.id} not found in database after update`);
        }
      }
    }

    console.log(`✅ Batch operations completed in SQL: ${operations.length} operations processed`);
    console.log(`📊 Final block count in database: ${currentBlocks.length}`);

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
