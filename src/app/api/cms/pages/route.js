import { NextResponse } from 'next/server';
import { getPages, createPage } from '@/lib/database';

export async function GET() {
  try {
    const pages = await getPages();
    return NextResponse.json(pages);
  } catch (error) {
    console.error('Fehler beim Abrufen der Seiten:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Seiten' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, slug } = await request.json();

    if (!title || !slug) {
      return NextResponse.json({ error: 'Titel und Slug sind erforderlich' }, { status: 400 });
    }

    const pageId = await createPage(title, slug);
    const newPage = { id: pageId, title, slug, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

    return NextResponse.json(newPage, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen der Seite:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Eine Seite mit diesem Slug existiert bereits' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Fehler beim Erstellen der Seite' }, { status: 500 });
  }
}
