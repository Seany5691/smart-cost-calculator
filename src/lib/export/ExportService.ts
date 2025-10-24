/**
 * ExportService - Handles Excel export functionality
 * 
 * Provides methods to export businesses to Excel files with various grouping options.
 */

import * as XLSX from 'xlsx';
import { Business } from '../scraper/types';

export class ExportService {
  /**
   * Exports all businesses to a single Excel file
   * @param businesses - Array of businesses to export
   * @param filename - Optional filename (defaults to timestamp)
   */
  exportAll(businesses: Business[], filename?: string): void {
    const exportFilename = filename || `All_Businesses_${this.getTimestamp()}.xlsx`;
    this.exportToExcel(businesses, exportFilename);
  }

  /**
   * Exports businesses grouped by town
   * Creates one Excel file per town
   * @param businesses - Array of businesses to export
   * @returns Array of filenames created
   */
  exportByTown(businesses: Business[]): string[] {
    const townGroups = this.groupByTown(businesses);
    const filenames: string[] = [];
    
    for (const [town, townBusinesses] of Object.entries(townGroups)) {
      const filename = `${this.sanitizeFilename(town)}_${this.getTimestamp()}.xlsx`;
      this.exportToExcel(townBusinesses, filename);
      filenames.push(filename);
    }
    
    return filenames;
  }

  /**
   * Exports businesses filtered by provider(s)
   * Combines all towns for selected provider(s)
   * @param businesses - Array of businesses to export
   * @param providers - Array of provider names to filter by
   * @returns Filename created
   */
  exportByProvider(businesses: Business[], providers: string[]): string {
    const filtered = businesses.filter(b => 
      providers.includes(b.provider)
    );
    
    if (filtered.length === 0) {
      throw new Error('No businesses found for selected providers');
    }
    
    // Get unique towns
    const towns = [...new Set(filtered.map(b => b.town))];
    const townsPart = towns.length > 3 
      ? `${towns.slice(0, 3).join('_')}_and_${towns.length - 3}_more`
      : towns.join('_');
    
    // Get provider names
    const providersPart = providers.length > 3
      ? `${providers.slice(0, 3).join('_')}_and_${providers.length - 3}_more`
      : providers.join('_');
    
    const filename = `${this.sanitizeFilename(townsPart)}_Providers_${this.sanitizeFilename(providersPart)}_${this.getTimestamp()}.xlsx`;
    
    this.exportToExcel(filtered, filename);
    
    return filename;
  }

  /**
   * Gets unique providers from businesses
   * @param businesses - Array of businesses
   * @returns Sorted array of unique provider names
   */
  getUniqueProviders(businesses: Business[]): string[] {
    const providers = new Set<string>();
    
    for (const business of businesses) {
      if (business.provider && business.provider !== 'Unknown' && business.provider.trim() !== '') {
        providers.add(business.provider);
      }
    }
    
    return Array.from(providers).sort();
  }

  /**
   * Gets provider statistics
   * @param businesses - Array of businesses
   * @returns Map of provider name to count
   */
  getProviderStats(businesses: Business[]): Map<string, number> {
    const stats = new Map<string, number>();
    
    for (const business of businesses) {
      const provider = business.provider || 'Unknown';
      stats.set(provider, (stats.get(provider) || 0) + 1);
    }
    
    return stats;
  }

  /**
   * Groups businesses by town
   * @param businesses - Array of businesses
   * @returns Object with town names as keys and business arrays as values
   */
  private groupByTown(businesses: Business[]): Record<string, Business[]> {
    return businesses.reduce((acc, business) => {
      const town = business.town || 'Unknown';
      if (!acc[town]) {
        acc[town] = [];
      }
      acc[town].push(business);
      return acc;
    }, {} as Record<string, Business[]>);
  }

  /**
   * Exports businesses to Excel file
   * @param businesses - Array of businesses to export
   * @param filename - Filename for the Excel file
   */
  private exportToExcel(businesses: Business[], filename: string): void {
    // Convert businesses to plain objects for Excel
    const data = businesses.map(b => ({
      'Business Name': b.name,
      'Phone': b.phone,
      'Provider': b.provider || 'Unknown',
      'Industry': b.type_of_business,
      'Town': b.town,
      'Address': b.address,
      'Google Maps': b.maps_address,
      'Notes': b.notes || '',
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const columnWidths = [
      { wch: 30 }, // Business Name
      { wch: 15 }, // Phone
      { wch: 15 }, // Provider
      { wch: 20 }, // Industry
      { wch: 15 }, // Town
      { wch: 40 }, // Address
      { wch: 50 }, // Google Maps
      { wch: 20 }, // Notes
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Businesses');

    // Write file
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Gets current timestamp in filename-safe format
   * @returns Timestamp string (YYYY-MM-DD_HHmmss)
   */
  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
  }

  /**
   * Sanitizes filename by removing invalid characters
   * @param filename - Filename to sanitize
   * @returns Sanitized filename
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}

// Export singleton instance
export const exportService = new ExportService();
