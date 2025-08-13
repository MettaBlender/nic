import { NextResponse } from 'next/server';
import { getDb } from '@/lib/database';

export async function GET() {
  try {
    // Datenbank initialisieren
    const db = await getDb();

    // Prüfe ob Tabellen existieren
    const tables = await db.all(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name IN ('pages', 'blocks', 'layout_settings')
    `);

    return NextResponse.json({
      success: true,
      message: 'Datenbank erfolgreich initialisiert',
      tables: tables.map(t => t.name)
    });
  } catch (error) {
    console.error('Fehler bei der Datenbankinitialisierung:', error);
    return NextResponse.json({
      error: 'Fehler bei der Datenbankinitialisierung',
      details: error.message
    }, { status: 500 });
  }
}
