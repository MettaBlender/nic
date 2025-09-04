import { NextResponse } from 'next/server';
import { getLayoutSettings, updateLayoutSettings } from '@/lib/database';

// Force dynamic API routes
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getLayoutSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Fehler beim Abrufen der Layout-Einstellungen:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Layout-Einstellungen' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const settings = await request.json();

    await updateLayoutSettings(settings);
    const updatedSettings = await getLayoutSettings();

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Layout-Einstellungen:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Layout-Einstellungen' }, { status: 500 });
  }
}
