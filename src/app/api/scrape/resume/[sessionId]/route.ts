/**
 * POST /api/scrape/resume/:sessionId
 * 
 * Resumes a paused scraping session
 */

import { NextRequest, NextResponse } from 'next/server';
import { ResumeScrapeResponse } from '@/lib/scraper/types';
import { getSession } from '@/lib/scraper/sessionStore';
import { requireScraperAuth } from '@/lib/auth-middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  // Check authentication and authorization
  const authError = requireScraperAuth(request);
  if (authError) return authError;

  try {
    const { sessionId } = await params;

    // Validate session exists
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const { orchestrator } = session;

    // Resume the orchestrator
    orchestrator.resume();

    // Return response
    const response: ResumeScrapeResponse = {
      status: 'resumed'
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error resuming scraping session:', error);
    return NextResponse.json(
      { error: 'Failed to resume scraping session' },
      { status: 500 }
    );
  }
}
