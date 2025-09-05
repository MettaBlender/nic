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
    return NextResponse.json({ error: 'Fehler beim Abrufen der Seite' }, { status: 500 });
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
      return NextResponse.json({ error: 'Titel und Slug sind erforderlich' }, { status: 400 });
    }

    // Prüfe ob die Seite existiert
    const existingPage = await getPageById(pageId);
    if (!existingPage) {
      return NextResponse.json({ error: 'Seite nicht gefunden' }, { status: 404 });
    }

    // Aktualisiere die Seite mit beiden Werten
    await updatePage(pageId, title, slug);

    // Lade die aktualisierte Seite
    const updatedPage = await getPageById(pageId);

    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error('❌ Error updating page:', error);
    if (error.message.includes('UNIQUE constraint failed') || error.message.includes('duplicate key')) {
      return NextResponse.json({ error: 'Eine Seite mit diesem Slug existiert bereits' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Seite' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const pageId = parseInt(id);

    if (isNaN(pageId)) {
      return NextResponse.json({ error: 'Ungültige Seiten-ID' }, { status: 400 });
    }

    // Prüfe ob die Seite existiert
    const existingPage = await getPageById(pageId);
    if (!existingPage) {
      return NextResponse.json({ error: 'Seite nicht gefunden' }, { status: 404 });
    }

    // Lösche erst alle Blöcke der Seite
    const deletedBlocksCount = await deleteAllBlocksForPage(pageId);

    // Dann lösche die Seite selbst
    const result = await deletePage(pageId);

    return NextResponse.json({
      success: true,
      message: 'Seite erfolgreich gelöscht',
      deletedBlocks: deletedBlocksCount
    });
  } catch (error) {
    console.error('❌ Error deleting page:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen der Seite' }, { status: 500 });
  }
}
