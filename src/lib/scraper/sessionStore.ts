/**
 * Shared session store for active scraping sessions
 * 
 * In production, this should be replaced with Redis or similar distributed store
 */

import { EventEmitter } from 'events';
import { ScrapingOrchestrator } from './ScrapingOrchestrator';

export interface ActiveSession {
  orchestrator: ScrapingOrchestrator;
  eventEmitter: EventEmitter;
  createdAt: number;
  completedAt?: number; // Track when scraping completed
}

// In-memory storage for active scraping sessions
// Use globalThis to persist across hot reloads in development
const globalForSessions = globalThis as unknown as {
  scrapingSessions: Map<string, ActiveSession> | undefined;
};

const activeSessions = globalForSessions.scrapingSessions ?? new Map<string, ActiveSession>();
globalForSessions.scrapingSessions = activeSessions;

export function getSession(sessionId: string): ActiveSession | undefined {
  const session = activeSessions.get(sessionId);
  console.log(`[SessionStore] Getting session: ${sessionId}, found: ${!!session}, total sessions: ${activeSessions.size}`);
  return session;
}

export function setSession(sessionId: string, session: ActiveSession): void {
  console.log(`[SessionStore] Setting session: ${sessionId}`);
  activeSessions.set(sessionId, session);
  console.log(`[SessionStore] Session set, total sessions: ${activeSessions.size}`);
}

export function deleteSession(sessionId: string): boolean {
  return activeSessions.delete(sessionId);
}

export function hasSession(sessionId: string): boolean {
  return activeSessions.has(sessionId);
}

export function getAllSessions(): Map<string, ActiveSession> {
  return activeSessions;
}

// Mark session as completed
export function markSessionComplete(sessionId: string): void {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.completedAt = Date.now();
  }
}

// Cleanup old sessions
export function cleanupOldSessions(): number {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const completedMaxAge = 5 * 60 * 1000; // 5 minutes for completed sessions
  let cleaned = 0;

  for (const [sessionId, session] of activeSessions.entries()) {
    const age = now - session.createdAt;
    const completedAge = session.completedAt ? now - session.completedAt : 0;
    
    // Delete if:
    // 1. Session is older than 24 hours, OR
    // 2. Session completed more than 5 minutes ago
    if (age > maxAge || (session.completedAt && completedAge > completedMaxAge)) {
      // Cleanup orchestrator
      session.orchestrator.stop().catch(console.error);
      activeSessions.delete(sessionId);
      cleaned++;
    }
  }

  return cleaned;
}

// Run cleanup every hour
setInterval(() => {
  const cleaned = cleanupOldSessions();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} old scraping sessions`);
  }
}, 60 * 60 * 1000);
