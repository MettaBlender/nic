import { getDb } from '../../../../lib/database.js';

export async function POST(request) {
  try {
    const { pageId, timestamp } = await request.json();
    
    if (!pageId) {
      return Response.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const db = await getDb();

    // Erstelle oder aktualisiere den Veröffentlichungsstatus
    await db`
      INSERT INTO published_pages (page_id, published_at, published_by)
      VALUES (${pageId}, ${timestamp}, 'admin')
      ON CONFLICT (page_id) 
      DO UPDATE SET 
        published_at = ${timestamp},
        published_by = 'admin'
    `;

    return Response.json({ 
      success: true, 
      message: 'Page successfully published online',
      publishedAt: timestamp 
    });

  } catch (error) {
    console.error('Database error:', error);
    return Response.json({ error: 'Failed to publish page' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return Response.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const db = await getDb();

    // Hole den Veröffentlichungsstatus
    const publishStatus = await db`
      SELECT published_at, published_by 
      FROM published_pages 
      WHERE page_id = ${pageId}
    `;

    return Response.json({ 
      isPublished: publishStatus.length > 0,
      publishedAt: publishStatus[0]?.published_at || null,
      publishedBy: publishStatus[0]?.published_by || null
    });

  } catch (error) {
    console.error('Database error:', error);
    return Response.json({ error: 'Failed to get publish status' }, { status: 500 });
  }
}
