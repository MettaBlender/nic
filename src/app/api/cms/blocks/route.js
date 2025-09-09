import { NextResponse } from 'next/server';
import { getBlocksForPage, createBlock } from '@/lib/database';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID ist erforderlich' }, { status: 400 });
    }

    const blocks = await getBlocksForPage(pageId);
    return NextResponse.json(blocks);
  } catch (error) {
    console.error('Error retrieving blocks:', error);
    return NextResponse.json({ error: 'Error retrieving blocks' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const blockData = await request.json();

    if (!blockData.page_id || !blockData.block_type) {
      return NextResponse.json({ error: 'Page ID und Block Type sind erforderlich' }, { status: 400 });
    }

    const blockId = await createBlock(
      blockData.page_id,
      blockData.block_type,
      blockData.grid_col || 0,
      blockData.grid_row || 0,
      blockData.grid_width || 2,
      blockData.grid_height || 1,
      blockData.content || {}
    );

    const newBlock = {
      id: blockId,
      page_id: blockData.page_id,
      block_type: blockData.block_type,
      grid_col: blockData.grid_col || 0,
      grid_row: blockData.grid_row || 0,
      grid_width: blockData.grid_width || 2,
      grid_height: blockData.grid_height || 1,
      content: blockData.content || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(newBlock, { status: 201 });
  } catch (error) {
    console.error('Error creating block:', error);
    return NextResponse.json({ error: 'Error creating block' }, { status: 500 });
  }
}
