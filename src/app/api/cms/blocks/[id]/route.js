import { NextResponse } from 'next/server';
import { updateBlock, deleteBlock } from '@/lib/database';

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const blockData = await request.json();

    // Validiere die Daten
    const validatedData = {
      content: blockData.content || '',
      position_x: parseFloat(blockData.position_x) || 0,
      position_y: parseFloat(blockData.position_y) || 0,
      width: parseFloat(blockData.width) || 20,
      height: parseFloat(blockData.height) || 20,
      rotation: parseFloat(blockData.rotation) || 0,
      scale_x: parseFloat(blockData.scale_x) || 1,
      scale_y: parseFloat(blockData.scale_y) || 1,
      z_index: parseInt(blockData.z_index) || 1,
      background_color: blockData.background_color || '#ffffff',
      text_color: blockData.text_color || '#000000',
      order_index: parseInt(blockData.order_index) || 0
    };

    await updateBlock(id, validatedData);
    const updatedBlock = { id: parseInt(id), ...validatedData, updated_at: new Date().toISOString() };

    return NextResponse.json(updatedBlock);
  } catch (error) {
    console.error('Error updating block:', error);
    return NextResponse.json({ error: 'Error updating block' }, { status: 500 });
  }
}export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    await deleteBlock(id);

    return NextResponse.json({ message: 'Block successfully deleted' });
  } catch (error) {
    console.error('Error deleting block:', error);
    return NextResponse.json({ error: 'Error deleting block' }, { status: 500 });
  }
}
