/**
 * POST /api/scrape/stop/:sessionId
 * 
 * Stops an active scraping session
 */

import { NextRequest, NextResponse } from 'next/server';
import { StopScrapeResponse } from '@/lib/scraper/types';
import { getSession, deleteSession } from '@/lib/scraper/sessionStore';
import { errorLogger, handleApiRoute } from '@/lib/scraper';
import { requireScraperAuth } from '@/lib/auth-middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  // Check authentication and authorization
  const authError = requireScraperAuth(request);
  if (authError) return authError;

  return handleApiRoute(async () => {
    const { sessionId } = await params;

    // Validate session exists
    const session = getSession(sessionId);
    if (!session) {
      errorLogger.logWarning('Stop requested for non-existent session', {
        sessionId,
        operation: 'stop_scrape'
      });
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const { orchestrator } = session;

    // Get current business count before stopping
    const businesses = orchestrator.getResults();
    const businessCount = businesses.length;

    // Stop the orchestrator (this will cleanup browser instances)
    await orchestrator.stop();

    // Remove session from store
    deleteSession(sessionId);

    // Return response
    const response: StopScrapeResponse = {
      status: 'stopped',
      businessesCollected: businessCount
    };

    return NextResponse.json(response, { status: 200 });
  }, '/api/scrape/stop/:sessionId', { sessionId: (await params).sessionId });
}
