import { NextRequest, NextResponse } from 'next/server';
import { supabaseHelpers } from '@/lib/supabase';
import { Scales } from '@/lib/types';

export async function GET() {
  try {
    const scales = await supabaseHelpers.getScales();
    return NextResponse.json(scales);
  } catch (error) {
    console.error('Error reading scales config from Supabase:', error);
    return NextResponse.json({ error: 'Failed to read scales config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const scales: Scales = await request.json();
    
    // Validate the data
    if (!scales || typeof scales !== 'object') {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Save to Supabase
    const savedScales = await supabaseHelpers.updateScales(scales);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Scales config updated successfully',
      data: savedScales
    });
  } catch (error) {
    console.error('Error writing scales config to Supabase:', error);
    return NextResponse.json({ error: 'Failed to update scales config' }, { status: 500 });
  }
} 