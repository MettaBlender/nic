import { NextResponse } from 'next/server';
import {updateBlockContent } from '@/lib/database';

export async function PUT(request) {
  try {
    const {content, id} = await request.json();

    await updateBlockContent(id, content);

    return NextResponse.json(content);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Blocks:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Blocks' }, { status: 500 });
  }
}