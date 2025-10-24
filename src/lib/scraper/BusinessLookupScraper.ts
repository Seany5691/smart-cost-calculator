/**
 * BusinessLookupScraper - Scrapes business data from Google Maps for specific business queries
 * 
 * Handles both list view (multiple results) and details view (single business) scenarios.
 * Automatically detects which view Google Maps displays and applies appropriate extraction logic.
 */

import type { Page } from 'puppeteer-core';
import { Business } from './types';
import { RetryStrategy } from './RetryStrategy';
import { v4 as uuidv4 } from 'uuid';
import { errorLogger } from './ErrorLogger';

type ViewType = 'list' | 'details' | 'unknown';

export class BusinessLookupScraper {
  private page: Page;
  private businessQuery: string;
  private retryStrategy: RetryStrategy;

  constructor(page: Page, businessQuery: string) {
    this.page = page;
    this.businessQuery = businessQuery;
    this.retryStrategy = new RetryStrategy(3, 2000);
  }

  /**
   * Main scraping method that orchestrates the entire flow
   * @returns Array of Business objects (1 for details view, up to 3 for list view)
   */
  async scrape(): Promise<Business[]> {
    try {
      return await this.retryStrategy.execute(async () => {
        console.log(`[BusinessLookupScraper] Starting scrape for: ${this.businessQuery}`);
        
        // Navigate to Google Maps search
        const url = `https://www.google.com/maps/search/${encodeURIComponent(this.businessQuery)}`;
        
        console.log(`[BusinessLookupScraper] Navigating to: ${url}`);
        
        try {
          await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (error) {
          errorLogger.logError('Navigation to Google Maps failed', error, {
            operation: 'navigate_to_google_maps',
            query: this.businessQuery,
            url
          });
          throw error;
        }
        
        // Detect which view type Google Maps is showing
        const viewType = await this.detectViewType();
        
        console.log(`[BusinessLookupScraper] Detected view type: ${viewType}`);
        
        // Apply appropriate extraction strategy based on view type
        let businesses: Business[] = [];
        
        if (viewType === 'details') {
          const business = await this.extractFromDetailsView();
          if (business) {
            businesses = [business];
          } else {
            errorLogger.logError('Details view extraction returned null', undefined, {
              operation: 'extract_from_details_view',
              query: this.businessQuery,
              viewType: 'details'
            });
          }
        } else if (viewType === 'list') {
          businesses = await this.extractFromListView();
          if (businesses.length === 0) {
            errorLogger.logWarning('List view extraction returned no businesses', {
              operation: 'extract_from_list_view',
              query: this.businessQuery,
              viewType: 'list'
            });
          }
        } else {
          errorLogger.logError('Unknown view type detected', undefined, {
            operation: 'detect_view_type',
            query: this.businessQuery,
            viewType
          });
        }
        
        console.log(`[BusinessLookupScraper] Extracted ${businesses.length} businesses`);
        
        return businesses;
      });
    } catch (error) {
      errorLogger.logError('Business lookup scraping failed', error, {
        operation: 'scrape',
        query: this.businessQuery
      });
      throw error;
    }
  }

  /**
   * Detects whether Google Maps is showing list view or details view
   * @returns ViewType indicating the detected view
   */
  private async detectViewType(): Promise<ViewType> {
    try {
      console.log('[BusinessLookupScraper] Detecting view type...');
      
      // Wait for page to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for list view indicators
      let hasListView = false;
      try {
        hasListView = await this.page.evaluate(() => {
          // Look for business cards container (feed role) and business card elements
          const feed = document.querySelector('[role="feed"]');
          const businessCards = document.querySelectorAll('.Nv2PK');
          return feed !== null && businessCards.length > 0;
        });
      } catch (error) {
        errorLogger.logError('Failed to check for list view indicators', error, {
          operation: 'detect_view_type_list_check',
          query: this.businessQuery
        });
      }
      
      if (hasListView) {
        console.log('[BusinessLookupScraper] List view detected (found feed and business cards)');
        return 'list';
      }
      
      // Check for details view indicators
      let hasDetailsView = false;
      try {
        hasDetailsView = await this.page.evaluate(() => {
          // Look for details panel elements
          const detailsPanel = document.querySelector('[role="main"]');
          const businessName = document.querySelector('h1');
          
          return detailsPanel !== null && businessName !== null;
        });
      } catch (error) {
        errorLogger.logError('Failed to check for details view indicators', error, {
          operation: 'detect_view_type_details_check',
          query: this.businessQuery
        });
      }
      
      if (hasDetailsView) {
        console.log('[BusinessLookupScraper] Details view detected (found main panel and h1)');
        return 'details';
      }
      
      console.warn('[BusinessLookupScraper] Could not determine view type');
      errorLogger.logWarning('View type could not be determined', {
        operation: 'detect_view_type',
        query: this.businessQuery,
        hasListView,
        hasDetailsView
      });
      return 'unknown';
      
    } catch (error) {
      errorLogger.logError('View detection failed', error, {
        operation: 'detect_view_type',
        query: this.businessQuery
      });
      return 'unknown';
    }
  }

  /**
   * Extracts business data from Google Maps details view (single business page)
   * @returns Business object or null if extraction fails
   */
  private async extractFromDetailsView(): Promise<Business | null> {
    try {
      console.log('[BusinessLookupScraper] Extracting from details view...');
      
      // Extract business name (required field)
      const name = await this.extractNameFromDetails();
      if (!name) {
        console.warn('[BusinessLookupScraper] Could not extract business name, skipping');
        errorLogger.logError('Business name extraction returned empty', undefined, {
          operation: 'extract_from_details_view',
          query: this.businessQuery,
          viewType: 'details',
          field: 'name'
        });
        return null;
      }
      
      // Extract phone number
      const phone = await this.extractPhoneFromDetails();
      
      if (phone === 'No phone') {
        errorLogger.logWarning('No phone number found in details view', {
          operation: 'extract_from_details_view',
          query: this.businessQuery,
          viewType: 'details',
          businessName: name
        });
      }
      
      // Create business object
      const business: Business = {
        id: uuidv4(),
        maps_address: this.page.url(), // Current page URL
        name: name,
        phone: phone,
        provider: '', // Will be filled by ProviderLookupService
        address: '', // Not needed for business lookup feature
        type_of_business: '', // Not applicable for single business lookup
        town: '', // Extracted from query if needed
        notes: ''
      };
      
      console.log(`[BusinessLookupScraper] Successfully extracted business: ${name}`);
      
      return business;
      
    } catch (error) {
      errorLogger.logError('Details view extraction failed', error, {
        operation: 'extract_from_details_view',
        query: this.businessQuery,
        viewType: 'details'
      });
      return null;
    }
  }

  /**
   * Extracts business name from details view h1 element
   * @returns Business name or empty string if not found
   */
  private async extractNameFromDetails(): Promise<string> {
    try {
      const name = await this.page.$eval('h1', el => el.textContent?.trim() || '');
      
      if (name) {
        console.log(`[BusinessLookupScraper] Extracted name: ${name}`);
      } else {
        console.warn('[BusinessLookupScraper] Name element found but empty');
        errorLogger.logWarning('Name element found but contains no text', {
          operation: 'extract_name_from_details',
          query: this.businessQuery,
          viewType: 'details'
        });
      }
      
      return name;
      
    } catch (error) {
      errorLogger.logError('Name extraction failed - h1 element not found', error, {
        operation: 'extract_name_from_details',
        query: this.businessQuery,
        viewType: 'details'
      });
      return '';
    }
  }

  /**
   * Extracts phone number from details view using multiple strategies
   * @returns Phone number or "No phone" if not found
   */
  private async extractPhoneFromDetails(): Promise<string> {
    try {
      console.log('[BusinessLookupScraper] Attempting phone extraction...');
      
      // Strategy 1: Look for phone button/link with data-item-id attribute
      console.log('[BusinessLookupScraper] Strategy 1: Checking phone button aria-label...');
      try {
        const phoneButton = await this.page.$('[data-item-id*="phone"]');
        if (phoneButton) {
          const ariaLabel = await phoneButton.evaluate(el => el.getAttribute('aria-label'));
          if (ariaLabel) {
            // Extract phone from aria-label (e.g., "Phone: 012 345 6789")
            const phoneMatch = ariaLabel.match(/[\d\s\-\(\)\+]+/);
            if (phoneMatch) {
              const phone = phoneMatch[0].trim();
              console.log(`[BusinessLookupScraper] Strategy 1 success: ${phone}`);
              return phone;
            }
          }
        }
      } catch (error) {
        errorLogger.logError('Phone extraction strategy 1 failed', error, {
          operation: 'extract_phone_from_details',
          query: this.businessQuery,
          viewType: 'details',
          strategy: 1
        });
      }
      
      // Strategy 2: Search button text content for phone patterns
      console.log('[BusinessLookupScraper] Strategy 2: Searching button text content...');
      try {
        const phoneText = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          for (const button of buttons) {
            const text = button.textContent || '';
            // Match common phone patterns (e.g., 012 345 6789, 012-345-6789, (012) 345-6789)
            if (/\d{3}[\s\-]?\d{3}[\s\-]?\d{4}/.test(text)) {
              return text.trim();
            }
          }
          return '';
        });
        
        if (phoneText) {
          console.log(`[BusinessLookupScraper] Strategy 2 success: ${phoneText}`);
          return phoneText;
        }
      } catch (error) {
        errorLogger.logError('Phone extraction strategy 2 failed', error, {
          operation: 'extract_phone_from_details',
          query: this.businessQuery,
          viewType: 'details',
          strategy: 2
        });
      }
      
      // Strategy 3: Use tree walker to find phone in all text nodes
      console.log('[BusinessLookupScraper] Strategy 3: Using tree walker to search all text nodes...');
      try {
        const phoneFromText = await this.page.evaluate(() => {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null
          );
          
          let node;
          while (node = walker.nextNode()) {
            const text = node.textContent || '';
            // Match phone patterns
            const phoneMatch = text.match(/\d{3}[\s\-]?\d{3}[\s\-]?\d{4}/);
            if (phoneMatch) {
              return phoneMatch[0];
            }
          }
          return '';
        });
        
        if (phoneFromText) {
          console.log(`[BusinessLookupScraper] Strategy 3 success: ${phoneFromText}`);
          return phoneFromText;
        }
      } catch (error) {
        errorLogger.logError('Phone extraction strategy 3 failed', error, {
          operation: 'extract_phone_from_details',
          query: this.businessQuery,
          viewType: 'details',
          strategy: 3
        });
      }
      
      // No phone found with any strategy
      console.warn('[BusinessLookupScraper] No phone number found with any strategy');
      errorLogger.logWarning('All phone extraction strategies failed', {
        operation: 'extract_phone_from_details',
        query: this.businessQuery,
        viewType: 'details',
        strategiesAttempted: 3
      });
      return 'No phone';
      
    } catch (error) {
      errorLogger.logError('Phone extraction failed', error, {
        operation: 'extract_phone_from_details',
        query: this.businessQuery,
        viewType: 'details'
      });
      return 'No phone';
    }
  }

  /**
   * Extracts business data from list view (adapted from IndustryScraper)
   * Limits results to maximum 3 businesses as per requirements
   * @returns Array of Business objects (max 3)
   */
  private async extractFromListView(): Promise<Business[]> {
    console.log('[BusinessLookupScraper] Extracting from list view...');
    
    const businesses: Business[] = [];
    const processedUrls = new Set<string>(); // Prevent duplicates
    const MAX_RESULTS = 3; // Limit to 3 businesses (Requirement 5.1)
    
    try {
      // Wait for feed to be available
      try {
        await this.page.waitForSelector('[role="feed"]', { timeout: 10000 });
      } catch (error) {
        errorLogger.logError('Feed element not found in list view', error, {
          operation: 'extract_from_list_view',
          query: this.businessQuery,
          viewType: 'list',
          step: 'wait_for_feed'
        });
        throw error;
      }
      
      const feedSelector = '[role="feed"]';
      let hasMoreResults = true;
      
      while (hasMoreResults && businesses.length < MAX_RESULTS) {
        // Get all business cards currently visible
        const cards = await this.page.$$('[role="feed"] .Nv2PK');
        
        console.log(`[BusinessLookupScraper] Found ${cards.length} business cards`);
        
        // Extract data from each card
        for (const card of cards) {
          // Stop if we've reached the limit
          if (businesses.length >= MAX_RESULTS) {
            console.log(`[BusinessLookupScraper] Reached maximum of ${MAX_RESULTS} businesses`);
            break;
          }
          
          try {
            const business = await this.parseBusinessCard(card);
            
            // Skip if already processed (by URL) or missing name
            if (!business || !business.name || processedUrls.has(business.maps_address)) {
              continue;
            }
            
            processedUrls.add(business.maps_address);
            businesses.push(business);
            
            console.log(`[BusinessLookupScraper] Extracted business ${businesses.length}/${MAX_RESULTS}: ${business.name}`);
            
          } catch (error) {
            // Continue processing remaining cards when individual card parsing fails
            errorLogger.logError('Failed to parse business card', error, {
              operation: 'parse_business_card',
              query: this.businessQuery
            });
            // Continue with next card
          }
        }
        
        // Stop if we have enough results
        if (businesses.length >= MAX_RESULTS) {
          break;
        }
        
        // Check if we've reached the end
        hasMoreResults = !(await this.hasReachedEndOfList());
        
        if (hasMoreResults) {
          // Scroll down to load more results
          await this.page.evaluate((selector) => {
            const feed = document.querySelector(selector);
            if (feed) {
              feed.scrollTop = feed.scrollHeight;
            }
          }, feedSelector);
          
          // Wait for new content to load
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      
      console.log(`[BusinessLookupScraper] List view extraction complete: ${businesses.length} businesses`);
      
      return businesses;
      
    } catch (error) {
      errorLogger.logError('List view extraction failed', error, {
        operation: 'extract_from_list_view',
        query: this.businessQuery
      });
      return businesses; // Return partial results if available
    }
  }

  /**
   * Parses a single business card element to extract business data
   * Adapted from IndustryScraper.parseBusinessCard
   * @param card - The ElementHandle for the business card
   * @returns Business object or null if name is missing
   */
  private async parseBusinessCard(card: any): Promise<Business | null> {
    try {
      // Extract name from qBF1Pd element (REQUIRED - return null if missing)
      let name = '';
      try {
        name = await card.$eval(
          '.qBF1Pd',
          (el: Element) => el.textContent?.trim() || ''
        );
      } catch (error) {
        errorLogger.logError('Name extraction failed', error, {
          operation: 'extract_name',
          field: 'name',
          query: this.businessQuery
        });
      }
      
      // Return null if name is missing (Requirement 1.5)
      if (!name) {
        console.warn('[BusinessLookupScraper] Skipping business card with missing name');
        return null;
      }
      
      // Extract Google Maps URL from anchor tag (OPTIONAL - set to empty string if missing)
      let mapsUrl = '';
      try {
        mapsUrl = await card.$eval(
          'a[href*="/maps/place/"]',
          (el: Element) => el.getAttribute('href') || ''
        );
      } catch (error) {
        mapsUrl = '';
        errorLogger.logError('Maps URL extraction failed', error, {
          operation: 'extract_maps_url',
          field: 'maps_address',
          businessName: name,
          query: this.businessQuery
        });
      }
      
      // Get all W4Efsd info elements
      const infoElements = await card.$$('.W4Efsd');
      
      let phone = '';
      let address = '';
      
      // Process each W4Efsd container
      for (const infoEl of infoElements) {
        // Parse phone number (look for UsdlK class) (OPTIONAL - set to empty string if missing)
        try {
          const phoneSpan = await infoEl.$('.UsdlK').catch(() => null);
          if (phoneSpan) {
            const phoneText = await phoneSpan.evaluate((el: Element) => el.textContent?.trim() || '');
            if (phoneText && !phone) {
              phone = phoneText;
            }
          }
        } catch (error) {
          errorLogger.logError('Phone extraction failed', error, {
            operation: 'extract_phone',
            field: 'phone',
            businessName: name,
            query: this.businessQuery
          });
        }
        
        // Extract address from span elements
        try {
          const spans = await infoEl.$$('span');
          
          // Collect all span texts, checking if they contain UsdlK (phone) class
          for (const span of spans) {
            // Skip if this span contains the phone number (has UsdlK class)
            const hasPhoneClass = await span.evaluate((el: Element) => {
              return el.classList.contains('UsdlK') || el.querySelector('.UsdlK') !== null;
            });
            
            if (hasPhoneClass) {
              continue;
            }
            
            const spanText = await span.evaluate((el: Element) => el.textContent?.trim() || '');
            
            // Skip empty spans, separator characters, opening hours, ratings, and icons
            if (!spanText || 
                spanText === '·' || 
                spanText === '' || 
                this.isOpeningHours(spanText) ||
                this.looksLikeRating(spanText) ||
                this.looksLikePhoneNumber(spanText) ||
                spanText.toLowerCase().includes('open') ||
                spanText.toLowerCase().includes('close') ||
                spanText.toLowerCase().includes('wheelchair')) {
              continue;
            }
            
            // Check if this looks like a business type (first meaningful text)
            // Business types are usually short (1-3 words) and come first
            const isBusinessType = spanText.split(' ').length <= 3 && !address;
            
            // If we haven't found an address yet and this isn't a business type, it's likely the address
            if (!isBusinessType && !address) {
              // Address typically contains street indicators or is a location name
              const addressIndicators = ['street', 'ave', 'avenue', 'road', 'rd', 'drive', 'dr', 'lane', 'ln', 'way', 'blvd', 'boulevard'];
              const lowerText = spanText.toLowerCase();
              const hasAddressIndicator = addressIndicators.some(indicator => lowerText.includes(indicator));
              
              // If it has address indicators or is longer than typical business type, treat as address
              if (hasAddressIndicator || spanText.length > 10) {
                address = spanText;
                break;
              }
            }
          }
        } catch (error) {
          errorLogger.logError('Address extraction failed', error, {
            operation: 'extract_address',
            field: 'address',
            businessName: name,
            query: this.businessQuery
          });
        }
      }
      
      // Create business object with all fields (empty strings for missing optional fields)
      const business: Business = {
        id: uuidv4(),
        maps_address: mapsUrl,
        name: name,
        phone: phone,
        provider: '', // Will be filled by ProviderLookupService
        address: address,
        type_of_business: '', // Not applicable for business lookup
        town: '', // Could be extracted from query if needed
        notes: ''
      };
      
      return business;
      
    } catch (error) {
      errorLogger.logError('Business card parsing failed', error, {
        operation: 'parse_business_card_details',
        query: this.businessQuery
      });
      return null;
    }
  }

  /**
   * Checks if we've reached the end of the list
   * @returns true if end message is found, false otherwise
   */
  private async hasReachedEndOfList(): Promise<boolean> {
    try {
      const endMessage = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.some(el => 
          el.textContent?.includes("You've reached the end of the list.")
        );
      });
      
      return endMessage;
    } catch (error) {
      return false;
    }
  }

  /**
   * Helper to detect if text is opening hours information
   * @param text - The text to check
   * @returns true if text matches opening hours patterns
   */
  private isOpeningHours(text: string): boolean {
    const hoursPatterns = [
      /open/i,
      /close/i,
      /\d+:\d+/,
      /\d+\s*[ap]m/i,
      /24\s*hours/i
    ];
    
    return hoursPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Helper to detect if text looks like a phone number
   * @param text - The text to check
   * @returns true if text looks like a phone number
   */
  private looksLikePhoneNumber(text: string): boolean {
    // Check if text contains mostly digits and phone-like characters
    const phonePattern = /^[\d\s\-\(\)\+]+$/;
    const digitCount = (text.match(/\d/g) || []).length;
    
    // If it matches phone pattern and has at least 7 digits, it's likely a phone
    return phonePattern.test(text) && digitCount >= 7;
  }

  /**
   * Helper to detect if text looks like a rating
   * @param text - The text to check
   * @returns true if text looks like a rating (e.g., "4.5", "3.2 stars")
   */
  private looksLikeRating(text: string): boolean {
    // Check for patterns like "4.5", "3.2", or contains "star"
    const ratingPattern = /^\d+(\.\d+)?(\s*stars?)?$/i;
    const hasStarWord = /star/i.test(text);
    const isShortDecimal = /^\d\.\d$/.test(text);
    
    return ratingPattern.test(text) || hasStarWord || isShortDecimal;
  }
}
