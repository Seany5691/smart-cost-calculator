import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Scales } from '@/lib/types';

const configPath = path.join(process.cwd(), 'public', 'config', 'scales.json');

export async function GET() {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    const scales = JSON.parse(data);
    return NextResponse.json(scales);
  } catch (error) {
    console.error('Error reading scales config:', error);
    return NextResponse.json({ error: 'Failed to read scales config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const scales: Scales = await request.json();
    
    // Validate the data
    if (typeof scales !== 'object' || scales === null) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Write to file
    await fs.writeFile(configPath, JSON.stringify(scales, null, 2));
    
    return NextResponse.json({ success: true, message: 'Scales config updated successfully' });
  } catch (error) {
    console.error('Error writing scales config:', error);
    return NextResponse.json({ error: 'Failed to update scales config' }, { status: 500 });
  }
} 