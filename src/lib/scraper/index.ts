/**
 * Scraper Services - Main exports
 * 
 * Central export point for all scraping services and utilities
 */

// Core Services
export { ScrapingOrchestrator } from './ScrapingOrchestrator';
export { BrowserWorker } from './BrowserWorker';
export { IndustryScraper } from './IndustryScraper';
export { ProviderLookupService } from './ProviderLookupService';
export { LoggingManager } from './LoggingManager';

// Utilities
export { RetryStrategy } from './RetryStrategy';
export {
  sanitizeFilename,
  assignTownToBusiness,
  createExcelWithHyperlinks,
  extractUniqueProviders,
  autoExportByTown,
  downloadFile
} from './utils';

// Error Logging
export { ErrorLogger, errorLogger } from './ErrorLogger';
export type { ErrorContext, ErrorLogEntry } from './ErrorLogger';
export {
  withErrorLogging,
  createErrorResponse,
  createValidationErrorResponse,
  handleDatabaseError,
  extractErrorMessage,
  getErrorStatusCode,
  handleApiRoute
} from './apiErrorHandler';
export type { ApiErrorResponse } from './apiErrorHandler';

// Batch Operations
export {
  batchInsertBusinesses,
  batchUpdateBusinesses,
  batchDeleteBusinesses,
  executeBatchOperation
} from './batchOperations';

// Types
export * from './types';
