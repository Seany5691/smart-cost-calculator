import { NextRequest, NextResponse } from 'next/server';
import { supabaseHelpers } from '@/lib/supabase';
import { Item } from '@/lib/types';

export async function GET() {
  try {
    const items = await supabaseHelpers.getConnectivityItems();
    
    // Ensure numeric values are properly converted from strings if needed
    const processedItems = items?.map(item => ({
      ...item,
      cost: typeof item.cost === 'string' ? parseFloat(item.cost) : item.cost,
      managerCost: typeof item.managerCost === 'string' ? parseFloat(item.managerCost) : item.managerCost,
      userCost: typeof item.userCost === 'string' ? parseFloat(item.userCost) : item.userCost,
      quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity
    })) || [];
    
    return NextResponse.json(processedItems);
  } catch (error) {
    console.error('Error reading connectivity config from Supabase:', error);
    return NextResponse.json({ error: 'Failed to read connectivity config' }, { status: 500 });
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
      isActive: true
    }));

    // Save to Supabase
    const savedItems = await supabaseHelpers.updateConnectivityItems(validatedItems);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Connectivity config updated successfully',
      data: savedItems
    });
  } catch (error) {
    console.error('Error writing connectivity config to Supabase:', error);
    return NextResponse.json({ error: 'Failed to update connectivity config' }, { status: 500 });
  }
} 