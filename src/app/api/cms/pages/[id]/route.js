import { NextResponse } from 'next/server';
import { getPageById, updatePage, deletePage, deleteAllBlocksForPage } from '@/lib/database';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const pageId = parseInt(id);

    if (isNaN(pageId)) {
      return NextResponse.json({ error: 'Ungültige Seiten-ID' }, { status: 400 });
    }

    const page = await getPageById(pageId);

    if (!page) {
      return NextResponse.json({ error: 'Seite nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('❌ Error getting page:', error);
    return NextResponse.json({ error: 'Error retrieving page' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const pageId = parseInt(id);

    if (isNaN(pageId)) {
      return NextResponse.json({ error: 'Ungültige Seiten-ID' }, { status: 400 });
    }

    const { title, slug } = await request.json();

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
    }

    // Check if the page exists
    const existingPage = await getPageById(pageId);
    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Update the page with both values
    await updatePage(pageId, title, slug);

    // Lade die aktualisierte Seite
    const updatedPage = await getPageById(pageId);

    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error('❌ Error updating page:', error);
    if (error.message.includes('UNIQUE constraint failed') || error.message.includes('duplicate key')) {
      return NextResponse.json({ error: 'Eine Seite mit diesem Slug existiert bereits' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error updating page' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const pageId = parseInt(id);

    if (isNaN(pageId)) {
      return NextResponse.json({ error: 'Invalid page ID' }, { status: 400 });
    }

    // Check if the page exists
    const existingPage = await getPageById(pageId);
    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // First delete all blocks of the page
    const deletedBlocksCount = await deleteAllBlocksForPage(pageId);

    // Dann lösche die Seite selbst
    const result = await deletePage(pageId);

    return NextResponse.json({
      success: true,
      message: 'Page successfully deleted',
      deletedBlocks: deletedBlocksCount
    });
  } catch (error) {
    console.error('❌ Error deleting page:', error);
    return NextResponse.json({ error: 'Error deleting page' }, { status: 500 });
  }
}
