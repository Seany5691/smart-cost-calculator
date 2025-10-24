/**
 * Utility functions for Smart Scrape React
 * 
 * This file contains helper functions for:
 * - Filename sanitization
 * - Town assignment logic
 * - Excel export with hyperlinks
 * - Provider extraction
 * - Auto-export by town
 * - Browser download helper
 */

import * as XLSX from 'xlsx';
import { Business, ExportOptions } from './types';

/**
 * Sanitizes a filename by removing invalid Windows filename characters
 * and replacing them with underscores.
 * 
 * Invalid characters: \ / : * ? " < > | and control characters (0x00-0x1f)
 * 
 * @param name - The filename to sanitize
 * @returns The sanitized filename
 * 
 * Requirements: 26.1, 26.2, 26.3, 26.4, 26.5
 */
export function sanitizeFilename(name: string): string {
  // Remove invalid Windows filename characters and control characters
  // Characters: \ / : * ? " < > | and control characters (0x00-0x1f)
  return name.replace(/[\\/:*?"<>|\n\r\t\x00-\x1f]/g, '_');
}

/**
 * Assigns a town to a business using a fallback logic chain.
 * 
 * Fallback logic order:
 * 1. Use town from scrape data if present
 * 2. Match business address to input towns (full match)
 * 3. Match first part of town name (before comma) to address
 * 4. If only one town was scraped, assign all businesses to that town
 * 5. Use round-robin assignment based on business index
 * 
 * @param business - The business record to assign a town to
 * @param inputTowns - Array of town names that were scraped
 * @param allBusinesses - All businesses in the current session (for context)
 * @param businessIndex - Index of the business in the array (for round-robin)
 * @returns The assigned town name
 * 
 * Requirements: 25.1, 25.2, 25.3, 25.4, 25.5
 */
export function assignTownToBusiness(
  business: Business,
  inputTowns: string[],
  allBusinesses: Business[],
  businessIndex: number
): string {
  // 1. Use town from scrape data if present
  if (business.town && business.town.trim() !== '') {
    return business.town;
  }

  // Handle edge case: empty towns array
  if (!inputTowns || inputTowns.length === 0) {
    return 'Unknown';
  }

  // 2. Match address to input towns (full match)
  const address = (business.address || '').toLowerCase();
  if (address) {
    for (const town of inputTowns) {
      if (address.includes(town.toLowerCase())) {
        return town;
      }
    }

    // 3. Match first part of town name (before comma) to address
    for (const town of inputTowns) {
      const firstPart = town.split(',')[0].trim().toLowerCase();
      if (firstPart && address.includes(firstPart)) {
        return town;
      }
    }
  }

  // 4. If single town input, assign to all
  if (inputTowns.length === 1) {
    return inputTowns[0];
  }

  // 5. Round-robin assignment based on index
  return inputTowns[businessIndex % inputTowns.length];
}

/**
 * Creates an Excel file from business data with optional hyperlinks and column reordering.
 * 
 * Features:
 * - Adds hyperlinks to maps_address column
 * - Reorders columns to explicit order: maps_address, name, phone, provider, address, type_of_business, notes, town
 * - Generates Excel file as ArrayBuffer
 * 
 * @param businesses - Array of business records to export
 * @param options - Export options (hyperlinks, column reordering, filename sanitization)
 * @returns ArrayBuffer containing the Excel file
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 19.6, 19.7
 */
export function createExcelWithHyperlinks(
  businesses: Business[],
  options: ExportOptions
): ArrayBuffer {
  // Define explicit column order
  const columnOrder: (keyof Business)[] = [
    'maps_address',
    'name',
    'phone',
    'provider',
    'address',
    'type_of_business',
    'notes',
    'town'
  ];

  // Reorder business data according to column order
  const orderedData = businesses.map(business => {
    const ordered: Partial<Business> = {};
    columnOrder.forEach(key => {
      ordered[key] = business[key];
    });
    return ordered as Business;
  });

  // Create workbook with ordered columns
  const ws = XLSX.utils.json_to_sheet(orderedData, { header: columnOrder });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Businesses');

  // Add hyperlinks to maps_address column (column index 0)
  if (options.addHyperlinks && orderedData.length > 0) {
    orderedData.forEach((row, idx) => {
      const cellRef = XLSX.utils.encode_cell({ r: idx + 1, c: 0 }); // Column 0 is maps_address
      if (ws[cellRef] && row.maps_address) {
        ws[cellRef].l = { Target: row.maps_address };
      }
    });
  }

  // Generate buffer
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

/**
 * Extracts unique provider names from business records.
 * 
 * Filters out:
 * - Empty strings
 * - "Unknown" providers
 * 
 * Returns sorted list alphabetically.
 * 
 * @param businesses - Array of business records
 * @returns Sorted array of unique provider names
 * 
 * Requirements: 19.1
 */
export function extractUniqueProviders(businesses: Business[]): string[] {
  const providers = new Set<string>();
  
  businesses.forEach(b => {
    if (b.provider && b.provider.trim() !== '' && b.provider !== 'Unknown') {
      providers.add(b.provider);
    }
  });
  
  return Array.from(providers).sort();
}

/**
 * Automatically exports businesses grouped by town to separate Excel files.
 * 
 * Features:
 * - Groups businesses by town
 * - Creates separate Excel file for each town
 * - Sanitizes town names for filenames
 * - Triggers browser downloads
 * - Returns array of export paths
 * 
 * @param businesses - Array of all business records
 * @param outputFolder - Base folder path for exports (used in filename)
 * @returns Array of export file paths
 * 
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5
 */
export function autoExportByTown(
  businesses: Business[],
  outputFolder: string
): string[] {
  const exportPaths: string[] = [];

  // Group by town
  const grouped = businesses.reduce((acc, business) => {
    const town = business.town || 'Unknown';
    if (!acc[town]) acc[town] = [];
    acc[town].push(business);
    return acc;
  }, {} as Record<string, Business[]>);

  // Export each town
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  for (const [town, townBusinesses] of Object.entries(grouped)) {
    // Sanitize town name: replace spaces and commas with underscores
    const safeTown = sanitizeFilename(town.replace(/ /g, '_').replace(/,/g, '_'));
    const filename = `${safeTown}_leads_${timestamp}.xlsx`;
    const filepath = `${outputFolder}/${filename}`;

    // Create Excel file
    const buffer = createExcelWithHyperlinks(townBusinesses, {
      addHyperlinks: false,
      townAsLastColumn: false,
      sanitizeFilename: true
    });

    // Trigger download
    downloadFile(buffer, filename);
    exportPaths.push(filepath);
  }

  return exportPaths;
}

/**
 * Triggers a browser download for a file.
 * 
 * Features:
 * - Handles ArrayBuffer and string data
 * - Creates blob with appropriate MIME type
 * - Triggers browser download
 * - Cleans up object URLs
 * 
 * @param data - File data as ArrayBuffer or string
 * @param filename - Name for the downloaded file
 * @param mimeType - Optional MIME type (defaults to 'application/octet-stream')
 * 
 * Requirements: 11.5
 */
export function downloadFile(
  data: ArrayBuffer | string,
  filename: string,
  mimeType?: string
): void {
  const blob = new Blob([data], { type: mimeType || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
