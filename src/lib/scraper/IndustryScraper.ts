/**
 * IndustryScraper - Scrapes business data from Google Maps for a specific industry
 * 
 * Handles navigation, scrolling, and data extraction from Google Maps search results.
 */

import type { Page } from 'puppeteer-core';
import { Business } from './types';
import { RetryStrategy } from './RetryStrategy';
import { v4 as uuidv4 } from 'uuid';
import { errorLogger } from './ErrorLogger';

export class IndustryScraper {
  private page: Page;
  private town: string;
  private industry: string;
  private retryStrategy: RetryStrategy;

  constructor(page: Page, town: string, industry: string) {
    this.page = page;
    this.town = town;
    this.industry = industry;
    this.retryStrategy = new RetryStrategy(3, 2000);
  }

  /**
   * Scrapes all businesses for the configured town and industry
   * @returns Array of Business objects
   */
  async scrape(): Promise<Business[]> {
    return this.retryStrategy.execute(async () => {
      // Navigate to Google Maps search
      const searchQuery = `${this.industry} in ${this.town}`;
      const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      
      // Use 'networkidle2' for better reliability - wait until network is mostly idle
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Wait for results to load with longer timeout
      await this.page.waitForSelector('[role="feed"]', { timeout: 20000 });
      
      // Extract business data from list view (scrolling is integrated)
      const businesses = await this.extractFromListView();
      
      return businesses;
    });
  }



  /**
   * Extracts business data from list view while scrolling
   * Scrolls incrementally and parses cards until end of list
   * @returns Array of Business objects
   */
  private async extractFromListView(): Promise<Business[]> {
    const businesses: Business[] = [];
    const processedUrls = new Set<string>(); // Prevent duplicates
    
    const feedSelector = '[role="feed"]';
    let hasMoreResults = true;
    
    while (hasMoreResults) {
      // IMPORTANT: Use $$ (double dollar) to get ALL cards as an array
      // Select the Nv2PK parent divs which contain both the link and business details
      const cards = await this.page.$$('[role="feed"] .Nv2PK');
      
      // Extract data from each card
      for (const card of cards) {
        try {
          const business = await this.parseBusinessCard(card);
          
          // Skip if already processed (by URL) or missing name
          if (!business || !business.name || processedUrls.has(business.maps_address)) {
            continue;
          }
          
          processedUrls.add(business.maps_address);
          businesses.push(business);
          
        } catch (error) {
          // Continue processing remaining cards when individual card parsing fails (Requirement 6.5)
          errorLogger.logScrapingError(
            this.town,
            this.industry,
            error,
            { operation: 'parse_business_card' }
          );
          // Continue with next card
        }
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
    
    return businesses;
  }

  /**
   * Parses a single business card element to extract business data
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
        // Log error when name extraction fails
        errorLogger.logScrapingError(
          this.town,
          this.industry,
          error,
          { operation: 'extract_name', field: 'name' }
        );
      }
      
      // Return null if name is missing (Requirement 6.1)
      if (!name) {
        errorLogger.logWarning(
          `Skipping business card with missing name in ${this.town} - ${this.industry}`,
          { operation: 'parse_business_card', field: 'name', town: this.town, industry: this.industry }
        );
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
        // Handle missing maps URL by setting to empty string (Requirement 6.4)
        mapsUrl = '';
        errorLogger.logScrapingError(
          this.town,
          this.industry,
          error,
          { operation: 'extract_maps_url', field: 'maps_address', businessName: name }
        );
      }
      
      // IMPORTANT: Use $$ (double dollar) to get ALL W4Efsd elements as an array
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
          // Handle missing phone by setting to empty string (Requirement 6.2)
          errorLogger.logScrapingError(
            this.town,
            this.industry,
            error,
            { operation: 'extract_phone', field: 'phone', businessName: name }
          );
        }
        
        // IMPORTANT: Use $$ (double dollar) to get ALL span elements as an array
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
          // Handle missing address by setting to empty string (Requirement 6.3)
          errorLogger.logScrapingError(
            this.town,
            this.industry,
            error,
            { operation: 'extract_address', field: 'address', businessName: name }
          );
        }
      }
      
      // Create business object with all fields (empty strings for missing optional fields)
      // Always use the search industry as the type_of_business
      const business: Business = {
        id: uuidv4(),
        maps_address: mapsUrl,
        name: name,
        phone: phone,
        provider: '', // Will be filled by ProviderLookupService
        address: address,
        type_of_business: this.industry, // Always use the search industry
        town: this.town,
        notes: ''
      };
      
      return business;
      
    } catch (error) {
      // Log error with context and continue processing remaining cards (Requirement 6.5)
      errorLogger.logScrapingError(
        this.town,
        this.industry,
        error,
        { operation: 'parse_business_card_details' }
      );
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
