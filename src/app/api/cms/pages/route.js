import { NextResponse } from 'next/server';
import { getPages, createPage } from '@/lib/database';

// Force dynamic API routes
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pages = await getPages();

    // Stelle sicher, dass mindestens eine Home-Seite existiert
    if (pages.length === 0) {
      const homePageId = await createPage('Home', 'home');
      const homePage = {
        id: homePageId,
        title: 'Home',
        slug: 'home',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return NextResponse.json([homePage]);
    }

    return NextResponse.json(pages);
  } catch (error) {
    console.error('❌ Error loading pages:', error);
    return NextResponse.json({ error: 'Error retrieving pages' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, slug } = await request.json();

    if (!title || !slug) {
      return NextResponse.json({ error: 'Titel und Slug sind erforderlich' }, { status: 400 });
    }

    const pageId = await createPage(title, slug);
    const newPage = {
      id: pageId,
      title,
      slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(newPage, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating page:', error);
    if (error.message.includes('UNIQUE constraint failed') || error.message.includes('duplicate key')) {
      return NextResponse.json({ error: 'A page with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error creating page' }, { status: 500 });
  }
}
