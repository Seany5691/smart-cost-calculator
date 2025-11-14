// Lead processing utilities for List App React
import { Lead, LeadStatus, LeadSortOptions, PROVIDER_PRIORITY, Coordinates } from './types';
import { validateLead, extractCoordinatesFromUrl, sanitizeLeadData } from './validation';

// =====================================================
// LEAD VALIDATION FUNCTIONS
// =====================================================

/**
 * Validates all required fields for a lead
 * @param lead - The lead to validate
 * @returns Validation result with errors if any
 */
export function validateLeadFields(lead: Partial<Lead>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields validation
  if (!lead.maps_address) {
    errors.push('Google Maps address is required');
  }

  if (!lead.name) {
    errors.push('Business name is required');
  }

  // Status-specific validation
  if (lead.status === 'later' && !lead.date_to_call_back) {
    errors.push('Callback date is required for "Later Stage" status');
  }

  // Coordinate validation if maps_address is provided
  if (lead.maps_address) {
    const coords = extractCoordinatesFromUrl(lead.maps_address);
    if (!coords) {
      errors.push('Unable to extract coordinates from Google Maps URL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a lead before status transition
 * @param lead - The lead to validate
 * @param newStatus - The target status
 * @returns Validation result
 */
export function validateStatusTransition(
  lead: Lead,
  newStatus: LeadStatus
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate required fields for specific statuses
  if (newStatus === 'later' && !lead.date_to_call_back) {
    errors.push('Callback date is required for "Later Stage" status');
  }

  // Validate coordinates exist for route generation
  if (newStatus === 'working' && !lead.coordinates && !lead.maps_address) {
    errors.push('Google Maps address is required for working leads');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =====================================================
// LEAD SORTING ALGORITHMS
// =====================================================

/**
 * Get provider priority for sorting
 * @param provider - Provider name
 * @returns Priority number (lower is higher priority)
 */
export function getProviderPriority(provider: string | null): number {
  if (!provider) return 999;
  
  // Normalize provider name
  const normalizedProvider = provider.trim();
  
  // Check exact matches first
  if (PROVIDER_PRIORITY[normalizedProvider]) {
    return PROVIDER_PRIORITY[normalizedProvider];
  }
  
  // Check case-insensitive matches
  const lowerProvider = normalizedProvider.toLowerCase();
  for (const [key, value] of Object.entries(PROVIDER_PRIORITY)) {
    if (key.toLowerCase() === lowerProvider) {
      return value;
    }
  }
  
  // Default to "Other" priority
  return PROVIDER_PRIORITY['Other'] || 999;
}

/**
 * Sort leads by provider priority (Telkom first)
 * @param leads - Array of leads to sort
 * @returns Sorted array of leads
 */
export function sortLeadsByProvider(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => {
    const priorityA = getProviderPriority(a.provider);
    const priorityB = getProviderPriority(b.provider);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same priority, sort by name
    return (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * Sort leads by status
 * @param leads - Array of leads to sort
 * @returns Sorted array of leads
 */
export function sortLeadsByStatus(leads: Lead[]): Lead[] {
  const statusOrder: Record<LeadStatus, number> = {
    'leads': 1,
    'working': 2,
    'later': 3,
    'bad': 4,
    'signed': 5,
  };

  return [...leads].sort((a, b) => {
    const orderA = statusOrder[a.status] || 999;
    const orderB = statusOrder[b.status] || 999;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // If same status, sort by number
    return a.number - b.number;
  });
}

/**
 * Sort leads by callback date (for "Later Stage" leads)
 * @param leads - Array of leads to sort
 * @returns Sorted array of leads (earliest dates first)
 */
export function sortLeadsByCallbackDate(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => {
    // Leads without callback dates go to the end
    if (!a.date_to_call_back && !b.date_to_call_back) return 0;
    if (!a.date_to_call_back) return 1;
    if (!b.date_to_call_back) return -1;
    
    const dateA = new Date(a.date_to_call_back).getTime();
    const dateB = new Date(b.date_to_call_back).getTime();
    
    return dateA - dateB;
  });
}

/**
 * Sort leads with "Bad Leads" at the bottom
 * @param leads - Array of leads to sort
 * @returns Sorted array with bad leads at the bottom
 */
export function sortLeadsWithBadAtBottom(leads: Lead[]): Lead[] {
  const goodLeads = leads.filter(lead => lead.status !== 'bad');
  const badLeads = leads.filter(lead => lead.status === 'bad');
  
  return [...goodLeads, ...badLeads];
}

/**
 * Generic sort function for leads
 * @param leads - Array of leads to sort
 * @param sortOptions - Sort field and direction
 * @returns Sorted array of leads
 */
export function sortLeads(leads: Lead[], sortOptions: LeadSortOptions): Lead[] {
  const { field, direction } = sortOptions;
  
  return [...leads].sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];
    
    // Handle null/undefined values
    if (valueA === null || valueA === undefined) return direction === 'asc' ? 1 : -1;
    if (valueB === null || valueB === undefined) return direction === 'asc' ? -1 : 1;
    
    // Handle different data types
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      const comparison = valueA.localeCompare(valueB);
      return direction === 'asc' ? comparison : -comparison;
    }
    
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return direction === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    // Handle dates
    if (field === 'created_at' || field === 'updated_at' || field === 'date_to_call_back') {
      const dateA = new Date(valueA as string).getTime();
      const dateB = new Date(valueB as string).getTime();
      return direction === 'asc' ? dateA - dateB : dateB - dateA;
    }
    
    return 0;
  });
}

// =====================================================
// LEAD NUMBERING AND RENUMBERING
// =====================================================

/**
 * Assign sequential numbers to leads within a status category
 * @param leads - Array of leads in the same status
 * @returns Array of leads with updated numbers
 */
export function numberLeads(leads: Lead[]): Lead[] {
  return leads.map((lead, index) => ({
    ...lead,
    number: index + 1,
  }));
}

/**
 * Renumber leads after one is moved or deleted
 * @param leads - Array of leads to renumber
 * @param startFrom - Starting number (default: 1)
 * @returns Array of leads with sequential numbers
 */
export function renumberLeads(leads: Lead[], startFrom: number = 1): Lead[] {
  return leads.map((lead, index) => ({
    ...lead,
    number: startFrom + index,
  }));
}

/**
 * Get the next available number for a status category
 * @param leads - Array of leads in the same status
 * @returns Next available number
 */
export function getNextLeadNumber(leads: Lead[]): number {
  if (leads.length === 0) return 1;
  
  const maxNumber = Math.max(...leads.map(lead => lead.number || 0));
  return maxNumber + 1;
}

/**
 * Renumber all leads in a status category after changes
 * @param allLeads - All leads in the system
 * @param status - Status category to renumber
 * @returns Updated leads array
 */
export function renumberLeadsByStatus(allLeads: Lead[], status: LeadStatus): Lead[] {
  const leadsInStatus = allLeads.filter(lead => lead.status === status);
  const otherLeads = allLeads.filter(lead => lead.status !== status);
  
  const renumbered = renumberLeads(leadsInStatus);
  
  return [...otherLeads, ...renumbered];
}

// =====================================================
// COORDINATE EXTRACTION
// =====================================================

/**
 * Extract coordinates from Google Maps URL
 * @param mapsUrl - Google Maps URL
 * @returns Coordinates object or null if extraction fails
 */
export function extractCoordinates(mapsUrl: string): Coordinates | null {
  return extractCoordinatesFromUrl(mapsUrl);
}

/**
 * Extract coordinates from multiple leads
 * @param leads - Array of leads
 * @returns Array of leads with coordinates populated
 */
export function extractCoordinatesFromLeads(leads: Lead[]): Lead[] {
  return leads.map(lead => {
    if (lead.coordinates) {
      return lead; // Already has coordinates
    }
    
    if (lead.maps_address) {
      const coords = extractCoordinates(lead.maps_address);
      return {
        ...lead,
        coordinates: coords,
      };
    }
    
    return lead;
  });
}

/**
 * Validate that a lead has valid coordinates
 * @param lead - Lead to validate
 * @returns True if lead has valid coordinates
 */
export function hasValidCoordinates(lead: Lead): boolean {
  if (lead.coordinates) {
    const { lat, lng } = lead.coordinates;
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }
  
  // Try to extract from maps_address
  if (lead.maps_address) {
    const coords = extractCoordinates(lead.maps_address);
    return coords !== null;
  }
  
  return false;
}

/**
 * Filter leads that have valid coordinates for route generation
 * @param leads - Array of leads
 * @returns Array of leads with valid coordinates
 */
export function filterLeadsWithCoordinates(leads: Lead[]): Lead[] {
  return leads.filter(hasValidCoordinates);
}

// =====================================================
// LEAD FILTERING AND SEARCH
// =====================================================

/**
 * Filter leads by search term across multiple fields
 * @param leads - Array of leads to search
 * @param searchTerm - Search term
 * @returns Filtered array of leads
 */
export function searchLeads(leads: Lead[], searchTerm: string): Lead[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return leads;
  }
  
  const term = searchTerm.toLowerCase().trim();
  
  return leads.filter(lead => {
    return (
      lead.name?.toLowerCase().includes(term) ||
      lead.phone?.toLowerCase().includes(term) ||
      lead.provider?.toLowerCase().includes(term) ||
      lead.address?.toLowerCase().includes(term) ||
      lead.type_of_business?.toLowerCase().includes(term) ||
      lead.notes?.toLowerCase().includes(term)
    );
  });
}

/**
 * Filter leads by provider
 * @param leads - Array of leads
 * @param provider - Provider name
 * @returns Filtered array of leads
 */
export function filterLeadsByProvider(leads: Lead[], provider: string): Lead[] {
  if (!provider) return leads;
  
  return leads.filter(lead => 
    lead.provider?.toLowerCase() === provider.toLowerCase()
  );
}

/**
 * Filter leads by status
 * @param leads - Array of leads
 * @param status - Lead status
 * @returns Filtered array of leads
 */
export function filterLeadsByStatus(leads: Lead[], status: LeadStatus): Lead[] {
  return leads.filter(lead => lead.status === status);
}

/**
 * Get leads that need callback today
 * @param leads - Array of leads
 * @returns Leads with callback date today
 */
export function getLeadsDueToday(leads: Lead[]): Lead[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return leads.filter(lead => {
    if (!lead.date_to_call_back) return false;
    
    const callbackDate = new Date(lead.date_to_call_back);
    callbackDate.setHours(0, 0, 0, 0);
    
    return callbackDate.getTime() === today.getTime();
  });
}

/**
 * Get leads that need callback in 2 days
 * @param leads - Array of leads
 * @returns Leads with callback date in 2 days
 */
export function getLeadsDueInTwoDays(leads: Lead[]): Lead[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const twoDaysFromNow = new Date(today);
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  
  return leads.filter(lead => {
    if (!lead.date_to_call_back) return false;
    
    const callbackDate = new Date(lead.date_to_call_back);
    callbackDate.setHours(0, 0, 0, 0);
    
    return callbackDate.getTime() === twoDaysFromNow.getTime();
  });
}

// =====================================================
// LEAD STATISTICS
// =====================================================

/**
 * Get count of leads by status
 * @param leads - Array of leads
 * @returns Object with counts for each status
 */
export function getLeadCountsByStatus(leads: Lead[]): Record<LeadStatus, number> {
  return {
    leads: leads.filter(l => l.status === 'leads').length,
    working: leads.filter(l => l.status === 'working').length,
    bad: leads.filter(l => l.status === 'bad').length,
    later: leads.filter(l => l.status === 'later').length,
    signed: leads.filter(l => l.status === 'signed').length,
  };
}

/**
 * Get count of leads by provider
 * @param leads - Array of leads
 * @returns Object with counts for each provider
 */
export function getLeadCountsByProvider(leads: Lead[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  leads.forEach(lead => {
    const provider = lead.provider || 'Unknown';
    counts[provider] = (counts[provider] || 0) + 1;
  });
  
  return counts;
}

// =====================================================
// EXPORT ALL UTILITIES
// =====================================================

export const leadUtils = {
  // Validation
  validateLeadFields,
  validateStatusTransition,
  
  // Sorting
  getProviderPriority,
  sortLeadsByProvider,
  sortLeadsByStatus,
  sortLeadsByCallbackDate,
  sortLeadsWithBadAtBottom,
  sortLeads,
  
  // Numbering
  numberLeads,
  renumberLeads,
  getNextLeadNumber,
  renumberLeadsByStatus,
  
  // Coordinates
  extractCoordinates,
  extractCoordinatesFromLeads,
  hasValidCoordinates,
  filterLeadsWithCoordinates,
  
  // Filtering and Search
  searchLeads,
  filterLeadsByProvider,
  filterLeadsByStatus,
  getLeadsDueToday,
  getLeadsDueInTwoDays,
  
  // Statistics
  getLeadCountsByStatus,
  getLeadCountsByProvider,
};
