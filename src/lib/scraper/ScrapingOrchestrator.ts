/**
 * ScrapingOrchestrator - Coordinates multi-town, multi-industry scraping operations
 * 
 * Manages worker pool, distributes work, aggregates results, and handles control signals.
 * Emits progress events for real-time UI updates.
 */

import { EventEmitter } from 'events';
import { Business, ScrapingConfig, ProgressState } from './types';
import { BrowserWorker } from './BrowserWorker';
import { ProviderLookupService } from './ProviderLookupService';
import { LoggingManager } from './LoggingManager';
import { errorLogger } from './ErrorLogger';

export class ScrapingOrchestrator {
  private towns: string[];
  private industries: string[];
  private config: ScrapingConfig;
  private eventEmitter: EventEmitter;
  private loggingManager: LoggingManager;
  private providerLookupService: ProviderLookupService;
  
  private allBusinesses: Business[] = [];
  private progressState: ProgressState;
  private status: 'idle' | 'running' | 'paused' | 'stopped' = 'idle';
  private workers: BrowserWorker[] = [];
  private townQueue: string[] = [];
  private activeTowns: Set<string> = new Set();

  constructor(
    towns: string[],
    industries: string[],
    config: ScrapingConfig,
    eventEmitter: EventEmitter
  ) {
    this.towns = towns;
    this.industries = industries;
    this.config = config;
    this.eventEmitter = eventEmitter;
    
    this.loggingManager = new LoggingManager(eventEmitter);
    
    this.providerLookupService = new ProviderLookupService({
      maxConcurrentBatches: config.simultaneousLookups,
      batchSize: config.lookupBatchSize
    });

    this.progressState = {
      totalTowns: towns.length,
      completedTowns: 0,
      totalIndustries: towns.length * industries.length,
      completedIndustries: 0,
      totalBusinesses: 0,
      startTime: Date.now(),
      townCompletionTimes: []
    };

    this.townQueue = [...towns];
  }

  /**
   * Starts the scraping operation
   */
  async start(): Promise<void> {
    console.log('[Orchestrator] start() called');
    
    if (this.status === 'running') {
      throw new Error('Scraping is already running');
    }

    this.status = 'running';
    console.log('[Orchestrator] Status set to running');
    
    this.loggingManager.logMessage('Starting scraping session...');
    this.emitProgress();

    try {
      // Create worker pool
      const workerCount = Math.min(this.config.simultaneousTowns, this.towns.length);
      
      console.log(`[Orchestrator] Creating ${workerCount} workers for ${this.towns.length} towns`);
      this.loggingManager.logMessage(`Initializing ${workerCount} workers...`);

      // Process towns with worker pool
      const workerPromises: Promise<void>[] = [];

      for (let i = 0; i < workerCount; i++) {
        console.log(`[Orchestrator] Starting worker ${i}`);
        workerPromises.push(this.runWorker(i));
      }

      console.log('[Orchestrator] Waiting for all workers to complete...');
      // Wait for all workers to complete
      await Promise.all(workerPromises);
      console.log('[Orchestrator] All workers completed');
      console.log(`[Orchestrator] Total businesses collected: ${this.allBusinesses.length}`);

      // Check if stopped
      if (this.status === 'stopped') {
        console.log('[Orchestrator] Status is stopped, emitting complete');
        this.loggingManager.logMessage('Scraping stopped by user');
        this.emitComplete();
        return;
      }

      // Perform provider lookups
      console.log('[Orchestrator] Starting provider lookups...');
      await this.performProviderLookups();
      console.log('[Orchestrator] Provider lookups completed');

      // Mark as completed
      this.status = 'idle';
      console.log('[Orchestrator] Status set to idle, emitting complete event');
      this.loggingManager.logMessage(
        `Scraping completed! Total businesses: ${this.allBusinesses.length}`
      );
      
      console.log('[Orchestrator] Calling emitComplete()');
      this.emitComplete();
      console.log('[Orchestrator] emitComplete() called');

    } catch (error) {
      this.status = 'idle';
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log to ErrorLogger with full context
      errorLogger.logError('Orchestrator failed', error, {
        operation: 'orchestrator_start',
        totalTowns: this.towns.length,
        totalIndustries: this.industries.length
      });
      
      this.loggingManager.logError('System', 'Orchestrator', errorMessage);
      this.emitError(errorMessage);
      throw error;
    }
  }

  /**
   * Runs a single worker that processes towns from the queue
   * @param workerId - Worker identifier
   */
  private async runWorker(workerId: number): Promise<void> {
    console.log(`[Worker ${workerId}] Starting, queue has ${this.townQueue.length} towns`);
    
    const worker = new BrowserWorker(workerId, this.config, this.eventEmitter);
    this.workers.push(worker);

    while (this.townQueue.length > 0 && this.status === 'running') {
      // Get next town from queue
      const town = this.townQueue.shift();
      if (!town) break;

      console.log(`[Worker ${workerId}] Processing town: ${town}`);
      
      this.activeTowns.add(town);
      this.loggingManager.logTownStart(town);

      const townStartTime = Date.now();

      try {
        // Process town with all industries
        const businesses = await worker.processTown(town, this.industries);

        // Add to results
        this.allBusinesses.push(...businesses);

        // Update progress
        const townDuration = Date.now() - townStartTime;
        this.progressState.completedTowns++;
        this.progressState.completedIndustries += this.industries.length;
        this.progressState.totalBusinesses = this.allBusinesses.length;
        this.progressState.townCompletionTimes.push(townDuration);

        this.loggingManager.logTownComplete(town, businesses.length, townDuration);
        this.emitProgress();

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Log to ErrorLogger with context
        errorLogger.logScrapingError(town, 'All Industries', error, {
          workerId,
          operation: 'process_town_industries'
        });
        
        this.loggingManager.logError(town, 'All Industries', errorMessage);
        
        // Continue with next town even if this one failed
        this.progressState.completedTowns++;
        this.emitProgress();
      } finally {
        this.activeTowns.delete(town);
      }

      // Handle pause
      while (this.status === 'paused') {
        await this.sleep(1000);
      }

      // Handle stop
      if (this.status === 'stopped') {
        break;
      }
    }

    // Cleanup worker
    await worker.cleanup();
  }

  /**
   * Performs provider lookups for all collected phone numbers
   */
  private async performProviderLookups(): Promise<void> {
    const businessesWithPhones = this.allBusinesses.filter(b => b.phone && b.phone.trim() !== '');
    
    if (businessesWithPhones.length === 0) {
      this.loggingManager.logMessage('No phone numbers to lookup');
      return;
    }

    this.loggingManager.logMessage(
      `Starting provider lookups for ${businessesWithPhones.length} phone numbers...`
    );

    try {
      const phoneNumbers = businessesWithPhones.map(b => b.phone);
      const providerMap = await this.providerLookupService.lookupProviders(phoneNumbers);

      // Update businesses with provider information
      for (const business of businessesWithPhones) {
        const provider = providerMap.get(business.phone);
        if (provider) {
          business.provider = provider;
        } else {
          business.provider = 'Unknown';
        }
      }

      this.loggingManager.logMessage(
        `Provider lookups completed. Found ${providerMap.size} providers.`
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log to ErrorLogger
      errorLogger.logError('Provider lookup failed', error, {
        operation: 'provider_lookup_batch',
        phoneCount: businessesWithPhones.length
      });
      
      this.loggingManager.logError('System', 'Provider Lookup', errorMessage);
      
      // Set all providers to Unknown on failure
      for (const business of businessesWithPhones) {
        if (!business.provider) {
          business.provider = 'Unknown';
        }
      }
    } finally {
      await this.providerLookupService.cleanup();
    }
  }

  /**
   * Stops the scraping operation
   */
  async stop(): Promise<void> {
    if (this.status !== 'running' && this.status !== 'paused') {
      return;
    }

    this.status = 'stopped';
    this.loggingManager.logMessage('Stopping scraping...');

    // Wait for active workers to finish current town
    await this.waitForActiveWorkers();

    // Cleanup all workers
    for (const worker of this.workers) {
      await worker.cleanup();
    }

    await this.providerLookupService.cleanup();

    this.loggingManager.logMessage('Scraping stopped');
  }

  /**
   * Pauses the scraping operation
   */
  pause(): void {
    if (this.status !== 'running') {
      return;
    }

    this.status = 'paused';
    this.loggingManager.logMessage('Scraping paused');
    this.emitProgress();
  }

  /**
   * Resumes the scraping operation
   */
  resume(): void {
    if (this.status !== 'paused') {
      return;
    }

    this.status = 'running';
    this.loggingManager.logMessage('Scraping resumed');
    this.emitProgress();
  }

  /**
   * Waits for all active workers to finish their current tasks
   */
  private async waitForActiveWorkers(): Promise<void> {
    const maxWaitTime = 30000; // 30 seconds
    const startTime = Date.now();

    while (this.activeTowns.size > 0) {
      if (Date.now() - startTime > maxWaitTime) {
        this.loggingManager.logMessage('Force stopping workers after timeout');
        break;
      }

      await this.sleep(500);
    }
  }

  /**
   * Gets the current progress state
   */
  getProgress(): ProgressState {
    return { ...this.progressState };
  }

  /**
   * Gets all collected businesses
   */
  getResults(): Business[] {
    return [...this.allBusinesses];
  }

  /**
   * Gets the current status
   */
  getStatus(): string {
    return this.status;
  }

  /**
   * Gets the logging manager
   */
  getLoggingManager(): LoggingManager {
    return this.loggingManager;
  }

  /**
   * Emits progress event to UI
   */
  private emitProgress(): void {
    const percentage = this.progressState.totalTowns > 0
      ? (this.progressState.completedTowns / this.progressState.totalTowns) * 100
      : 0;

    const townsRemaining = this.progressState.totalTowns - this.progressState.completedTowns;

    // Calculate estimated time remaining
    let estimatedTime: number | null = null;
    if (this.progressState.townCompletionTimes.length > 0 && townsRemaining > 0) {
      const avgTime = this.progressState.townCompletionTimes.reduce((a, b) => a + b, 0) 
        / this.progressState.townCompletionTimes.length;
      estimatedTime = avgTime * townsRemaining;
    }

    this.eventEmitter.emit('progress', {
      percentage: Math.round(percentage),
      townsRemaining,
      businessesScraped: this.progressState.totalBusinesses,
      estimatedTime,
      status: this.status
    });
  }

  /**
   * Emits completion event to UI
   */
  private emitComplete(): void {
    console.log('[Orchestrator] emitComplete() executing');
    const summary = this.loggingManager.getSummary();
    console.log('[Orchestrator] Summary generated:', summary);
    console.log(`[Orchestrator] Emitting complete event with ${this.allBusinesses.length} businesses`);

    this.eventEmitter.emit('complete', {
      businesses: this.allBusinesses,
      summary
    });
    
    console.log('[Orchestrator] Complete event emitted');
  }

  /**
   * Emits error event to UI
   */
  private emitError(error: string): void {
    this.eventEmitter.emit('error', {
      error
    });
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
