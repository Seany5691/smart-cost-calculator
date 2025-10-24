/**
 * POST /api/scrape/pause/:sessionId
 * 
 * Pauses an active scraping session
 */

import { NextRequest, NextResponse } from 'next/server';
import { PauseScrapeResponse } from '@/lib/scraper/types';
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

    // Pause the orchestrator
    orchestrator.pause();

    // Return response
    const response: PauseScrapeResponse = {
      status: 'paused'
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error pausing scraping session:', error);
    return NextResponse.json(
      { error: 'Failed to pause scraping session' },
      { status: 500 }
    );
  }
}
