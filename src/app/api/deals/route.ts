import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DEALS_FILE = path.join(process.cwd(), 'public', 'config', 'deals.json');

interface Deal {
  id: string;
  userId: string;
  username: string;
  userRole: string;
  customerName: string;
  term: number;
  escalation: number;
  distanceToInstall: number;
  additionalGrossProfit: number;
  settlement: number;
  sections: Record<string, unknown>[];
  factors: Record<string, unknown>;
  scales: Record<string, unknown>;
  totals: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Ensure the deals file exists
async function ensureDealsFile() {
  try {
    await fs.access(DEALS_FILE);
  } catch {
    await fs.writeFile(DEALS_FILE, JSON.stringify([], null, 2));
  }
}

// GET deals with role-based filtering
export async function GET(request: NextRequest) {
  try {
    await ensureDealsFile();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');
    
    const dealsData = await fs.readFile(DEALS_FILE, 'utf-8');
    let deals: Deal[] = JSON.parse(dealsData);
    
    // Filter deals based on role
    if (userRole === 'admin') {
      // Admin can see all deals
      return NextResponse.json(deals);
    } else {
      // User/Manager can only see their own deals
      deals = deals.filter(deal => deal.userId === userId);
      return NextResponse.json(deals);
    }
  } catch (error) {
    console.error('Error reading deals:', error);
    return NextResponse.json({ error: 'Failed to read deals' }, { status: 500 });
  }
}

// POST new deal
export async function POST(request: NextRequest) {
  try {
    await ensureDealsFile();
    
    const deal: Deal = await request.json();
    
    const dealsData = await fs.readFile(DEALS_FILE, 'utf-8');
    const deals: Deal[] = JSON.parse(dealsData);
    
    // Add new deal
    deals.push(deal);
    
    await fs.writeFile(DEALS_FILE, JSON.stringify(deals, null, 2));
    
    return NextResponse.json({ success: true, deal });
  } catch (error) {
    console.error('Error saving deal:', error);
    return NextResponse.json({ error: 'Failed to save deal' }, { status: 500 });
  }
} 