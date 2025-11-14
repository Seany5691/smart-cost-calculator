// Import processing utilities for List App React
import { Lead, LeadFormData, ImportSession } from './types';

// Import error log entry interface (matches the interface in types.ts, not the class)
interface ImportErrorEntry {
  row: number;
  field: string;
  value: any;
  error: string;
  timestamp: string;
}
import { validateLead, sanitizeLeadData } from './validation';
import { extractCoordinatesFromUrl } from './validation';

// =====================================================
// CONSTANTS
// =====================================================

export const IMPORT_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
  ],
  ALLOWED_EXTENSIONS: ['.xlsx', '.xls', '.csv'],
  MAX_RECORDS_PER_IMPORT: 10000,
  BATCH_SIZE: 100, // Process records in batches
};

// =====================================================
// FIELD MAPPING
// =====================================================

/**
 * Standard field mapping for lead imports
 */
export const STANDARD_FIELD_MAPPING: Record<string, string[]> = {
  maps_address: ['maps_address', 'google_maps', 'maps_url', 'map_link', 'location_url', 'maps link'],
  name: ['name', 'business_name', 'company', 'business name', 'company_name'],
  phone: ['phone', 'telephone', 'contact', 'phone_number', 'tel', 'mobile'],
  provider: ['provider', 'service_provider', 'isp', 'network'],
  address: ['address', 'street_address', 'location', 'physical_address'],
  type_of_business: ['type_of_business', 'business_type', 'category', 'industry', 'type'],
  notes: ['notes', 'comments', 'remarks', 'description'],
};

/**
 * Detect field mapping from Excel/CSV headers
 * @param headers - Array of column headers from import file
 * @returns Mapping of standard fields to import file columns
 */
export function detectFieldMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  for (const [standardField, possibleNames] of Object.entries(STANDARD_FIELD_MAPPING)) {
    for (const possibleName of possibleNames) {
      const index = normalizedHeaders.indexOf(possibleName.toLowerCase());
      if (index !== -1) {
        mapping[standardField] = headers[index]; // Use original header case
        break;
      }
    }
  }

  return mapping;
}

/**
 * Validate field mapping has required fields
 * @param mapping - Field mapping object
 * @returns Validation result
 */
export function validateFieldMapping(mapping: Record<string, string>): {
  isValid: boolean;
  missingFields: string[];
} {
  const requiredFields = ['maps_address', 'name'];
  const missingFields = requiredFields.filter(field => !mapping[field]);

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Apply field mapping to a data row
 * @param row - Raw data row from import
 * @param mapping - Field mapping
 * @returns Mapped lead data
 */
export function applyFieldMapping(
  row: Record<string, any>,
  mapping: Record<string, string>
): Partial<LeadFormData> {
  const leadData: any = {};

  for (const [standardField, importField] of Object.entries(mapping)) {
    if (row[importField] !== undefined && row[importField] !== null) {
      const value = row[importField];
      
      // Convert to string and trim
      if (typeof value === 'string') {
        leadData[standardField] = value.trim();
      } else {
        leadData[standardField] = String(value).trim();
      }
    }
  }

  return leadData as Partial<LeadFormData>;
}

// =====================================================
// DATA TRANSFORMATION
// =====================================================

/**
 * Transform raw import data to lead format
 * @param rawData - Array of raw data rows
 * @param mapping - Field mapping
 * @returns Array of lead form data
 */
export function transformImportData(
  rawData: any[],
  mapping: Record<string, string>
): Partial<LeadFormData>[] {
  return rawData.map(row => {
    const leadData = applyFieldMapping(row, mapping);
    return sanitizeLeadData(leadData);
  });
}

/**
 * Transform scraper data to lead format
 * @param scraperData - Data from Smart Cost Calculator scraper
 * @returns Array of lead form data
 */
export function transformScraperData(scraperData: any[]): Partial<LeadFormData>[] {
  return scraperData.map(item => {
    const leadData: Partial<LeadFormData> = {
      maps_address: item.maps_link || item.google_maps_url || '',
      name: item.business_name || item.name || '',
      phone: item.phone || item.contact_number || '',
      provider: item.provider || item.service_provider || '',
      address: item.address || item.location || '',
      type_of_business: item.business_type || item.category || '',
      notes: item.notes || '',
    };

    return sanitizeLeadData(leadData);
  });
}

/**
 * Normalize provider names to standard values
 * @param provider - Raw provider name
 * @returns Normalized provider name
 */
export function normalizeProviderName(provider: string | null | undefined): string | null {
  if (!provider) return null;

  const normalized = provider.toLowerCase().trim();

  const providerMap: Record<string, string> = {
    'telkom': 'Telkom',
    'vodacom': 'Vodacom',
    'mtn': 'MTN',
    'cell c': 'Cell C',
    'cellc': 'Cell C',
    'rain': 'Rain',
  };

  for (const [key, value] of Object.entries(providerMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  return 'Other';
}

/**
 * Normalize phone numbers to consistent format
 * @param phone - Raw phone number
 * @returns Normalized phone number
 */
export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except + at the start
  let normalized = phone.trim();
  
  // Keep leading + if present
  const hasPlus = normalized.startsWith('+');
  normalized = normalized.replace(/[^\d]/g, '');
  
  if (hasPlus) {
    normalized = '+' + normalized;
  }

  // Add spaces for readability (South African format)
  if (normalized.startsWith('+27') && normalized.length === 12) {
    // +27 XX XXX XXXX
    return `+27 ${normalized.slice(3, 5)} ${normalized.slice(5, 8)} ${normalized.slice(8)}`;
  } else if (normalized.startsWith('0') && normalized.length === 10) {
    // 0XX XXX XXXX
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`;
  }

  return normalized || null;
}

// =====================================================
// DATA VALIDATION
// =====================================================

/**
 * Validate import data before processing
 * @param data - Array of lead data to validate
 * @returns Validation results for each record
 */
export function validateImportData(data: Partial<LeadFormData>[]): {
  validRecords: Partial<LeadFormData>[];
  invalidRecords: Array<{
    index: number;
    data: Partial<LeadFormData>;
    errors: string[];
  }>;
} {
  const validRecords: Partial<LeadFormData>[] = [];
  const invalidRecords: Array<{
    index: number;
    data: Partial<LeadFormData>;
    errors: string[];
  }> = [];

  data.forEach((record, index) => {
    const validation = validateLead(record);
    
    if (validation.isValid) {
      validRecords.push(record);
    } else {
      invalidRecords.push({
        index,
        data: record,
        errors: validation.errors.map(e => e.message),
      });
    }
  });

  return { validRecords, invalidRecords };
}

/**
 * Validate Excel/CSV file before processing
 * @param file - File object
 * @returns Validation result
 */
export function validateImportFile(file: File): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check file exists
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }

  // Check file size
  if (file.size > IMPORT_CONSTANTS.MAX_FILE_SIZE) {
    errors.push(
      `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size (${IMPORT_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB)`
    );
  }

  // Check file type
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!IMPORT_CONSTANTS.ALLOWED_EXTENSIONS.includes(fileExtension)) {
    errors.push(
      `File type "${fileExtension}" is not supported. Allowed types: ${IMPORT_CONSTANTS.ALLOWED_EXTENSIONS.join(', ')}`
    );
  }

  // Check MIME type if available
  if (file.type && !IMPORT_CONSTANTS.ALLOWED_FILE_TYPES.includes(file.type)) {
    errors.push(`File MIME type "${file.type}" is not supported`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =====================================================
// DUPLICATE DETECTION
// =====================================================

/**
 * Detect duplicate leads in import data
 * @param leads - Array of lead data
 * @param existingLeads - Array of existing leads in database
 * @returns Duplicate detection results
 */
export function detectDuplicates(
  leads: Partial<LeadFormData>[],
  existingLeads: Lead[]
): {
  duplicates: Array<{
    index: number;
    lead: Partial<LeadFormData>;
    matchedWith: Lead;
    matchType: 'exact' | 'phone' | 'name_address';
  }>;
  unique: Partial<LeadFormData>[];
} {
  const duplicates: Array<{
    index: number;
    lead: Partial<LeadFormData>;
    matchedWith: Lead;
    matchType: 'exact' | 'phone' | 'name_address';
  }> = [];
  const unique: Partial<LeadFormData>[] = [];

  leads.forEach((lead, index) => {
    const duplicate = findDuplicate(lead, existingLeads);
    
    if (duplicate) {
      duplicates.push({
        index,
        lead,
        matchedWith: duplicate.lead,
        matchType: duplicate.matchType,
      });
    } else {
      unique.push(lead);
    }
  });

  return { duplicates, unique };
}

/**
 * Find duplicate lead in existing leads
 * @param lead - Lead to check
 * @param existingLeads - Array of existing leads
 * @returns Duplicate match or null
 */
export function findDuplicate(
  lead: Partial<LeadFormData>,
  existingLeads: Lead[]
): {
  lead: Lead;
  matchType: 'exact' | 'phone' | 'name_address';
} | null {
  // Check for exact match (same name and phone)
  if (lead.name && lead.phone) {
    const exactMatch = existingLeads.find(
      existing =>
        existing.name.toLowerCase() === lead.name?.toLowerCase() &&
        existing.phone === lead.phone
    );
    if (exactMatch) {
      return { lead: exactMatch, matchType: 'exact' };
    }
  }

  // Check for phone match
  if (lead.phone) {
    const phoneMatch = existingLeads.find(
      existing => existing.phone === lead.phone
    );
    if (phoneMatch) {
      return { lead: phoneMatch, matchType: 'phone' };
    }
  }

  // Check for name and address match
  if (lead.name && lead.address) {
    const nameAddressMatch = existingLeads.find(
      existing =>
        existing.name.toLowerCase() === lead.name?.toLowerCase() &&
        existing.address?.toLowerCase() === lead.address?.toLowerCase()
    );
    if (nameAddressMatch) {
      return { lead: nameAddressMatch, matchType: 'name_address' };
    }
  }

  return null;
}

/**
 * Handle duplicate leads based on strategy
 * @param duplicates - Array of duplicate leads
 * @param strategy - How to handle duplicates ('skip', 'update', 'create_new')
 * @returns Processed leads based on strategy
 */
export function handleDuplicates(
  duplicates: Array<{
    index: number;
    lead: Partial<LeadFormData>;
    matchedWith: Lead;
    matchType: string;
  }>,
  strategy: 'skip' | 'update' | 'create_new'
): {
  toSkip: Partial<LeadFormData>[];
  toUpdate: Array<{ existingId: string; updates: Partial<LeadFormData> }>;
  toCreate: Partial<LeadFormData>[];
} {
  const toSkip: Partial<LeadFormData>[] = [];
  const toUpdate: Array<{ existingId: string; updates: Partial<LeadFormData> }> = [];
  const toCreate: Partial<LeadFormData>[] = [];

  duplicates.forEach(({ lead, matchedWith }) => {
    switch (strategy) {
      case 'skip':
        toSkip.push(lead);
        break;
      case 'update':
        toUpdate.push({
          existingId: matchedWith.id,
          updates: lead,
        });
        break;
      case 'create_new':
        toCreate.push(lead);
        break;
    }
  });

  return { toSkip, toUpdate, toCreate };
}

// =====================================================
// BATCH PROCESSING
// =====================================================

/**
 * Split data into batches for processing
 * @param data - Array of data to batch
 * @param batchSize - Size of each batch
 * @returns Array of batches
 */
export function batchData<T>(data: T[], batchSize: number = IMPORT_CONSTANTS.BATCH_SIZE): T[][] {
  const batches: T[][] = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    batches.push(data.slice(i, i + batchSize));
  }
  
  return batches;
}

/**
 * Process import data in batches
 * @param data - Array of lead data
 * @param processor - Function to process each batch
 * @param onProgress - Progress callback
 * @returns Processing results
 */
export async function processBatches<T, R>(
  data: T[],
  processor: (batch: T[]) => Promise<R[]>,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const batches = batchData(data);
  const results: R[] = [];
  let processed = 0;

  for (const batch of batches) {
    const batchResults = await processor(batch);
    results.push(...batchResults);
    processed += batch.length;
    
    if (onProgress) {
      onProgress(processed, data.length);
    }
  }

  return results;
}

// =====================================================
// IMPORT STATISTICS
// =====================================================

/**
 * Generate import statistics
 * @param results - Import processing results
 * @returns Statistics object
 */
export function generateImportStatistics(results: {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  skipped: number;
}): {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  skipped: number;
  successRate: number;
} {
  const successRate = results.total > 0 
    ? (results.successful / results.total) * 100 
    : 0;

  return {
    ...results,
    successRate: Math.round(successRate * 100) / 100,
  };
}

// =====================================================
// ERROR HANDLING
// =====================================================

/**
 * Create import error log entry
 * @param row - Row number
 * @param field - Field name
 * @param value - Field value
 * @param error - Error message
 * @returns Import error object
 */
export function createImportErrorEntry(
  row: number,
  field: string,
  value: any,
  error: string
): ImportErrorEntry {
  return {
    row,
    field,
    value,
    error,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format import errors for display
 * @param errors - Array of import errors
 * @returns Formatted error messages
 */
export function formatImportErrors(errors: ImportErrorEntry[]): string[] {
  return errors.map(
    error => `Row ${error.row}, Field "${error.field}": ${error.error}`
  );
}

// =====================================================
// SCRAPER INTEGRATION
// =====================================================

/**
 * Validate scraper data structure
 * @param data - Data from scraper
 * @returns Validation result
 */
export function validateScraperData(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    errors.push('Scraper data must be an array');
    return { isValid: false, errors };
  }

  if (data.length === 0) {
    errors.push('Scraper data is empty');
    return { isValid: false, errors };
  }

  // Check if data has required fields
  const firstItem = data[0];
  const requiredFields = ['business_name', 'maps_link'];
  
  for (const field of requiredFields) {
    if (!(field in firstItem) && !('name' in firstItem) && !('google_maps_url' in firstItem)) {
      errors.push(`Scraper data is missing required fields`);
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Extract coordinates from scraper data
 * @param scraperData - Data from scraper
 * @returns Data with extracted coordinates
 */
export function extractCoordinatesFromScraperData(scraperData: any[]): any[] {
  return scraperData.map(item => {
    const mapsUrl = item.maps_link || item.google_maps_url;
    
    if (mapsUrl) {
      const coordinates = extractCoordinatesFromUrl(mapsUrl);
      return {
        ...item,
        coordinates,
      };
    }
    
    return item;
  });
}

// =====================================================
// EXPORT ALL UTILITIES
// =====================================================

export const importUtils = {
  // Field Mapping
  detectFieldMapping,
  validateFieldMapping,
  applyFieldMapping,
  STANDARD_FIELD_MAPPING,
  
  // Data Transformation
  transformImportData,
  transformScraperData,
  normalizeProviderName,
  normalizePhoneNumber,
  
  // Validation
  validateImportData,
  validateImportFile,
  
  // Duplicate Detection
  detectDuplicates,
  findDuplicate,
  handleDuplicates,
  
  // Batch Processing
  batchData,
  processBatches,
  
  // Statistics
  generateImportStatistics,
  
  // Error Handling
  createImportErrorEntry,
  formatImportErrors,
  
  // Scraper Integration
  validateScraperData,
  extractCoordinatesFromScraperData,
  
  // Constants
  IMPORT_CONSTANTS,
};
