import { NextResponse } from 'next/server';
import { getBlocksForPage, createBlock, deleteAllBlocksForPage } from '@/lib/database';

// Force dynamic API routes
export const dynamic = 'force-dynamic';

// GET: Load blocks for a specific page
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const pageId = resolvedParams.id;

    const blocks = await getBlocksForPage(pageId);

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
    const resolvedParams = await params;
    const pageId = resolvedParams.id;
    const blockData = await request.json();

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

// DELETE: Delete all blocks of a page
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const pageId = resolvedParams.id;

    const deletedCount = await deleteAllBlocksForPage(pageId);

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
