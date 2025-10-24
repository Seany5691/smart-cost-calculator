/**
 * BrowserWorker - Manages a Puppeteer browser instance for scraping a single town
 * 
 * Coordinates scraping across multiple industries with concurrency control.
 * Handles browser lifecycle and error recovery.
 */

import type { Browser, Page } from 'puppeteer-core';
import { EventEmitter } from 'events';
import { Business, ScrapingConfig } from './types';
import { IndustryScraper } from './IndustryScraper';
import { getBrowserLaunchOptions, getChromiumPath, getPuppeteer } from './browserConfig';
import { errorLogger } from './ErrorLogger';

export class BrowserWorker {
  private workerId: number;
  private config: ScrapingConfig;
  private eventEmitter: EventEmitter;
  private browser: Browser | null = null;
  private activeScrapes: number = 0;
  private maxConcurrentIndustries: number;

  constructor(
    workerId: number,
    config: ScrapingConfig,
    eventEmitter: EventEmitter
  ) {
    this.workerId = workerId;
    this.config = config;
    this.eventEmitter = eventEmitter;
    this.maxConcurrentIndustries = config.simultaneousIndustries;
  }

  /**
   * Processes all industries for a given town
   * @param town - Town name to scrape
   * @param industries - Array of industry names to scrape
   * @returns Array of all businesses found
   */
  async processTown(town: string, industries: string[]): Promise<Business[]> {
    console.log(`[Worker ${this.workerId}] processTown called for ${town} with ${industries.length} industries`);
    const allBusinesses: Business[] = [];

    try {
      // Initialize browser
      console.log(`[Worker ${this.workerId}] Calling initBrowser...`);
      await this.initBrowser();
      console.log(`[Worker ${this.workerId}] Browser initialized, starting industry scraping`);

      this.eventEmitter.emit('log', {
        level: 'info',
        message: `Worker ${this.workerId}: Starting scrape for ${town}`
      });

      // Process industries with concurrency control
      console.log(`[Worker ${this.workerId}] Processing ${industries.length} industries in batches of ${this.maxConcurrentIndustries}`);
      
      for (let i = 0; i < industries.length; i += this.maxConcurrentIndustries) {
        const industryBatch = industries.slice(i, i + this.maxConcurrentIndustries);
        console.log(`[Worker ${this.workerId}] Processing batch ${i / this.maxConcurrentIndustries + 1}: ${industryBatch.join(', ')}`);
        
        const batchPromises = industryBatch.map(industry =>
          this.scrapeIndustry(town, industry)
        );

        console.log(`[Worker ${this.workerId}] Waiting for batch to complete...`);
        const batchResults = await Promise.allSettled(batchPromises);
        console.log(`[Worker ${this.workerId}] Batch completed`);

        // Collect successful results
        for (let j = 0; j < batchResults.length; j++) {
          const result = batchResults[j];
          const industry = industryBatch[j];

          if (result.status === 'fulfilled') {
            allBusinesses.push(...result.value);
            
            this.eventEmitter.emit('log', {
              level: 'success',
              message: `Worker ${this.workerId}: ${town} - ${industry}: Found ${result.value.length} businesses`
            });
          } else {
            this.eventEmitter.emit('log', {
              level: 'error',
              message: `Worker ${this.workerId}: ${town} - ${industry}: Failed - ${result.reason}`
            });
          }
        }
      }

      console.log(`[Worker ${this.workerId}] processTown completed for ${town}, found ${allBusinesses.length} businesses`);
      
      this.eventEmitter.emit('log', {
        level: 'success',
        message: `Worker ${this.workerId}: Completed ${town} - Total: ${allBusinesses.length} businesses`
      });

      return allBusinesses;

    } catch (error) {
      console.error(`[Worker ${this.workerId}] processTown error for ${town}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log to ErrorLogger with context
      errorLogger.logBrowserError(error, {
        workerId: this.workerId,
        town,
        operation: 'process_town'
      });
      
      this.eventEmitter.emit('log', {
        level: 'error',
        message: `Worker ${this.workerId}: Failed to process ${town} - ${errorMessage}`
      });

      throw error;

    } finally {
      await this.cleanup();
    }
  }

  /**
   * Scrapes a single industry for a town
   * @param town - Town name
   * @param industry - Industry name
   * @returns Array of businesses found
   */
  private async scrapeIndustry(town: string, industry: string): Promise<Business[]> {
    console.log(`[Worker ${this.workerId}] scrapeIndustry called for ${town} - ${industry}`);
    this.activeScrapes++;

    try {
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      this.eventEmitter.emit('log', {
        level: 'info',
        message: `Worker ${this.workerId}: ${town} - ${industry}: Starting...`
      });

      // Create new page for this industry
      console.log(`[Worker ${this.workerId}] Creating new page for ${industry}...`);
      const page = await this.browser.newPage();
      console.log(`[Worker ${this.workerId}] Page created, starting scraper...`);

      try {
        // Create scraper and execute
        const scraper = new IndustryScraper(page, town, industry);
        console.log(`[Worker ${this.workerId}] Calling scraper.scrape()...`);
        const businesses = await scraper.scrape();
        console.log(`[Worker ${this.workerId}] Scraper completed, found ${businesses.length} businesses`);

        return businesses;

      } finally {
        await page.close();
      }

    } finally {
      this.activeScrapes--;
    }
  }

  /**
   * Initializes the browser
   */
  private async initBrowser(): Promise<void> {
    if (this.browser) {
      return; // Already initialized
    }

    console.log(`[Worker ${this.workerId}] Initializing browser...`);
    
    try {
      // Get Puppeteer instance (puppeteer-core for serverless, puppeteer for local)
      const puppeteer = await getPuppeteer();
      
      // Use optimized browser launch options for serverless environment
      const launchOptions = getBrowserLaunchOptions(this.config.browserHeadless);
      
      // Get Chromium path for serverless
      const chromiumPath = await getChromiumPath();
      if (chromiumPath) {
        launchOptions.executablePath = chromiumPath;
      }
      
      console.log(`[Worker ${this.workerId}] Launching chromium with options:`, launchOptions);
      
      this.browser = await puppeteer.default.launch(launchOptions);
      console.log(`[Worker ${this.workerId}] Browser launched successfully`);
    } catch (error) {
      console.error(`[Worker ${this.workerId}] Failed to initialize browser:`, error);
      throw error;
    }
  }

  /**
   * Cleans up browser resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.eventEmitter.emit('log', {
        level: 'info',
        message: `Worker ${this.workerId}: Browser cleaned up`
      });

    } catch (error) {
      errorLogger.logBrowserError(error, {
        workerId: this.workerId,
        operation: 'cleanup'
      });
      console.error(`Worker ${this.workerId}: Cleanup error:`, error);
    }
  }

  /**
   * Gets the number of active scrapes
   */
  getActiveScrapes(): number {
    return this.activeScrapes;
  }

  /**
   * Gets the worker ID
   */
  getWorkerId(): number {
    return this.workerId;
  }
}
