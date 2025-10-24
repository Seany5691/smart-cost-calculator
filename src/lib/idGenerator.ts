/**
 * ID Generator Utility Module
 * 
 * Provides functions for generating and validating deal IDs.
 * Supports both UUID format (new) and legacy text-based format.
 */

/**
 * Generate a UUID for new deals
 * Uses crypto.randomUUID() if available, otherwise falls back to a polyfill
 * 
 * @returns A valid UUID v4 string
 */
export function generateDealId(): string {
  // Use native crypto.randomUUID() if available (modern browsers and Node.js 16+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID()
  // Generates a UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validate if a string is a valid UUID format
 * Checks for UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * 
 * @param id - The string to validate
 * @returns True if the string is a valid UUID, false otherwise
 */
export function isValidUUID(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // UUID v4 regex pattern
  // Format: 8-4-4-4-12 hexadecimal digits with hyphens
  // The third group must start with '4' (version 4)
  // The fourth group must start with '8', '9', 'a', or 'b' (variant bits)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate if a string is a valid legacy deal ID format
 * Legacy format: deal_{timestamp}_{random_string}
 * Example: deal_1756736387419_xqm3j7r99
 * 
 * @param id - The string to validate
 * @returns True if the string is a valid legacy deal ID, false otherwise
 */
export function isValidLegacyDealId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // Legacy deal ID pattern: deal_{timestamp}_{alphanumeric}
  // - Starts with "deal_"
  // - Followed by digits (timestamp)
  // - Followed by underscore
  // - Followed by lowercase alphanumeric characters
  const legacyRegex = /^deal_\d+_[a-z0-9]+$/;
  return legacyRegex.test(id);
}

/**
 * Validate if a string is any valid deal ID format
 * Accepts both UUID format and legacy text-based format
 * 
 * @param id - The string to validate
 * @returns True if the string is a valid deal ID (either format), false otherwise
 */
export function isValidDealId(id: string): boolean {
  return isValidUUID(id) || isValidLegacyDealId(id);
}

/**
 * Get the ID format type
 * Identifies whether an ID is UUID format, legacy format, or invalid
 * 
 * @param id - The string to check
 * @returns 'uuid' if UUID format, 'legacy' if legacy format, 'invalid' if neither
 */
export function getDealIdType(id: string): 'uuid' | 'legacy' | 'invalid' {
  if (isValidUUID(id)) {
    return 'uuid';
  }
  if (isValidLegacyDealId(id)) {
    return 'legacy';
  }
  return 'invalid';
}
