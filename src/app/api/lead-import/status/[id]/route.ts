// API route for checking import session status
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateUUID } from '@/lib/leads/validation';

// GET /api/import/status/[id] - Get import session status and progress
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate UUID format
    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid import session ID format', success: false, data: null },
        { status: 400 }
      );
    }

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false, data: null },
        { status: 401 }
      );
    }

    // Fetch import session
    const { data: importSession, error } = await supabase
      .from('import_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !importSession) {
      return NextResponse.json(
        { error: 'Import session not found', success: false, data: null },
        { status: 404 }
      );
    }

    // Calculate progress percentage
    const progress = importSession.total_records > 0
      ? Math.round((importSession.imported_records / importSession.total_records) * 100)
      : 0;

    // Return session with progress information
    return NextResponse.json({
      data: {
        ...importSession,
        progress,
        isComplete: importSession.status === 'completed' || importSession.status === 'failed',
      },
      success: true,
      error: null,
    });
  } catch (error) {
    console.error('Error fetching import status:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch import status',
        success: false,
        data: null,
      },
      { status: 500 }
    );
  }
}
