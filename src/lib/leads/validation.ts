// Validation utilities for List App React
import { Lead, LeadFormData, Route, ImportSession, LeadStatus } from './types';

// =====================================================
// VALIDATION CONSTANTS
// =====================================================

export const VALIDATION_RULES = {
  lead: {
    maps_address: {
      required: true,
      minLength: 10,
      pattern: /^https?:\/\/.+/i, // Basic URL pattern
    },
    name: {
      required: true,
      minLength: 2,
      maxLength: 255,
    },
    phone: {
      required: false,
      pattern: /^[\+]?[0-9\s\-\(\)]{10,15}$/, // International phone format
    },
    provider: {
      required: false,
      allowedValues: ['Telkom', 'Vodacom', 'MTN', 'Cell C', 'Rain', 'Other'],
    },
    status: {
      required: true,
      allowedValues: ['leads', 'working', 'bad', 'later', 'signed'] as LeadStatus[],
    },
    date_to_call_back: {
      required: false,
      minDate: new Date(),
    },
  },
  route: {
    name: {
      required: true,
      minLength: 3,
      maxLength: 255,
    },
    stop_count: {
      required: true,
      min: 1,
      max: 25, // Google Maps waypoint limit
    },
  },
  import: {
    file_size: {
      max: 10 * 1024 * 1024, // 10MB
    },
    allowed_types: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ],
  },
};

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Lead validation
export function validateLead(data: Partial<LeadFormData>): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.maps_address) {
    errors.push({
      field: 'maps_address',
      message: 'Google Maps address is required',
    });
  } else if (data.maps_address.length < VALIDATION_RULES.lead.maps_address.minLength) {
    errors.push({
      field: 'maps_address',
      message: `Maps address must be at least ${VALIDATION_RULES.lead.maps_address.minLength} characters`,
      value: data.maps_address,
    });
  } else if (!VALIDATION_RULES.lead.maps_address.pattern.test(data.maps_address)) {
    errors.push({
      field: 'maps_address',
      message: 'Maps address must be a valid URL',
      value: data.maps_address,
    });
  }

  if (!data.name) {
    errors.push({
      field: 'name',
      message: 'Business name is required',
    });
  } else if (data.name.length < VALIDATION_RULES.lead.name.minLength) {
    errors.push({
      field: 'name',
      message: `Name must be at least ${VALIDATION_RULES.lead.name.minLength} characters`,
      value: data.name,
    });
  } else if (data.name.length > VALIDATION_RULES.lead.name.maxLength) {
    errors.push({
      field: 'name',
      message: `Name must be no more than ${VALIDATION_RULES.lead.name.maxLength} characters`,
      value: data.name,
    });
  }

  // Optional fields with validation
  if (data.phone && !VALIDATION_RULES.lead.phone.pattern.test(data.phone)) {
    errors.push({
      field: 'phone',
      message: 'Phone number format is invalid',
      value: data.phone,
    });
  }

  if (data.provider && !VALIDATION_RULES.lead.provider.allowedValues?.includes(data.provider)) {
    errors.push({
      field: 'provider',
      message: `Provider must be one of: ${VALIDATION_RULES.lead.provider.allowedValues?.join(', ')}`,
      value: data.provider,
    });
  }

  if (data.status && !VALIDATION_RULES.lead.status.allowedValues.includes(data.status)) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${VALIDATION_RULES.lead.status.allowedValues.join(', ')}`,
      value: data.status,
    });
  }

  // Date validation for callback
  if (data.date_to_call_back) {
    const callbackDate = new Date(data.date_to_call_back);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for date comparison

    if (callbackDate < today) {
      errors.push({
        field: 'date_to_call_back',
        message: 'Callback date cannot be in the past',
        value: data.date_to_call_back,
      });
    }
  }

  // Status-specific validation
  if (data.status === 'later' && !data.date_to_call_back) {
    errors.push({
      field: 'date_to_call_back',
      message: 'Callback date is required for "Later Stage" status',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Route validation
export function validateRoute(data: { name: string; lead_ids: string[] }): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.name) {
    errors.push({
      field: 'name',
      message: 'Route name is required',
    });
  } else if (data.name.length < VALIDATION_RULES.route.name.minLength) {
    errors.push({
      field: 'name',
      message: `Route name must be at least ${VALIDATION_RULES.route.name.minLength} characters`,
      value: data.name,
    });
  } else if (data.name.length > VALIDATION_RULES.route.name.maxLength) {
    errors.push({
      field: 'name',
      message: `Route name must be no more than ${VALIDATION_RULES.route.name.maxLength} characters`,
      value: data.name,
    });
  }

  if (!data.lead_ids || data.lead_ids.length === 0) {
    errors.push({
      field: 'lead_ids',
      message: 'At least one lead is required for a route',
    });
  } else if (data.lead_ids.length < VALIDATION_RULES.route.stop_count.min) {
    errors.push({
      field: 'lead_ids',
      message: `Route must have at least ${VALIDATION_RULES.route.stop_count.min} stop`,
      value: data.lead_ids.length,
    });
  } else if (data.lead_ids.length > VALIDATION_RULES.route.stop_count.max) {
    errors.push({
      field: 'lead_ids',
      message: `Route cannot have more than ${VALIDATION_RULES.route.stop_count.max} stops (Google Maps limit)`,
      value: data.lead_ids.length,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// File validation for imports
export function validateImportFile(file: File): ValidationResult {
  const errors: ValidationError[] = [];

  if (!file) {
    errors.push({
      field: 'file',
      message: 'File is required',
    });
    return { isValid: false, errors };
  }

  // File size validation
  if (file.size > VALIDATION_RULES.import.file_size.max) {
    errors.push({
      field: 'file',
      message: `File size must be less than ${VALIDATION_RULES.import.file_size.max / (1024 * 1024)}MB`,
      value: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    });
  }

  // File type validation
  if (!VALIDATION_RULES.import.allowed_types.includes(file.type)) {
    errors.push({
      field: 'file',
      message: `File type not supported. Allowed types: ${VALIDATION_RULES.import.allowed_types.join(', ')}`,
      value: file.type,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =====================================================
// UTILITY VALIDATION FUNCTIONS
// =====================================================

// Validate Google Maps URL and extract coordinates
export function validateGoogleMapsUrl(url: string): { isValid: boolean; coordinates?: { lat: number; lng: number } } {
  if (!url || typeof url !== 'string') {
    return { isValid: false };
  }

  // Check if it's a Google Maps URL
  if (!url.includes('google.com/maps') && !url.includes('maps.google.com')) {
    return { isValid: false };
  }

  // Try to extract coordinates
  const coordinates = extractCoordinatesFromUrl(url);
  
  return {
    isValid: coordinates !== null,
    coordinates: coordinates || undefined,
  };
}

// Extract coordinates from Google Maps URL
export function extractCoordinatesFromUrl(url: string): { lat: number; lng: number } | null {
  try {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Clean up the URL - remove "Hyperlink:" prefix if present (from Excel)
    url = url.replace(/^Hyperlink:\s*/i, '').trim();

    // Pattern 1: @lat,lng format (most common)
    // Example: https://www.google.com/maps/@-26.1234,28.5678,15z
    let match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2]),
      };
    }

    // Pattern 2: !3d and !4d format
    // Example: https://www.google.com/maps/place/...!3d-26.1234!4d28.5678
    const latMatch = url.match(/!3d(-?\d+\.?\d*)/);
    const lngMatch = url.match(/!4d(-?\d+\.?\d*)/);
    
    if (latMatch && lngMatch) {
      return {
        lat: parseFloat(latMatch[1]),
        lng: parseFloat(lngMatch[1]),
      };
    }

    // Pattern 3: /place/ with coordinates
    // Example: https://www.google.com/maps/place/-26.1234,28.5678
    match = url.match(/\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2]),
      };
    }

    // Pattern 4: ll= parameter (legacy format)
    // Example: https://maps.google.com/?ll=-26.1234,28.5678
    match = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2]),
      };
    }

    // Pattern 5: q= parameter with coordinates
    // Example: https://www.google.com/maps?q=-26.1234,28.5678
    match = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2]),
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting coordinates from URL:', error);
    return null;
  }
}

// Validate phone number format
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return true; // Optional field
  return VALIDATION_RULES.lead.phone.pattern.test(phone);
}

// Validate email format (if needed for future features)
export function validateEmail(email: string): boolean {
  if (!email) return true; // Optional field
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

// Validate UUID format
export function validateUUID(uuid: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(uuid);
}

// =====================================================
// BULK VALIDATION FUNCTIONS
// =====================================================

// Validate multiple leads at once (for bulk import)
export function validateLeadsBulk(leads: Partial<LeadFormData>[]): {
  isValid: boolean;
  results: Array<{ index: number; isValid: boolean; errors: ValidationError[] }>;
} {
  const results = leads.map((lead, index) => ({
    index,
    ...validateLead(lead),
  }));

  const isValid = results.every(result => result.isValid);

  return { isValid, results };
}

// Validate Excel import data structure
export function validateImportData(data: any[]): ValidationResult {
  const errors: ValidationError[] = [];

  if (!Array.isArray(data)) {
    errors.push({
      field: 'data',
      message: 'Import data must be an array',
    });
    return { isValid: false, errors };
  }

  if (data.length === 0) {
    errors.push({
      field: 'data',
      message: 'Import data cannot be empty',
    });
    return { isValid: false, errors };
  }

  // Check for required columns in first row (assuming headers)
  const firstRow = data[0];
  const requiredFields = ['name', 'maps_address'];
  
  for (const field of requiredFields) {
    if (!(field in firstRow)) {
      errors.push({
        field: 'headers',
        message: `Required column '${field}' is missing`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =====================================================
// SANITIZATION FUNCTIONS
// =====================================================

// Sanitize lead data before saving
export function sanitizeLeadData(data: Partial<LeadFormData>): Partial<LeadFormData> {
  const sanitized: Partial<LeadFormData> = {};

  // Trim and clean string fields
  if (data.maps_address) {
    sanitized.maps_address = data.maps_address.trim();
  }
  
  if (data.name) {
    sanitized.name = data.name.trim();
  }
  
  if (data.phone) {
    // Remove extra spaces and format phone number
    sanitized.phone = data.phone.replace(/\s+/g, ' ').trim();
  }
  
  if (data.provider) {
    sanitized.provider = data.provider.trim();
  }
  
  if (data.address) {
    sanitized.address = data.address.trim();
  }
  
  if (data.type_of_business) {
    sanitized.type_of_business = data.type_of_business.trim();
  }
  
  if (data.notes) {
    sanitized.notes = data.notes.trim();
  }

  // Copy other fields as-is
  if (data.status) {
    sanitized.status = data.status;
  }
  
  if (data.date_to_call_back) {
    sanitized.date_to_call_back = data.date_to_call_back;
  }

  return sanitized;
}

// =====================================================
// EXPORT ALL VALIDATION FUNCTIONS
// =====================================================

export const validation = {
  validateLead,
  validateRoute,
  validateImportFile,
  validateGoogleMapsUrl,
  validatePhoneNumber,
  validateEmail,
  validateUUID,
  validateLeadsBulk,
  validateImportData,
  sanitizeLeadData,
  extractCoordinatesFromUrl,
  VALIDATION_RULES,
};