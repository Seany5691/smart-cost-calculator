/**
 * Business Lookup API Endpoint
 * 
 * Handles business lookup requests from the BusinessLookup component.
 * Supports both list view (multiple results) and details view (single business) scenarios.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPuppeteer, getChromiumPath, getBrowserLaunchOptions } from '@/lib/scraper/browserConfig';
import { BusinessLookupScraper } from '@/lib/scraper/BusinessLookupScraper';
import { ProviderLookupService } from '@/lib/scraper/ProviderLookupService';
import { errorLogger } from '@/lib/scraper/ErrorLogger';
import { requireScraperAuth } from '@/lib/auth-middleware';
import type { Browser } from 'puppeteer-core';

/**
 * Request body type definition
 */
interface BusinessLookupRequest {
  businessQuery: string;
}

/**
 * Response type definition
 */
interface BusinessResult {
  name: string;
  phone: string;
  provider: string;
}

interface BusinessLookupResponse {
  results: BusinessResult[];
}

interface ErrorResponse {
  error: string;
}

/**
 * POST handler for business lookup
 * 
 * Subtask 4.1: Create API route file
 * Subtask 4.2: Implement request validation
 * Subtask 4.3: Implement browser lifecycle management
 * Subtask 4.4: Integrate scraper and provider lookup
 * Subtask 4.5: Implement error handling and responses
 */
export async function POST(request: NextRequest): Promise<NextResponse<BusinessLookupResponse | ErrorResponse>> {
  // Check authentication and authorization
  const authError = requireScraperAuth(request);
  if (authError) return authError;

  let browser: Browser | null = null;
  let body: BusinessLookupRequest | null = null;
  
  try {
    // Subtask 4.2: Parse JSON request body and validate businessQuery field
    try {
      body = await request.json() as BusinessLookupRequest;
    } catch (error) {
      errorLogger.logError('Failed to parse request body', error, {
        operation: 'business_lookup_api',
        step: 'parse_request'
      });
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { businessQuery } = body;
    
    // Subtask 4.2: Validate businessQuery exists and is non-empty string
    if (!businessQuery || typeof businessQuery !== 'string' || !businessQuery.trim()) {
      // Subtask 4.2: Return 400 error for invalid input
      errorLogger.logValidationError('businessQuery', businessQuery, 'Business query must be a non-empty string', {
        operation: 'business_lookup_api',
        step: 'validate_input'
      });
      return NextResponse.json(
        { error: 'Business query is required' },
        { status: 400 }
      );
    }
    
    console.log(`[BusinessLookup API] Starting lookup for: ${businessQuery}`);
    
    // Subtask 4.3: Launch Puppeteer browser with appropriate options
    const puppeteer = await getPuppeteer();
    const launchOptions = getBrowserLaunchOptions(true);
    const chromiumPath = await getChromiumPath();
    
    if (chromiumPath) {
      launchOptions.executablePath = chromiumPath;
    }
    
    console.log('[BusinessLookup API] Launching browser...');
    try {
      browser = await puppeteer.default.launch(launchOptions);
    } catch (error) {
      errorLogger.logBrowserError(error, {
        operation: 'business_lookup_api',
        query: businessQuery,
        step: 'launch_browser'
      });
      throw error;
    }
    
    // Subtask 4.3: Create new page for scraping
    const page = await browser.newPage();
    console.log('[BusinessLookup API] Browser launched successfully');
    
    // Subtask 4.4: Instantiate BusinessLookupScraper with page and query
    const scraper = new BusinessLookupScraper(page, businessQuery);
    
    // Subtask 4.4: Call scraper.scrape() to get businesses
    let businesses;
    try {
      businesses = await scraper.scrape();
      console.log(`[BusinessLookup API] Scraper returned ${businesses.length} businesses`);
    } catch (error) {
      errorLogger.logError('Scraping failed', error, {
        operation: 'business_lookup_api',
        query: businessQuery,
        step: 'scrape'
      });
      throw error;
    }
    
    // Subtask 4.4: Close browser before provider lookup
    console.log('[BusinessLookup API] Closing browser...');
    await browser.close();
    browser = null;
    console.log('[BusinessLookup API] Browser closed');
    
    // Subtask 4.4: Extract phone numbers from results
    const phoneNumbers = businesses
      .map(b => b.phone)
      .filter(phone => phone && phone !== 'No phone');
    
    console.log(`[BusinessLookup API] Extracted ${phoneNumbers.length} phone numbers for provider lookup`);
    
    // Subtask 4.4: Call ProviderLookupService with phone numbers
    if (phoneNumbers.length > 0) {
      try {
        const providerService = new ProviderLookupService({
          maxConcurrentBatches: 1,
          batchSize: phoneNumbers.length
        });
        
        const providerResults = await providerService.lookupProviders(phoneNumbers);
        await providerService.cleanup();
        
        // Subtask 4.4: Merge provider data back into business objects
        businesses.forEach(business => {
          if (business.phone && business.phone !== 'No phone') {
            business.provider = providerResults.get(business.phone) || 'Unknown';
          } else {
            business.provider = 'Unknown';
          }
        });
        
        console.log('[BusinessLookup API] Provider lookup completed');
      } catch (error) {
        errorLogger.logProviderLookupError('multiple', error, {
          operation: 'business_lookup_api',
          query: businessQuery,
          phoneCount: phoneNumbers.length
        });
        // Continue with Unknown providers on error
        businesses.forEach(business => {
          business.provider = 'Unknown';
        });
      }
    } else {
      // No valid phone numbers to lookup
      businesses.forEach(business => {
        business.provider = 'Unknown';
      });
      console.log('[BusinessLookup API] No phone numbers to lookup');
    }
    
    console.log(`[BusinessLookup API] Found ${businesses.length} businesses`);
    
    // Subtask 4.5: Return 200 with results array on success
    // Subtask 4.5: Return empty array when no businesses found
    return NextResponse.json({
      results: businesses.map(b => ({
        name: b.name,
        phone: b.phone,
        provider: b.provider
      }))
    });
    
  } catch (error) {
    // Subtask 4.5: Catch and log all errors with appropriate context
    console.error('[BusinessLookup API] Error:', error);
    
    // Determine error type for better logging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNavigationError = errorMessage.includes('Navigation') || errorMessage.includes('timeout');
    const isBrowserError = errorMessage.includes('browser') || errorMessage.includes('Browser');
    
    errorLogger.logError('Business lookup API failed', error, {
      operation: 'business_lookup_api',
      query: body?.businessQuery || 'unknown',
      errorType: isNavigationError ? 'navigation' : isBrowserError ? 'browser' : 'scraping'
    });
    
    // Subtask 4.5: Return 500 error for scraping failures
    return NextResponse.json(
      { error: 'Failed to lookup business information' },
      { status: 500 }
    );
    
  } finally {
    // Subtask 4.3: Ensure browser is closed in finally block
    if (browser) {
      try {
        console.log('[BusinessLookup API] Cleaning up browser in finally block...');
        await browser.close();
        console.log('[BusinessLookup API] Browser cleanup complete');
      } catch (e) {
        // Subtask 4.3: Handle browser launch errors
        console.error('[BusinessLookup API] Error closing browser:', e);
        errorLogger.logError('Failed to close browser', e, {
          operation: 'browser_cleanup'
        });
      }
    }
  }
}
