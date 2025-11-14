import { NextRequest, NextResponse } from 'next/server';
import { storage, STORAGE_KEYS } from '@/lib/leads/localStorage';
import { LeadInteraction } from '@/lib/leads/types';

// GET /api/leads/[id]/interactions - Get all interactions for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    
    // Get all interactions from localStorage
    const allInteractions = storage.get<LeadInteraction[]>(STORAGE_KEYS.INTERACTIONS) || [];
    
    // Filter interactions for this lead
    const leadInteractions = allInteractions
      .filter(interaction => interaction.lead_id === leadId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return NextResponse.json({
      data: leadInteractions,
      success: true,
      error: null
    });
  } catch (error: any) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      {
        data: null,
        success: false,
        error: error.message || 'Failed to fetch interactions'
      },
      { status: 500 }
    );
  }
}
