/**
 * API Error Handler - Utility for consistent error handling in API routes
 * 
 * Provides wrapper functions for API routes to ensure all errors are logged
 * with proper context and returned with consistent formatting.
 */

import { NextResponse } from 'next/server';
import { errorLogger, ErrorContext } from './ErrorLogger';

export interface ApiErrorResponse {
  error: string;
  message?: string;
  statusCode: number;
}

/**
 * Wraps an API route handler with error logging
 */
export function withErrorLogging<T>(
  handler: () => Promise<T>,
  endpoint: string,
  context?: ErrorContext
): Promise<T> {
  return handler().catch((error) => {
    errorLogger.logApiError(endpoint, error, context);
    throw error;
  });
}

/**
 * Creates a standardized error response with logging
 */
export function createErrorResponse(
  endpoint: string,
  error: unknown,
  statusCode: number = 500,
  context?: ErrorContext
): NextResponse<ApiErrorResponse> {
  errorLogger.logApiError(endpoint, error, context);
  
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  return NextResponse.json(
    {
      error: errorMessage,
      statusCode
    },
    { status: statusCode }
  );
}

/**
 * Creates a validation error response with logging
 */
export function createValidationErrorResponse(
  field: string,
  value: any,
  reason: string,
  context?: ErrorContext
): NextResponse<ApiErrorResponse> {
  errorLogger.logValidationError(field, value, reason, context);
  
  return NextResponse.json(
    {
      error: reason,
      statusCode: 400
    },
    { status: 400 }
  );
}

/**
 * Logs and formats database errors
 */
export function handleDatabaseError(
  operation: string,
  error: unknown,
  context?: ErrorContext
): NextResponse<ApiErrorResponse> {
  errorLogger.logDatabaseError(operation, error, context);
  
  const errorMessage = error instanceof Error ? error.message : 'Database operation failed';
  
  return NextResponse.json(
    {
      error: 'Database error occurred',
      message: errorMessage,
      statusCode: 500
    },
    { status: 500 }
  );
}

/**
 * Extracts error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unexpected error occurred';
}

/**
 * Checks if error is a known type and returns appropriate status code
 */
export function getErrorStatusCode(error: unknown): number {
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('unauthorized') || error.message.includes('authentication')) return 401;
    if (error.message.includes('forbidden') || error.message.includes('permission')) return 403;
    if (error.message.includes('validation') || error.message.includes('invalid')) return 400;
    if (error.message.includes('timeout')) return 408;
    if (error.message.includes('rate limit')) return 429;
  }
  
  return 500;
}

/**
 * Wraps async API route handler with comprehensive error handling
 */
export async function handleApiRoute<T>(
  handler: () => Promise<NextResponse<T>>,
  endpoint: string,
  context?: ErrorContext
): Promise<NextResponse<T | ApiErrorResponse>> {
  try {
    return await handler();
  } catch (error) {
    const statusCode = getErrorStatusCode(error);
    return createErrorResponse(endpoint, error, statusCode,