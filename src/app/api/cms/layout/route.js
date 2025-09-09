import { NextResponse } from 'next/server';
import { getLayoutSettings, updateLayoutSettings } from '@/lib/database';

// Force dynamic API routes
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getLayoutSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching layout settings:', error);
    return NextResponse.json({ error: 'Error fetching layout settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const settings = await request.json();
    console.log('🎨 API: Received layout settings update:', settings);

    // Validiere die Eingabedaten
    if (!settings || typeof settings !== 'object') {
      console.error('❌ Invalid layout settings provided:', settings);
      return NextResponse.json({ error: 'Ungültige Layout-Einstellungen' }, { status: 400 });
    }

    // Validiere einzelne Felder
    const allowedFields = ['header_component', 'footer_component', 'background_color', 'background_image', 'primary_color', 'secondary_color'];
    const sanitizedSettings = {};

    Object.keys(settings).forEach(key => {
      if (allowedFields.includes(key)) {
        sanitizedSettings[key] = settings[key];
      }
    });

    if (Object.keys(sanitizedSettings).length === 0) {
      console.warn('⚠️ No valid layout settings provided');
      return NextResponse.json({ error: 'Keine gültigen Layout-Einstellungen gefunden' }, { status: 400 });
    }

    console.log('📝 Sanitized layout settings:', sanitizedSettings);

    await updateLayoutSettings(sanitizedSettings);
    const updatedSettings = await getLayoutSettings();

    console.log('✅ Layout settings updated successfully:', updatedSettings);
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('❌ Error updating layout settings:', error);
    return NextResponse.json({ error: 'Error updating layout settings' }, { status: 500 });
  }
}
