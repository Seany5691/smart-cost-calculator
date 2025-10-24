/**
 * POST /api/scrape/start
 * 
 * Initiates a new scraping session
 */

import { NextRequest, NextResponse } from 'next/server';
import { EventEmitter } from 'events';
import { ScrapingOrchestrator } from '@/lib/scraper/ScrapingOrchestrator';
import { StartScrapeRequest, StartScrapeResponse, ScrapingConfig } from '@/lib/scraper/types';
import { randomUUID } from 'crypto';
import { setSession } from '@/lib/scraper/sessionStore';
import { errorLogger } from '@/lib/scraper/ErrorLogger';
import { requireScraperAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  // Check authentication and authorization
  const authError = requireScraperAuth(request);
  if (authError) return authError;

  try {
    // Parse request body
    const body: StartScrapeRequest = await request.json();

    // Validate request body
    if (!body.towns || !Array.isArray(body.towns) || body.towns.length === 0) {
      errorLogger.logValidationError('towns', body.towns, 'At least one town is required', {
        operation: 'start_scrape'
      });
      return NextResponse.json(
        { error: 'At least one town is required' },
        { status: 400 }
      );
    }

    if (!body.industries || !Array.isArray(body.industries) || body.industries.length === 0) {
      errorLogger.logValidationError('industries', body.industries, 'At least one industry is required', {
        operation: 'start_scrape'
      });
      return NextResponse.json(
        { error: 'At least one industry is required' },
        { status: 400 }
      );
    }

    if (!body.config) {
      errorLogger.logValidationError('config', body.config, 'Configuration is required', {
        operation: 'start_scrape'
      });
      return NextResponse.json(
        { error: 'Configuration is required' },
        { status: 400 }
      );
    }

    // Validate concurrency settings
    const { simultaneousTowns, simultaneousIndustries, simultaneousLookups } = body.config;

    if (simultaneousTowns < 1 || simultaneousTowns > 5) {
      return NextResponse.json(
        { error: 'simultaneousTowns must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (simultaneousIndustries < 1 || simultaneousIndustries > 10) {
      return NextResponse.json(
        { error: 'simultaneousIndustries must be between 1 and 10' },
        { status: 400 }
      );
    }

    if (simultaneousLookups < 1 || simultaneousLookups > 20) {
      return NextResponse.json(
        { error: 'simultaneousLookups must be between 1 and 20' },
        { status: 400 }
      );
    }

    // Trim whitespace from towns
    const cleanedTowns = body.towns.map(town => town.trim()).filter(town => town.length > 0);

    if (cleanedTowns.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid town is required after trimming' },
        { status: 400 }
      );
    }

    // Create full scraping config with defaults
    const config: ScrapingConfig = {
      simultaneousTowns: body.config.simultaneousTowns,
      simultaneousIndustries: body.config.simultaneousIndustries,
      simultaneousLookups: body.config.simultaneousLookups,
      retryAttempts: 3,
      retryDelay: 2000,
      browserHeadless: true,
      lookupBatchSize: 5,
      outputFolder: 'output'
    };

    // Generate unique session ID
    const sessionId = randomUUID();

    // Create event emitter for this session
    const eventEmitter = new EventEmitter();

    // Create scraping orchestrator
    const orchestrator = new ScrapingOrchestrator(
      cleanedTowns,
      body.industries,
      config,
      eventEmitter
    );

    // Store session in memory
    setSession(sessionId, {
      orchestrator,
      eventEmitter,
      createdAt: Date.now()
    });

    // Start scraping in background (don't await)
    orchestrator.start().catch(error => {
      errorLogger.logError(`Scraping session ${sessionId} failed`, error, {
        sessionId,
        operation: 'orchestrator_background_start',
        towns: cleanedTowns,
        industries: body.industries
      });
      console.error(`[CRITICAL] Scraping session ${sessionId} failed:`, error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Emit error event so client knows
      eventEmitter.emit('error', {
        error: error instanceof Error ? error.message : String(error)
      });
      // Session will remain in memory for status queries
    });
    
    // Log that we're starting
    console.log(`[INFO] Scraping session ${sessionId} started for ${cleanedTowns.length} town(s) and ${body.industries.length} industry(ies)`);

    // Return session ID immediately
    const response: StartScrapeResponse = {
      sessionId,
      status: 'started'
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    errorLogger.logApiError('/api/scrape/start', error, {
      operation: 'start_scrape_request'
    });
    console.error('Error starting scraping session:', error);
    return NextResponse.json(
      { error: 'Failed to start scraping session' },
      { status: 500 }
    );
  }
}
