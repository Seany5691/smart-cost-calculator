import { NextRequest, NextResponse } from 'next/server';
import { supabaseHelpers } from '@/lib/supabase';
import { Item } from '@/lib/types';

export async function GET() {
  try {
    const items = await supabaseHelpers.getHardwareItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error reading hardware config from Supabase:', error);
    return NextResponse.json({ error: 'Failed to read hardware config' }, { status: 500 });
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
      locked: item.locked || false,
      isExtension: item.isExtension || false,
      isActive: true
    }));

    // Save to Supabase
    const savedItems = await supabaseHelpers.updateHardwareItems(validatedItems);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Hardware config updated successfully',
      data: savedItems
    });
  } catch (error) {
    console.error('Error writing hardware config to Supabase:', error);
    return NextResponse.json({ error: 'Failed to update hardware config' }, { status: 500 });
  }
} 