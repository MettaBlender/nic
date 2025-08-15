import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

export async function POST(request) {
  try {
    // Published Pages Tabelle erstellen
    await sql`
      CREATE TABLE IF NOT EXISTS published_pages (
        page_id INTEGER PRIMARY KEY REFERENCES pages(id) ON DELETE CASCADE,
        published_at TIMESTAMP NOT NULL,
        published_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return Response.json({ 
      success: true, 
      message: 'Published pages table created successfully' 
    });

  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ error: 'Migration failed' }, { status: 500 });
  }
}
