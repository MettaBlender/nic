import { NextResponse } from 'next/server';
import { getPage, updatePage, deletePage } from '@/lib/database';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const page = await getPage(id);

    if (!page) {
      return NextResponse.json({ error: 'Seite nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('Fehler beim Abrufen der Seite:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Seite' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { title, slug } = await request.json();

    if (!title || !slug) {
      return NextResponse.json({ error: 'Titel und Slug sind erforderlich' }, { status: 400 });
    }

    await updatePage(id, title, slug);
    const updatedPage = await getPage(id);

    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Seite:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Eine Seite mit diesem Slug existiert bereits' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Seite' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    await deletePage(id);

    return NextResponse.json({ message: 'Seite erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Seite:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen der Seite' }, { status: 500 });
  }
}
