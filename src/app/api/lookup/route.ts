import { NextRequest, NextResponse } from 'next/server';
import { ProviderLookupService } from '@/lib/scraper/ProviderLookupService';
import { requireScraperAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  // Check authentication and authorization
  const authError = requireScraperAuth(request);
  if (authError) return authError;

  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Normalize phone number
    let normalized = phoneNumber.replace(/\s+/g, ''); // Remove spaces
    
    // Convert +27 or 27 to 0
    if (normalized.startsWith('+27')) {
      normalized = '0' + normalized.substring(3);
    } else if (normalized.startsWith('27') && normalized.length > 10) {
      normalized = '0' + normalized.substring(2);
    }

    // Lookup provider
    const lookupService = new ProviderLookupService({
      maxConcurrentBatches: 1,
      batchSize: 1,
    });

    const results = await lookupService.lookupProviders([normalized]);
    await lookupService.cleanup();

    const provider = results.get(normalized) || 'Unknown';

    return NextResponse.json({
      phoneNumber: normalized,
      provider,
    });
  } catch (error) {
    console.error('Provider lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup provider' },
      { status: 500 }
    );
  }
}
