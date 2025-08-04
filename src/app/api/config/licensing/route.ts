import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Item } from '@/lib/types';

const configPath = path.join(process.cwd(), 'public', 'config', 'licensing.json');

export async function GET() {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    const items = JSON.parse(data);
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error reading licensing config:', error);
    return NextResponse.json({ error: 'Failed to read licensing config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const items: Item[] = await request.json();
    
    // Validate the data
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Ensure all items have required fields
    const validatedItems = items.map(item => ({
      ...item,
      quantity: 0, // Reset quantities when saving
      locked: item.locked || false
    }));

    // Write to file
    await fs.writeFile(configPath, JSON.stringify(validatedItems, null, 2));
    
    return NextResponse.json({ success: true, message: 'Licensing config updated successfully' });
  } catch (error) {
    console.error('Error writing licensing config:', error);
    return NextResponse.json({ error: 'Failed to update licensing config' }, { status: 500 });
  }
} 