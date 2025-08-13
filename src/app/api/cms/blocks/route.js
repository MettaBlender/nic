import { NextResponse } from 'next/server';
import { getBlocks, createBlock } from '@/lib/database';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID ist erforderlich' }, { status: 400 });
    }

    const blocks = await getBlocks(pageId);
    return NextResponse.json(blocks);
  } catch (error) {
    console.error('Fehler beim Abrufen der Blöcke:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Blöcke' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const blockData = await request.json();

    if (!blockData.page_id || !blockData.block_type) {
      return NextResponse.json({ error: 'Page ID und Block Type sind erforderlich' }, { status: 400 });
    }

    const blockId = await createBlock(blockData);
    const newBlock = {
      id: blockId,
      ...blockData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(newBlock, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen des Blocks:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen des Blocks' }, { status: 500 });
  }
}
