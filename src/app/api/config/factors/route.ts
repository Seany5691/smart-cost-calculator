import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { FactorData } from '@/lib/types';

const configPath = path.join(process.cwd(), 'public', 'config', 'factors.json');

export async function GET() {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    const factors = JSON.parse(data);
    return NextResponse.json(factors);
  } catch (error) {
    console.error('Error reading factors config:', error);
    return NextResponse.json({ error: 'Failed to read factors config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const factors: FactorData = await request.json();
    
    // Validate the data
    if (typeof factors !== 'object' || factors === null) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Write to file
    await fs.writeFile(configPath, JSON.stringify(factors, null, 2));
    
    return NextResponse.json({ success: true, message: 'Factors config updated successfully' });
  } catch (error) {
    console.error('Error writing factors config:', error);
    return NextResponse.json({ error: 'Failed to update factors config' }, { status: 500 });
  }
} 