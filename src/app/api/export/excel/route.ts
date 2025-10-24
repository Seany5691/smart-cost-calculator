/**
 * POST /api/export/excel
 * 
 * Generates and returns Excel file with business data
 */

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { ExportExcelRequest, Business } from '@/lib/scraper/types';
import { requireScraperAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  // Check authentication and authorization
  const authError = requireScraperAuth(request);
  if (authError) return authError;

  try {
    // Parse request body
    const body: ExportExcelRequest = await request.json();

    // Validate request body
    if (!body.businesses || !Array.isArray(body.businesses)) {
      return NextResponse.json(
        { error: 'Businesses array is required' },
        { status: 400 }
      );
    }

    if (!body.filename || body.filename.trim() === '') {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Prepare data for Excel
    const excelData = body.businesses.map((business: Business) => ({
      'Maps Address': business.maps_address || '',
      'Name': business.name || '',
      'Phone': business.phone || '',
      'Provider': business.provider || '',
      'Address': business.address || '',
      'Type of Business': business.type_of_business || '',
      'Town': business.town || '',
      'Notes': business.notes || ''
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Businesses');

    // Add hyperlinks if requested
    if (body.addHyperlinks) {
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      
      // Find Maps Address column (should be column A, index 0)
      for (let row = 1; row <= range.e.r; row++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 });
        const business = body.businesses[row - 1];
        
        if (ws[cellRef] && business?.maps_address) {
          ws[cellRef].l = { Target: business.maps_address };
        }
      }
    }

    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 50 }, // Maps Address
      { wch: 30 }, // Name
      { wch: 15 }, // Phone
      { wch: 20 }, // Provider
      { wch: 40 }, // Address
      { wch: 25 }, // Type of Business
      { wch: 20 }, // Town
      { wch: 30 }  // Notes
    ];

    // Generate Excel buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return Excel file
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${body.filename}"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error generating Excel file:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel file' },
      { status: 500 }
    );
  }
}
