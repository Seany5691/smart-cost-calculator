/**
 * OSMService - OpenStreetMap Overpass API Service
 * 
 * Fetches business data from OpenStreetMap using the Overpass API.
 * Much faster and lighter than browser-based scraping.
 */

import { Business } from './types';
import { v4 as uuidv4 } from 'uuid';

interface OSMElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: {
    name?: string;
    phone?: string;
    'contact:phone'?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    'addr:postcode'?: string;
    'addr:full'?: string;
    website?: string;
    amenity?: string;
    shop?: string;
    office?: string;
    healthcare?: string;
    [key: string]: string | undefined;
  };
  center?: {
    lat: number;
    lon: number;
  };
}

interface OSMResponse {
  version: number;
  generator: string;
  elements: OSMElement[];
}

export class OSMService {
  private overpassUrl = 'https://overpass-api.de/api/interpreter';
  
  // Map common industry types to OSM tags
  private industryTagMap: Record<string, string[]> = {
    'Dental Clinics': ['amenity=dentist', 'healthcare=dentist'],
    'Medical Practices': ['amenity=doctors', 'amenity=clinic', 'healthcare=doctor'],
    'Pharmacies': ['amenity=pharmacy'],
    'Engineering Firms': ['office=engineer', 'office=engineering'],
    'Auto Repair Shops': ['shop=car_repair', 'amenity=car_repair'],
    'Law Firms': ['office=lawyer', 'office=legal'],
    'Accounting Firms': ['office=accountant', 'office=accounting'],
    'Financial Services': ['office=financial', 'amenity=bank'],
    'Real Estate Agencies': ['office=estate_agent', 'shop=estate_agent'],
    'Manufacturing': ['industrial=factory', 'man_made=works'],
    'Construction Companies': ['office=construction', 'craft=builder'],
    'Logistics and Transportation': ['office=logistics', 'amenity=transport'],
    'Advertising Agencies': ['office=advertising'],
    'Architecture Firms': ['office=architect'],
    'Insurance Agencies': ['office=insurance'],
    'Property Management': ['office=property_management'],
    'Funeral Parlours': ['amenity=funeral_hall', 'shop=funeral_directors'],
  };

  /**
   * Scrapes businesses from OSM for a given town and industry
   * @param town - Town name to search in
   * @param industry - Industry type
   * @returns Array of Business objects
   */
  async scrapeBusinesses(town: string, industry: string): Promise<Business[]> {
    try {
      console.log(`[OSM] Scraping ${industry} in ${town}...`);
      
      // Get OSM tags for this industry
      const tags = this.getTagsForIndustry(industry);
      
      if (tags.length === 0) {
        console.warn(`[OSM] No tags mapped for industry: ${industry}`);
        return [];
      }

      // Build and execute Overpass query
      const query = this.buildOverpassQuery(town, tags);
      const osmData = await this.executeOverpassQuery(query);

      // Convert OSM elements to Business objects
      const businesses = this.convertOSMToBusinesses(osmData.elements, town, industry);

      console.log(`[OSM] Found ${businesses.length} businesses for ${industry} in ${town}`);
      
      return businesses;

    } catch (error) {
      console.error(`[OSM] Error scraping ${industry} in ${town}:`, error);
      throw error;
    }
  }

  /**
   * Gets OSM tags for a given industry
   */
  private getTagsForIndustry(industry: string): string[] {
    return this.industryTagMap[industry] || [];
  }

  /**
   * Builds an Overpass API query using Nominatim geocoding
   */
  private buildOverpassQuery(town: string, tags: string[]): string {
    // Build tag filters for each tag type
    const tagQueries = tags.map(tag => {
      const [key, value] = tag.split('=');
      return `
  node["${key}"="${value}"]({{bbox}});
  way["${key}"="${value}"]({{bbox}});
  relation["${key}"="${value}"]({{bbox}});`;
    }).join('');

    // Use Nominatim geocoding with bbox
    const query = `
[out:json][timeout:25];
{{geocodeArea:${town}, South Africa}}->.searchArea;
(
${tagQueries}
);
out body;
>;
out skel qt;
    `.trim();

    return query;
  }

  /**
   * Executes an Overpass API query
   */
  private async executeOverpassQuery(query: string): Promise<OSMResponse> {
    const response = await fetch(this.overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    const data: OSMResponse = await response.json();
    return data;
  }

  /**
   * Converts OSM elements to Business objects
   */
  private convertOSMToBusinesses(
    elements: OSMElement[],
    town: string,
    industry: string
  ): Business[] {
    const businesses: Business[] = [];

    for (const element of elements) {
      // Skip elements without tags or name
      if (!element.tags || !element.tags.name) {
        continue;
      }

      // Get coordinates
      let lat: number | undefined;
      let lon: number | undefined;

      if (element.type === 'node' && element.lat && element.lon) {
        lat = element.lat;
        lon = element.lon;
      } else if (element.center) {
        lat = element.center.lat;
        lon = element.center.lon;
      }

      // Skip if no coordinates
      if (!lat || !lon) {
        continue;
      }

      // Extract phone number
      const phone = this.extractPhone(element.tags);

      // Extract address
      const address = this.extractAddress(element.tags);

      // Generate Google Maps link from coordinates
      const mapsAddress = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

      // Create business object
      const business: Business = {
        id: uuidv4(),
        maps_address: mapsAddress,
        name: element.tags.name.trim(),
        phone: phone,
        provider: '', // Will be filled by ProviderLookupService
        address: address,
        type_of_business: industry,
        town: town,
        notes: `OSM ID: ${element.type}/${element.id}`,
      };

      businesses.push(business);
    }

    return businesses;
  }

  /**
   * Extracts phone number from OSM tags
   */
  private extractPhone(tags: Record<string, string | undefined>): string {
    // Try different phone tag variations
    const phoneFields = [
      'phone',
      'contact:phone',
      'telephone',
      'contact:telephone',
    ];

    for (const field of phoneFields) {
      const phone = tags[field];
      if (phone) {
        // Clean phone number
        return this.cleanPhone(phone);
      }
    }

    return '';
  }

  /**
   * Cleans phone number
   */
  private cleanPhone(phone: string): string {
    // Remove common prefixes and clean
    let cleaned = phone.trim();
    
    // Remove country code prefix if present
    cleaned = cleaned.replace(/^\+27\s*/, '0');
    
    // Remove extra spaces and formatting
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    return cleaned;
  }

  /**
   * Extracts address from OSM tags
   */
  private extractAddress(tags: Record<string, string | undefined>): string {
    // Try full address first
    if (tags['addr:full']) {
      return tags['addr:full'].trim();
    }

    // Build address from components
    const parts: string[] = [];

    if (tags['addr:housenumber']) {
      parts.push(tags['addr:housenumber']);
    }

    if (tags['addr:street']) {
      parts.push(tags['addr:street']);
    }

    if (tags['addr:city']) {
      parts.push(tags['addr:city']);
    }

    if (tags['addr:postcode']) {
      parts.push(tags['addr:postcode']);
    }

    return parts.join(', ');
  }

  /**
   * Gets statistics about OSM data quality for a town
   */
  async getDataQualityStats(town: string, industry: string): Promise<{
    totalBusinesses: number;
    withPhone: number;
    withAddress: number;
    withBoth: number;
    phonePercentage: number;
    addressPercentage: number;
  }> {
    const businesses = await this.scrapeBusinesses(town, industry);
    
    const withPhone = businesses.filter(b => b.phone && b.phone.trim() !== '').length;
    const withAddress = businesses.filter(b => b.address && b.address.trim() !== '').length;
    const withBoth = businesses.filter(
      b => b.phone && b.phone.trim() !== '' && b.address && b.address.trim() !== ''
    ).length;

    return {
      totalBusinesses: businesses.length,
      withPhone,
      withAddress,
      withBoth,
      phonePercentage: businesses.length > 0 ? (withPhone / businesses.length) * 100 : 0,
      addressPercentage: businesses.length > 0 ? (withAddress / businesses.length) * 100 : 0,
    };
  }
}
