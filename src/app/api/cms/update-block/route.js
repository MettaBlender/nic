import { NextResponse } from 'next/server';
import {updateBlockContent } from '@/lib/database';

export async function PUT(request) {
  try {
    const {content, id} = await request.json();

    await updateBlockContent(id, content);

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error updating block:', error);
    return NextResponse.json({ error: 'Error updating block' }, { status: 500 });
  }
}