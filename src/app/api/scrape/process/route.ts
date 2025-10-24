/**
 * POST /api/scrape/process
 * 
 * Processes a single town/industry combination (serverless-friendly)
 * This endpoint is called repeatedly to process the queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScraperAuth } from '@/lib/auth-middleware';
import { getSession, updateSessionStatus, updateSessionProgress, addBusinesses, addLog } from '@/lib/scraper/supabaseSessionStore';
import { getPuppeteer, getChromiumPath, getBrowserLaunchOptions } from '@/lib/scraper/browserConfig';
import { IndustryScraper } from '@/lib/scraper/IndustryScraper';
import { ProviderLookupService } from '@/lib/scraper/ProviderLookupService';

export const maxDuration = 300; // 5 minutes max
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Check authentication
  const authError = requireScraperAuth(request);
  if (authError) return authError;

  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get session from Supabase
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session is still active
    if (session.status !== 'running' && session.status !== 'pending') {
      return NextResponse.json({ 
        status: session.status,
        message: 'Session not active'
      });
    }

    // Calculate what to process next
    const { towns, industries, progress } = session;
    const currentTownIndex = progress.completedTowns || 0;
    
    if (currentTownIndex >= towns.length) {
      // All done!
      await updateSessionStatus(sessionId, 'completed');
      await addLog(sessionId, {
        timestamp: new Date().toISOString(),
        message: `Scraping completed! Total businesses: ${progress.totalBusinesses}`,
        level: 'success'
      });
      
      return NextResponse.json({
        status: 'completed',
        progress: progress
      });
    }

    const currentTown = towns[currentTownIndex];
    
    await addLog(sessionId, {
      timestamp: new Date().toISOString(),
      message: `Processing town: ${currentTown} (${currentTownIndex + 1}/${towns.length})`,
      level: 'info'
    });

    // Update status to running
    if (session.status === 'pending') {
      await updateSessionStatus(sessionId, 'running');
    }

    // Process all industries for this town
    const townBusinesses: any[] = [];
    
    for (const industry of industries) {
      try {
        await addLog(sessionId, {
          timestamp: new Date().toISOString(),
          message: `Scraping ${industry} in ${currentTown}...`,
          level: 'info'
        });

        // Launch browser and scrape
        const puppeteer = await getPuppeteer();
        const launchOptions = getBrowserLaunchOptions(true);
        const chromiumPath = await getChromiumPath();
        
        if (chromiumPath) {
          launchOptions.executablePath = chromiumPath;
        }

        const browser = await puppeteer.default.launch(launchOptions);
        const page = await browser.newPage();

        const scraper = new IndustryScraper(page, currentTown, industry);
        const businesses = await scraper.scrape();

        await browser.close();

        // Lookup providers for phone numbers
        const phoneNumbers = businesses
          .map(b => b.phone)
          .filter(phone => phone && phone !== 'No phone');

        if (phoneNumbers.length > 0) {
          try {
            await addLog(sessionId, {
              timestamp: new Date().toISOString(),
              message: `Looking up providers for ${phoneNumbers.length} phone numbers...`,
              level: 'info'
            });

            const providerService = new ProviderLookupService({
              maxConcurrentBatches: 1,
              batchSize: phoneNumbers.length
            });

            const providerResults = await providerService.lookupProviders(phoneNumbers);
            await providerService.cleanup();

            // Debug: Log what's in the results map
            console.log('[Process] Provider results map keys:', Array.from(providerResults.keys()));
            console.log('[Process] Business phone numbers:', businesses.map(b => b.phone));
            
            // Debug: Log the actual provider values in the map
            const providerValues = Array.from(providerResults.entries());
            console.log('[Process] Provider map entries:', providerValues);
            
            await addLog(sessionId, {
              timestamp: new Date().toISOString(),
              message: `Debug - Map has ${providerResults.size} entries. Sample: ${providerValues.slice(0, 2).map(([k, v]) => `${k}=${v}`).join(', ')}`,
              level: 'info'
            });

            businesses.forEach(business => {
              if (business.phone && business.phone !== 'No phone') {
                const provider = providerResults.get(business.phone);
                console.log(`[Process] Mapping ${business.phone} -> ${provider || 'Unknown'}`);
                business.provider = provider || 'Unknown';
              } else {
                business.provider = 'Unknown';
              }
            });

            await addLog(sessionId, {
              timestamp: new Date().toISOString(),
              message: `Provider lookup completed: ${providerResults.size} providers found`,
              level: 'success'
            });
          } catch (providerError) {
            await addLog(sessionId, {
              timestamp: new Date().toISOString(),
              message: `Provider lookup failed: ${providerError instanceof Error ? providerError.message : 'Unknown error'}. Setting all to Unknown.`,
              level: 'warning'
            });
            
            // Set all providers to Unknown if lookup fails
            businesses.forEach(business => {
              business.provider = 'Unknown';
            });
          }
        } else {
          // No phone numbers to lookup
          businesses.forEach(business => {
            business.provider = 'Unknown';
          });
        }

        townBusinesses.push(...businesses);

        await addLog(sessionId, {
          timestamp: new Date().toISOString(),
          message: `Found ${businesses.length} businesses for ${industry} in ${currentTown}`,
          level: 'success'
        });

      } catch (error) {
        await addLog(sessionId, {
          timestamp: new Date().toISOString(),
          message: `Error scraping ${industry} in ${currentTown}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          level: 'error'
        });
      }
    }

    // Save businesses to Supabase
    if (townBusinesses.length > 0) {
      await addBusinesses(sessionId, townBusinesses);
    }

    // Update progress
    await updateSessionProgress(sessionId, {
      completedTowns: currentTownIndex + 1,
      totalBusinesses: (progress.totalBusinesses || 0) + townBusinesses.length
    });

    await addLog(sessionId, {
      timestamp: new Date().toISOString(),
      message: `Completed ${currentTown}: ${townBusinesses.length} businesses found`,
      level: 'success'
    });

    // Return status
    return NextResponse.json({
      status: 'running',
      progress: {
        completedTowns: currentTownIndex + 1,
        totalTowns: towns.length,
        totalBusinesses: (progress.totalBusinesses || 0) + townBusinesses.length
      },
      hasMore: currentTownIndex + 1 < towns.length
    });

  } catch (error) {
    console.error('Error processing scrape:', error);
    return NextResponse.json(
      { error: 'Failed to process scraping' },
      { status: 500 }
    );
  }
}
