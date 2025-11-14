// Route generation utilities for List App React
import { Lead, Route, Coordinates, RouteGenerationError } from './types';
import { extractCoordinatesFromUrl } from './validation';
import { hasValidCoordinates } from './leadUtils';

// =====================================================
// CONSTANTS
// =====================================================

export const ROUTE_CONSTANTS = {
  MAX_WAYPOINTS: 25, // Google Maps API limit
  RECOMMENDED_MAX_STOPS: 10, // Recommended before suggesting Google My Maps
  MIN_STOPS: 1,
  GOOGLE_MAPS_BASE_URL: 'https://www.google.com/maps/dir/',
};

// =====================================================
// GOOGLE MAPS URL PARSING
// =====================================================

/**
 * Parse Google Maps URL to extract coordinates
 * @param url - Google Maps URL
 * @returns Coordinates or null if parsing fails
 */
export function parseGoogleMapsUrl(url: string): Coordinates | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Use the validation utility for coordinate extraction
  return extractCoordinatesFromUrl(url);
}

/**
 * Parse multiple Google Maps URLs
 * @param urls - Array of Google Maps URLs
 * @returns Array of coordinates (null for failed parses)
 */
export function parseMultipleGoogleMapsUrls(urls: string[]): (Coordinates | null)[] {
  return urls.map(url => parseGoogleMapsUrl(url));
}

/**
 * Validate Google Maps URL format
 * @param url - URL to validate
 * @returns True if URL is a valid Google Maps URL
 */
export function isValidGoogleMapsUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Check if it contains Google Maps domain
  const hasGoogleMapsDomain = 
    url.includes('google.com/maps') || 
    url.includes('maps.google.com') ||
    url.includes('goo.gl/maps');

  if (!hasGoogleMapsDomain) {
    return false;
  }

  // Try to extract coordinates
  const coords = parseGoogleMapsUrl(url);
  return coords !== null;
}

// =====================================================
// COORDINATE EXTRACTION FROM LEADS
// =====================================================

/**
 * Extract coordinates from a lead
 * @param lead - Lead object
 * @returns Coordinates or null
 */
export function extractLeadCoordinates(lead: Lead): Coordinates | null {
  // First check if coordinates are already stored
  if (lead.coordinates) {
    return lead.coordinates;
  }

  // Try to extract from maps_address
  if (lead.maps_address) {
    return parseGoogleMapsUrl(lead.maps_address);
  }

  return null;
}

/**
 * Extract coordinates from multiple leads
 * @param leads - Array of leads
 * @returns Array of coordinate objects with lead IDs
 */
export function extractCoordinatesFromLeads(leads: Lead[]): Array<{
  leadId: string;
  coordinates: Coordinates | null;
  leadName: string;
}> {
  return leads.map(lead => ({
    leadId: lead.id,
    leadName: lead.name,
    coordinates: extractLeadCoordinates(lead),
  }));
}

/**
 * Filter leads that have valid coordinates
 * @param leads - Array of leads
 * @returns Array of leads with valid coordinates
 */
export function filterLeadsWithValidCoordinates(leads: Lead[]): Lead[] {
  return leads.filter(lead => {
    const coords = extractLeadCoordinates(lead);
    return coords !== null && isValidCoordinate(coords);
  });
}

/**
 * Validate coordinate values
 * @param coordinates - Coordinates to validate
 * @returns True if coordinates are valid
 */
export function isValidCoordinate(coordinates: Coordinates): boolean {
  const { lat, lng } = coordinates;
  
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// =====================================================
// ROUTE URL GENERATION
// =====================================================

/**
 * Generate Google Maps route URL from coordinates
 * @param coordinates - Array of coordinates
 * @returns Google Maps route URL
 */
export function generateRouteUrl(coordinates: Coordinates[]): string {
  if (coordinates.length === 0) {
    throw new Error('At least one coordinate is required to generate a route');
  }

  // Build the URL with all waypoints
  const waypoints = coordinates
    .map(coord => `${coord.lat},${coord.lng}`)
    .join('/');

  return `${ROUTE_CONSTANTS.GOOGLE_MAPS_BASE_URL}${waypoints}`;
}

/**
 * Generate Google Maps route URL from leads
 * @param leads - Array of leads
 * @returns Google Maps route URL
 */
export function generateRouteUrlFromLeads(leads: Lead[]): string {
  const coordinates = leads
    .map(lead => extractLeadCoordinates(lead))
    .filter((coord): coord is Coordinates => coord !== null);

  if (coordinates.length === 0) {
    throw new Error('No valid coordinates found in the provided leads');
  }

  return generateRouteUrl(coordinates);
}

/**
 * Generate route with additional metadata
 * @param leads - Array of leads
 * @param routeName - Optional custom route name
 * @param startingPoint - Optional starting point (Google Maps URL or address)
 * @returns Route object with URL and metadata
 */
export function generateRoute(
  leads: Lead[],
  routeName?: string,
  startingPoint?: string
): Omit<Route, 'id' | 'created_at' | 'user_id'> {
  // Validate leads
  const validationResult = validateRouteLeads(leads);
  if (!validationResult.isValid) {
    throw new RouteGenerationError(
      validationResult.errors.join(', '),
      leads,
      'validation_failed'
    );
  }

  // Extract coordinates
  const leadsWithCoords = filterLeadsWithValidCoordinates(leads);
  
  if (leadsWithCoords.length === 0) {
    throw new RouteGenerationError(
      'No leads with valid coordinates',
      leads,
      'no_valid_coordinates'
    );
  }

  // Generate route URL with optional starting point
  let routeUrl: string;
  if (startingPoint) {
    // Try to parse starting point as coordinates
    const startCoords = parseGoogleMapsUrl(startingPoint);
    if (startCoords) {
      // Prepend starting point coordinates to the route
      const allCoordinates = [
        startCoords,
        ...leadsWithCoords.map(lead => extractLeadCoordinates(lead)).filter((c): c is Coordinates => c !== null)
      ];
      routeUrl = generateRouteUrl(allCoordinates);
    } else {
      // If not a valid URL, treat as address and encode it
      const encodedStart = encodeURIComponent(startingPoint);
      const leadCoords = leadsWithCoords
        .map(lead => extractLeadCoordinates(lead))
        .filter((c): c is Coordinates => c !== null)
        .map(coord => `${coord.lat},${coord.lng}`)
        .join('/');
      routeUrl = `${ROUTE_CONSTANTS.GOOGLE_MAPS_BASE_URL}${encodedStart}/${leadCoords}`;
    }
  } else {
    routeUrl = generateRouteUrlFromLeads(leadsWithCoords);
  }

  // Generate route name if not provided
  const name = routeName || generateRouteName(leadsWithCoords);

  return {
    name,
    route_url: routeUrl,
    stop_count: leadsWithCoords.length,
    lead_ids: leadsWithCoords.map(lead => lead.id),
    starting_point: startingPoint,
  };
}

/**
 * Generate a default route name
 * @param leads - Array of leads in the route
 * @returns Generated route name
 */
export function generateRouteName(leads: Lead[]): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const stopCount = leads.length;
  
  return `Route ${dateStr} (${stopCount} stops)`;
}

// =====================================================
// ROUTE VALIDATION
// =====================================================

/**
 * Validate leads for route generation
 * @param leads - Array of leads
 * @returns Validation result
 */
export function validateRouteLeads(leads: Lead[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum stops
  if (leads.length < ROUTE_CONSTANTS.MIN_STOPS) {
    errors.push(`At least ${ROUTE_CONSTANTS.MIN_STOPS} lead is required for a route`);
  }

  // Check maximum stops (hard limit)
  if (leads.length > ROUTE_CONSTANTS.MAX_WAYPOINTS) {
    errors.push(
      `Route cannot have more than ${ROUTE_CONSTANTS.MAX_WAYPOINTS} stops (Google Maps limit). ` +
      `Consider using Google My Maps for larger routes.`
    );
  }

  // Check recommended maximum (warning)
  if (leads.length > ROUTE_CONSTANTS.RECOMMENDED_MAX_STOPS) {
    warnings.push(
      `Route has ${leads.length} stops. For routes with more than ${ROUTE_CONSTANTS.RECOMMENDED_MAX_STOPS} stops, ` +
      `consider using Google My Maps for better route optimization.`
    );
  }

  // Check for valid coordinates
  const leadsWithoutCoords = leads.filter(lead => !hasValidCoordinates(lead));
  if (leadsWithoutCoords.length > 0) {
    const leadNames = leadsWithoutCoords.map(l => l.name).join(', ');
    errors.push(
      `The following leads do not have valid coordinates: ${leadNames}. ` +
      `Please ensure all leads have valid Google Maps URLs.`
    );
  }

  // Check for duplicate leads
  const leadIds = leads.map(l => l.id);
  const uniqueIds = new Set(leadIds);
  if (leadIds.length !== uniqueIds.size) {
    warnings.push('Route contains duplicate leads');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate stop count for route
 * @param stopCount - Number of stops
 * @returns Validation result with warnings
 */
export function validateStopCount(stopCount: number): {
  isValid: boolean;
  shouldWarn: boolean;
  message: string;
} {
  if (stopCount < ROUTE_CONSTANTS.MIN_STOPS) {
    return {
      isValid: false,
      shouldWarn: false,
      message: `At least ${ROUTE_CONSTANTS.MIN_STOPS} stop is required`,
    };
  }

  if (stopCount > ROUTE_CONSTANTS.MAX_WAYPOINTS) {
    return {
      isValid: false,
      shouldWarn: false,
      message: `Cannot exceed ${ROUTE_CONSTANTS.MAX_WAYPOINTS} stops (Google Maps limit)`,
    };
  }

  if (stopCount > ROUTE_CONSTANTS.RECOMMENDED_MAX_STOPS) {
    return {
      isValid: true,
      shouldWarn: true,
      message: `Route has ${stopCount} stops. Consider using Google My Maps for routes with more than ${ROUTE_CONSTANTS.RECOMMENDED_MAX_STOPS} stops.`,
    };
  }

  return {
    isValid: true,
    shouldWarn: false,
    message: `Route has ${stopCount} stops`,
  };
}

// =====================================================
// ROUTE OPTIMIZATION
// =====================================================

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) *
      Math.cos(toRadians(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find nearest lead to a given coordinate
 * @param origin - Origin coordinate
 * @param leads - Array of leads to search
 * @returns Nearest lead or null
 */
export function findNearestLead(origin: Coordinates, leads: Lead[]): Lead | null {
  if (leads.length === 0) return null;

  let nearestLead: Lead | null = null;
  let minDistance = Infinity;

  for (const lead of leads) {
    const coords = extractLeadCoordinates(lead);
    if (!coords) continue;

    const distance = calculateDistance(origin, coords);
    if (distance < minDistance) {
      minDistance = distance;
      nearestLead = lead;
    }
  }

  return nearestLead;
}

/**
 * Simple nearest-neighbor route optimization
 * Note: This is a basic optimization. For production, consider using a proper TSP solver.
 * @param leads - Array of leads to optimize
 * @param startLead - Optional starting lead
 * @returns Optimized array of leads
 */
export function optimizeRouteOrder(leads: Lead[], startLead?: Lead): Lead[] {
  if (leads.length <= 2) {
    return leads; // No optimization needed for 1-2 stops
  }

  const optimized: Lead[] = [];
  const remaining = [...leads];

  // Start with the specified lead or the first one
  let current = startLead || remaining[0];
  optimized.push(current);
  remaining.splice(remaining.indexOf(current), 1);

  // Nearest neighbor algorithm
  while (remaining.length > 0) {
    const currentCoords = extractLeadCoordinates(current);
    if (!currentCoords) {
      // If current lead has no coords, just add the next one
      current = remaining[0];
      optimized.push(current);
      remaining.shift();
      continue;
    }

    const nearest = findNearestLead(currentCoords, remaining);
    if (!nearest) {
      // No more leads with valid coordinates, add remaining as-is
      optimized.push(...remaining);
      break;
    }

    optimized.push(nearest);
    remaining.splice(remaining.indexOf(nearest), 1);
    current = nearest;
  }

  return optimized;
}

/**
 * Calculate total route distance
 * @param leads - Array of leads in route order
 * @returns Total distance in kilometers
 */
export function calculateRouteDistance(leads: Lead[]): number {
  if (leads.length < 2) return 0;

  let totalDistance = 0;

  for (let i = 0; i < leads.length - 1; i++) {
    const coord1 = extractLeadCoordinates(leads[i]);
    const coord2 = extractLeadCoordinates(leads[i + 1]);

    if (coord1 && coord2) {
      totalDistance += calculateDistance(coord1, coord2);
    }
  }

  return totalDistance;
}

// =====================================================
// WAYPOINT MANAGEMENT
// =====================================================

/**
 * Split route into multiple routes if it exceeds waypoint limit
 * @param leads - Array of leads
 * @param maxWaypoints - Maximum waypoints per route
 * @returns Array of lead arrays (one per route)
 */
export function splitRouteByWaypointLimit(
  leads: Lead[],
  maxWaypoints: number = ROUTE_CONSTANTS.MAX_WAYPOINTS
): Lead[][] {
  if (leads.length <= maxWaypoints) {
    return [leads];
  }

  const routes: Lead[][] = [];
  for (let i = 0; i < leads.length; i += maxWaypoints) {
    routes.push(leads.slice(i, i + maxWaypoints));
  }

  return routes;
}

/**
 * Get waypoint count for a route
 * @param leads - Array of leads
 * @returns Number of valid waypoints
 */
export function getWaypointCount(leads: Lead[]): number {
  return filterLeadsWithValidCoordinates(leads).length;
}

// =====================================================
// ROUTE STATISTICS
// =====================================================

/**
 * Get route statistics
 * @param leads - Array of leads in the route
 * @returns Route statistics object
 */
export function getRouteStatistics(leads: Lead[]): {
  totalStops: number;
  validStops: number;
  invalidStops: number;
  estimatedDistance: number;
  providers: Record<string, number>;
} {
  const validLeads = filterLeadsWithValidCoordinates(leads);
  const invalidCount = leads.length - validLeads.length;

  const providers: Record<string, number> = {};
  leads.forEach(lead => {
    const provider = lead.provider || 'Unknown';
    providers[provider] = (providers[provider] || 0) + 1;
  });

  return {
    totalStops: leads.length,
    validStops: validLeads.length,
    invalidStops: invalidCount,
    estimatedDistance: calculateRouteDistance(validLeads),
    providers,
  };
}

// =====================================================
// EXPORT ALL UTILITIES
// =====================================================

export const routeUtils = {
  // URL Parsing
  parseGoogleMapsUrl,
  parseMultipleGoogleMapsUrls,
  isValidGoogleMapsUrl,
  
  // Coordinate Extraction
  extractLeadCoordinates,
  extractCoordinatesFromLeads,
  filterLeadsWithValidCoordinates,
  isValidCoordinate,
  
  // Route Generation
  generateRouteUrl,
  generateRouteUrlFromLeads,
  generateRoute,
  generateRouteName,
  
  // Validation
  validateRouteLeads,
  validateStopCount,
  
  // Optimization
  calculateDistance,
  findNearestLead,
  optimizeRouteOrder,
  calculateRouteDistance,
  
  // Waypoint Management
  splitRouteByWaypointLimit,
  getWaypointCount,
  
  // Statistics
  getRouteStatistics,
  
  // Constants
  ROUTE_CONSTANTS,
};
