/**
 * Supabase-based session store for serverless scraping
 * 
 * This replaces the in-memory session store and works on Vercel
 */

import { createClient } from '@supabase/supabase-js';
import type { Business, LogEntry, ProgressState } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface ScraperSession {
  id: string;
  sessionid: string;
  userid: string;
  status: 'pending' | 'running' | 'paused' | 'stopped' | 'completed' | 'error';
  towns: string[];
  industries: string[];
  config: any;
  progress: ProgressState;
  createdat: string;
  updatedat: string;
  completedat?: string;
  errormessage?: string;
}

/**
 * Create a new scraping session in Supabase
 */
export async function createSession(
  sessionId: string,
  userId: string,
  towns: string[],
  industries: string[],
  config: any
): Promise<ScraperSession> {
  const { data, error } = await supabase
    .from('scraper_sessions')
    .insert({
      sessionid: sessionId,
      userid: userId,
      status: 'pending',
      towns,
      industries,
      config,
      progress: {
        completedTowns: 0,
        totalTowns: towns.length,
        totalIndustries: towns.length * industries.length,
        completedIndustries: 0,
        totalBusinesses: 0,
        startTime: Date.now(),
        townCompletionTimes: []
      }
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<ScraperSession | null> {
  const { data, error } = await supabase
    .from('scraper_sessions')
    .select('*')
    .eq('sessionid', sessionId)
    .single();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }
  return data;
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  sessionId: string,
  status: ScraperSession['status'],
  errorMessage?: string
): Promise<void> {
  const updates: any = {
    status,
    updatedat: new Date().toISOString()
  };

  if (status === 'completed' || status === 'stopped') {
    updates.completedat = new Date().toISOString();
  }

  if (errorMessage) {
    updates.errormessage = errorMessage;
  }

  const { error } = await supabase
    .from('scraper_sessions')
    .update(updates)
    .eq('sessionid', sessionId);

  if (error) throw error;
}

/**
 * Update session progress
 */
export async function updateSessionProgress(
  sessionId: string,
  progress: Partial<ProgressState>
): Promise<void> {
  // First get current progress
  const session = await getSession(sessionId);
  if (!session) return;

  const updatedProgress = {
    ...session.progress,
    ...progress
  };

  const { error } = await supabase
    .from('scraper_sessions')
    .update({
      progress: updatedProgress,
      updatedat: new Date().toISOString()
    })
    .eq('sessionid', sessionId);

  if (error) throw error;
}

/**
 * Add businesses to session
 */
export async function addBusinesses(
  sessionId: string,
  businesses: Business[]
): Promise<void> {
  const records = businesses.map(b => ({
    sessionid: sessionId,
    name: b.name,
    phone: b.phone,
    provider: b.provider,
    address: b.address,
    mapsaddress: b.maps_address,
    typeofbusiness: b.type_of_business,
    town: b.town,
    notes: b.notes || ''
  }));

  const { error } = await supabase
    .from('scraper_businesses')
    .insert(records);

  if (error) throw error;

  // Update total businesses count
  const { data: count } = await supabase
    .from('scraper_businesses')
    .select('id', { count: 'exact', head: true })
    .eq('sessionid', sessionId);

  if (count) {
    await updateSessionProgress(sessionId, {
      totalBusinesses: count as any
    });
  }
}

/**
 * Get all businesses for a session
 */
export async function getSessionBusinesses(sessionId: string): Promise<Business[]> {
  const { data, error } = await supabase
    .from('scraper_businesses')
    .select('*')
    .eq('sessionid', sessionId)
    .order('createdat', { ascending: true });

  if (error) throw error;
  
  return (data || []).map(d => ({
    id: d.id,
    name: d.name,
    phone: d.phone || '',
    provider: d.provider || 'Unknown',
    address: d.address || '',
    maps_address: d.mapsaddress || '',
    type_of_business: d.typeofbusiness,
    town: d.town,
    notes: d.notes || '',
    createdAt: d.createdat
  }));
}

/**
 * Add log entry
 */
export async function addLog(
  sessionId: string,
  log: LogEntry
): Promise<void> {
  const { error} = await supabase
    .from('scraper_logs')
    .insert({
      sessionid: sessionId,
      timestamp: log.timestamp,
      message: log.message,
      level: log.level
    });

  if (error) console.error('Error adding log:', error);
}

/**
 * Get logs for a session
 */
export async function getSessionLogs(sessionId: string): Promise<LogEntry[]> {
  const { data, error } = await supabase
    .from('scraper_logs')
    .select('*')
    .eq('sessionid', sessionId)
    .order('createdat', { ascending: true })
    .limit(300); // Limit to last 300 logs

  if (error) throw error;
  
  return (data || []).map(d => ({
    timestamp: d.timestamp,
    message: d.message,
    level: d.level as 'info' | 'success' | 'warning' | 'error'
  }));
}

/**
 * Delete old sessions (cleanup)
 */
export async function cleanupOldSessions(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('scraper_sessions')
    .delete()
    .lt('createdat', oneDayAgo)
    .select('id');

  if (error) {
    console.error('Error cleaning up sessions:', error);
    return 0;
  }

  return data?.length || 0;
}
