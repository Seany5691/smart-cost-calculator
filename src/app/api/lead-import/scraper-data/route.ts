// API route for fetching scraper data from Smart Cost Calculator
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/import/scraper-data - Get available scraper sessions
export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false, data: null },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Fetch specific scraper session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('scraper_sessions')
        .select('*, scraper_results(*)')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (sessionError || !sessionData) {
        return NextResponse.json(
          { error: 'Scraper session not found', success: false, data: null },
          { status: 404 }
        );
      }

      return NextResponse.json({
        data: sessionData,
        success: true,
        error: null,
      });
    } else {
      // Fetch all scraper sessions for the user
      const { data: sessions, error: sessionsError } = await supabase
        .from('scraper_sessions')
        .select('id, created_at, status, total_results, search_query')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);

      if (sessionsError) {
        throw sessionsError;
      }

      return NextResponse.json({
        data: sessions || [],
        success: true,
        error: null,
      });
    }
  } catch (error) {
    console.error('Error fetching scraper data:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch scraper data',
        success: false,
        data: null,
      },
      { status: 500 }
    );
  }
}
