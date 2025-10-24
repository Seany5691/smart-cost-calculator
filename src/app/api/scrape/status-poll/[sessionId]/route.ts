/**
 * GET /api/scrape/status-poll/:sessionId
 * 
 * Returns current scraping status from Supabase (polling-based, works on Vercel)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScraperAuth } from '@/lib/auth-middleware';
import { getSession, getSessionBusinesses, getSessionLogs } from '@/lib/scraper/supabaseSessionStore';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  // Check authentication
  const authError = requireScraperAuth(request);
  if (authError) return authError;

  try {
    const { sessionId } = await params;

    // Get session from Supabase
    const session = await getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get businesses and logs
    const businesses = await getSessionBusinesses(sessionId);
    const logs = await getSessionLogs(sessionId);

    // Return current state
    return NextResponse.json({
      status: session.status,
      progress: session.progress,
      businesses,
      logs,
      completedAt: session.completedAt,
      errorMessage: session.errorMessage
    });

  } catch (error) {
    console.error('Error fetching session status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session status' },
      { status: 500 }
    );
  }
}
