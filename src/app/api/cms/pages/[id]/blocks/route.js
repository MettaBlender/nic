import { NextResponse } from 'next/server';
import { getBlocksForPage, createBlock, deleteAllBlocksForPage } from '@/lib/database';

// GET: Blöcke für eine bestimmte Seite laden
export async function GET(request, { params }) {
  try {
    const pageId = params.id;
    console.log(`📦 Loading blocks for page ${pageId} from SQL...`);

    const blocks = await getBlocksForPage(pageId);

    console.log(`✅ Found ${blocks.length} blocks for page ${pageId} in SQL`);
    return NextResponse.json(blocks);
  } catch (error) {
    console.error('❌ Error loading blocks:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// POST: Neuen Block erstellen
export async function POST(request, { params }) {
  try {
    const pageId = params.id;
    const blockData = await request.json();

    console.log(`📝 Creating block for page: ${pageId} in SQL`, blockData);

    const blockId = await createBlock(
      pageId,
      blockData.block_type || 'Text',
      typeof blockData.grid_col === 'number' ? blockData.grid_col : 0,
      typeof blockData.grid_row === 'number' ? blockData.grid_row : 0,
      typeof blockData.grid_width === 'number' ? blockData.grid_width : 2,
      typeof blockData.grid_height === 'number' ? blockData.grid_height : 1,
      {
        content: blockData.content || '',
        background_color: blockData.background_color || 'transparent',
        text_color: blockData.text_color || '#000000',
        z_index: typeof blockData.z_index === 'number' ? blockData.z_index : 1
      }
    );

    const newBlock = {
      id: blockId,
      page_id: pageId,
      block_type: blockData.block_type || 'Text',
      content: blockData.content || '',
      grid_col: typeof blockData.grid_col === 'number' ? blockData.grid_col : 0,
      grid_row: typeof blockData.grid_row === 'number' ? blockData.grid_row : 0,
      grid_width: typeof blockData.grid_width === 'number' ? blockData.grid_width : 2,
      grid_height: typeof blockData.grid_height === 'number' ? blockData.grid_height : 1,
      background_color: blockData.background_color || 'transparent',
      text_color: blockData.text_color || '#000000',
      z_index: typeof blockData.z_index === 'number' ? blockData.z_index : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`✅ Created block in SQL: ${blockId}`);
    return NextResponse.json(newBlock, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating block:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE: Alle Blöcke einer Seite löschen
export async function DELETE(request, { params }) {
  try {
    const pageId = params.id;
    console.log(`🗑️ Deleting all blocks for page: ${pageId} from SQL`);

    const deletedCount = await deleteAllBlocksForPage(pageId);

    console.log(`✅ Deleted ${deletedCount} blocks for page ${pageId} from SQL`);
    return NextResponse.json({
      success: true,
      deletedCount
    });
  } catch (error) {
    console.error('❌ Error deleting blocks:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}
