/**
 * ErrorLogger - Comprehensive error logging service
 * 
 * Centralizes error logging with context, stack traces, and structured formatting.
 * Provides integration points for error tracking services like Sentry.
 */

export interface ErrorContext {
  town?: string;
  industry?: string;
  workerId?: number;
  sessionId?: string;
  operation?: string;
  userId?: string;
  [key: string]: any;
}

export interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warning' | 'critical';
  message: string;
  error?: Error;
  context?: ErrorContext;
  stack?: string;
  userAgent?: string;
  url?: string;
}

export class ErrorLogger {
  private static instance: ErrorLogger;
  private errorLogs: ErrorLogEntry[] = [];
  private maxLogs: number = 1000;
  private sentryEnabled: boolean = false;

  private constructor() {
    // Private constructor for singleton
    this.initializeSentry();
  }

  /**
   * Gets the singleton instance
   */
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Initializes Sentry integration (if configured)
   */
  private initializeSentry(): void {
    // Check if Sentry DSN is configured
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    
    if (sentryDsn) {
      // TODO: Initialize Sentry SDK when ready to integrate
      // import * as Sentry from '@sentry/nextjs';
      // Sentry.init({ dsn: sentryDsn });
      this.sentryEnabled = false; // Set to true when Sentry is configured
      console.log('Sentry error tracking is available but not yet initialized');
    }
  }

  /**
   * Logs an API error with full context
   */
  logApiError(
    endpoint: string,
    error: unknown,
    context?: ErrorContext
  ): void {
    const errorObj = this.normalizeError(error);
    
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `API Error [${endpoint}]: ${errorObj.message}`,
      error: errorObj,
      context: {
        ...context,
        operation: 'api_request',
        endpoint
      },
      stack: errorObj.stack,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    this.addLog(logEntry);
    this.consoleLog(logEntry);
    this.sendToSentry(logEntry);
  }

  /**
   * Logs a scraping error with town and industry context
   */
  logScrapingError(
    town: string,
    industry: string,
    error: unknown,
    additionalContext?: ErrorContext
  ): void {
    const errorObj = this.normalizeError(error);
    
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `Scraping Error [${town} - ${industry}]: ${errorObj.message}`,
      error: errorObj,
      context: {
        town,
        industry,
        operation: 'scraping',
        ...additionalContext
      },
      stack: errorObj.stack
    };

    this.addLog(logEntry);
    this.consoleLog(logEntry);
    this.sendToSentry(logEntry);
  }

  /**
   * Logs a browser error with full stack trace
   */
  logBrowserError(
    error: unknown,
    context?: ErrorContext
  ): void {
    const errorObj = this.normalizeError(error);
    
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'critical',
      message: `Browser Error: ${errorObj.message}`,
      error: errorObj,
      context: {
        ...context,
        operation: 'browser_automation'
      },
      stack: errorObj.stack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };

    this.addLog(logEntry);
    this.consoleLog(logEntry);
    this.sendToSentry(logEntry);
  }

  /**
   * Logs a provider lookup error
   */
  logProviderLookupError(
    phoneNumber: string,
    error: unknown,
    context?: ErrorContext
  ): void {
    const errorObj = this.normalizeError(error);
    
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warning',
      message: `Provider Lookup Error [${phoneNumber}]: ${errorObj.message}`,
      error: errorObj,
      context: {
        ...context,
        operation: 'provider_lookup',
        phoneNumber: this.maskPhoneNumber(phoneNumber)
      },
      stack: errorObj.stack
    };

    this.addLog(logEntry);
    this.consoleLog(logEntry);
    this.sendToSentry(logEntry);
  }

  /**
   * Logs a database error
   */
  logDatabaseError(
    operation: string,
    error: unknown,
    context?: ErrorContext
  ): void {
    const errorObj = this.normalizeError(error);
    
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'critical',
      message: `Database Error [${operation}]: ${errorObj.message}`,
      error: errorObj,
      context: {
        ...context,
        operation: 'database',
        dbOperation: operation
      },
      stack: errorObj.stack
    };

    this.addLog(logEntry);
    this.consoleLog(logEntry);
    this.sendToSentry(logEntry);
  }

  /**
   * Logs a validation error
   */
  logValidationError(
    field: string,
    value: any,
    reason: string,
    context?: ErrorContext
  ): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warning',
      message: `Validation Error [${field}]: ${reason}`,
      context: {
        ...context,
        operation: 'validation',
        field,
        value: typeof value === 'string' ? value : JSON.stringify(value)
      }
    };

    this.addLog(logEntry);
    this.consoleLog(logEntry);
  }

  /**
   * Logs a general error with context
   */
  logError(
    message: string,
    error?: unknown,
    context?: ErrorContext
  ): void {
    const errorObj = error ? this.normalizeError(error) : undefined;
    
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error: errorObj,
      context,
      stack: errorObj?.stack
    };

    this.addLog(logEntry);
    this.consoleLog(logEntry);
    this.sendToSentry(logEntry);
  }

  /**
   * Logs a warning
   */
  logWarning(
    message: string,
    context?: ErrorContext
  ): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warning',
      message,
      context
    };

    this.addLog(logEntry);
    this.consoleLog(logEntry);
  }

  /**
   * Normalizes any error type to Error object
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'string') {
      return new Error(error);
    }
    
    if (error && typeof error === 'object') {
      return new Error(JSON.stringify(error));
    }
    
    return new Error(String(error));
  }

  /**
   * Adds log entry to internal storage
   */
  private addLog(entry: ErrorLogEntry): void {
    this.errorLogs.push(entry);
    
    // Maintain max logs limit
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs.shift();
    }
  }

  /**
   * Outputs log to console with formatting
   */
  private consoleLog(entry: ErrorLogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const contextStr = entry.context 
      ? `\nContext: ${JSON.stringify(entry.context, null, 2)}`
      : '';
    
    switch (entry.level) {
      case 'critical':
        console.error(`${prefix} ${entry.message}${contextStr}`);
        if (entry.stack) {
          console.error('Stack trace:', entry.stack);
        }
        break;
      
      case 'error':
        console.error(`${prefix} ${entry.message}${contextStr}`);
        if (entry.stack) {
          console.error('Stack trace:', entry.stack);
        }
        break;
      
      case 'warning':
        console.warn(`${prefix} ${entry.message}${contextStr}`);
        break;
    }
  }

  /**
   * Sends error to Sentry (if enabled)
   */
  private sendToSentry(entry: ErrorLogEntry): void {
    if (!this.sentryEnabled) {
      return;
    }

    // TODO: Implement Sentry integration
    // import * as Sentry from '@sentry/nextjs';
    // 
    // Sentry.captureException(entry.error || new Error(entry.message), {
    //   level: entry.level === 'critical' ? 'fatal' : entry.level,
    //   tags: {
    //     operation: entry.context?.operation,
    //     town: entry.context?.town,
    //     industry: entry.context?.industry
    //   },
    //   extra: entry.context
    // });
  }

  /**
   * Masks phone number for privacy (keeps last 4 digits)
   */
  private maskPhoneNumber(phone: string): string {
    if (phone.length <= 4) {
      return '****';
    }
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
  }

  /**
   * Gets all error logs
   */
  getErrorLogs(): ErrorLogEntry[] {
    return [...this.errorLogs];
  }

  /**
   * Gets error logs filtered by level
   */
  getErrorLogsByLevel(level: 'error' | 'warning' | 'critical'): ErrorLogEntry[] {
    return this.errorLogs.filter(log => log.level === level);
  }

  /**
   * Gets error logs filtered by context
   */
  getErrorLogsByContext(contextKey: string, contextValue: any): ErrorLogEntry[] {
    return this.errorLogs.filter(
      log => log.context && log.context[contextKey] === contextValue
    );
  }

  /**
   * Exports error logs as JSON
   */
  exportErrorLogs(): string {
    return JSON.stringify(this.errorLogs, null, 2);
  }

  /**
   * Clears all error logs
   */
  clearLogs(): void {
    this.errorLogs = [];
  }

  /**
   * Gets error statistics
   */
  getErrorStats(): {
    total: number;
    byLevel: Record<string, number>;
    byOperation: Record<string, number>;
    recentErrors: ErrorLogEntry[];
  } {
    const byLevel: Record<string, number> = {
      error: 0,
      warning: 0,
      critical: 0
    };

    const byOperation: Record<string, number> = {};

    for (const log of this.errorLogs) {
      byLevel[log.level]++;
      
      if (log.context?.operation) {
        byOperation[log.context.operation] = (byOperation[log.context.operation] || 0) + 1;
      }
    }

    return {
      total: this.errorLogs.length,
      byLevel,
      byOperation,
      recentErrors: this.errorLogs.slice(-10)
    };
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();
