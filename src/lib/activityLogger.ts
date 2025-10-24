/**
 * Activity Logger Utility
 * 
 * Provides functionality for logging and retrieving user activities
 * in the Smart Cost Calculator application.
 */

import { supabaseHelpers } from './supabase';

// Activity type enumeration
export type ActivityType = 
  | 'deal_created'
  | 'deal_saved'
  | 'proposal_generated'
  | 'pdf_generated'
  | 'deal_loaded';

// Activity log interface
export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  userRole: 'admin' | 'manager' | 'user';
  activityType: ActivityType;
  dealId?: string;
  dealName?: string;
  timestamp: string;  // ISO 8601 format
  metadata?: Record<string, any>;
}

// LocalStorage key for activity logs
const ACTIVITY_LOGS_KEY = 'activity-logs';
const MIGRATION_KEY = 'activity-logs-migrated';

// Maximum number of logs to keep per user
const MAX_LOGS_PER_USER = 100;

/**
 * Generate a unique ID for activity logs
 */
const generateId = (): string => {
  return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Trim activity logs to keep only the last MAX_LOGS_PER_USER entries per user
 */
const trimActivityLogs = (logs: ActivityLog[]): ActivityLog[] => {
  // Group logs by user
  const byUser = logs.reduce((acc, log) => {
    if (!acc[log.userId]) {
      acc[log.userId] = [];
    }
    acc[log.userId].push(log);
    return acc;
  }, {} as Record<string, ActivityLog[]>);

  // Keep last MAX_LOGS_PER_USER per user, sorted by timestamp (newest first)
  const trimmed: ActivityLog[] = [];
  Object.values(byUser).forEach(userLogs => {
    const sorted = userLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    trimmed.push(...sorted.slice(0, MAX_LOGS_PER_USER));
  });

  return trimmed;
};

/**
 * Log activity to localStorage (fallback method)
 * 
 * @param activity - Activity data (without id and timestamp)
 */
const logActivityToLocalStorage = (activity: Omit<ActivityLog, 'id' | 'timestamp'>): void => {
  try {
    const log: ActivityLog = {
      ...activity,
      id: generateId(),
      timestamp: new Date().toISOString()
    };

    const existingLogs = getActivityLogsFromLocalStorage();
    existingLogs.push(log);

    // Trim logs to prevent storage bloat
    const trimmedLogs = trimActivityLogs(existingLogs);

    // Save to localStorage
    localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify({ logs: trimmedLogs }));
  } catch (error) {
    console.warn('Failed to log activity to localStorage:', error);
  }
};

/**
 * Log activity to Supabase
 * 
 * @param activity - Activity data (without id and timestamp)
 */
export const logActivityToSupabase = async (activity: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> => {
  try {
    const log: ActivityLog = {
      ...activity,
      id: generateId(),
      timestamp: new Date().toISOString()
    };

    await supabaseHelpers.createActivityLog(log);
  } catch (error) {
    console.warn('Failed to log activity to Supabase, falling back to localStorage:', error);
    // Fall back to localStorage
    logActivityToLocalStorage(activity);
  }
};

/**
 * Log a new activity
 * 
 * @param activity - Activity data (without id and timestamp)
 */
export const logActivity = (activity: Omit<ActivityLog, 'id' | 'timestamp'>): void => {
  // Use async function but don't await to avoid blocking
  logActivityToSupabase(activity).catch(error => {
    console.warn('Activity logging failed:', error);
  });
};

/**
 * Get activity logs from localStorage (fallback method)
 * 
 * @param userId - Optional user ID to filter logs
 * @returns Array of activity logs, sorted by timestamp (newest first)
 */
const getActivityLogsFromLocalStorage = (userId?: string): ActivityLog[] => {
  try {
    const data = localStorage.getItem(ACTIVITY_LOGS_KEY);
    if (!data) {
      return [];
    }

    const { logs } = JSON.parse(data);

    // Filter by user if specified
    let filteredLogs = logs as ActivityLog[];
    if (userId) {
      filteredLogs = filteredLogs.filter((log: ActivityLog) => log.userId === userId);
    }

    // Sort by timestamp (newest first)
    return filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.warn('Failed to retrieve activity logs from localStorage:', error);
    return [];
  }
};

/**
 * Get activity logs from Supabase
 * 
 * @param userId - Optional user ID to filter logs
 * @returns Promise of array of activity logs, sorted by timestamp (newest first)
 */
export const getActivityLogsFromSupabase = async (userId?: string): Promise<ActivityLog[]> => {
  try {
    const logs = await supabaseHelpers.getActivityLogs(userId, MAX_LOGS_PER_USER);
    return logs;
  } catch (error) {
    console.warn('Failed to retrieve activity logs from Supabase, falling back to localStorage:', error);
    return getActivityLogsFromLocalStorage(userId);
  }
};

/**
 * Get activity logs, optionally filtered by user ID
 * 
 * @param userId - Optional user ID to filter logs
 * @returns Array of activity logs, sorted by timestamp (newest first)
 */
export const getActivityLogs = (userId?: string): ActivityLog[] => {
  // This is the synchronous version for backward compatibility
  // Components should migrate to use getActivityLogsFromSupabase
  return getActivityLogsFromLocalStorage(userId);
};

/**
 * Get all unique users from activity logs
 * Useful for admin dropdown to select users
 * 
 * @returns Array of unique user objects with id, username, and role
 */
export const getUniqueUsers = (): Array<{ userId: string; username: string; userRole: string }> => {
  try {
    const logs = getActivityLogs();
    const userMap = new Map<string, { userId: string; username: string; userRole: string }>();

    logs.forEach(log => {
      if (!userMap.has(log.userId)) {
        userMap.set(log.userId, {
          userId: log.userId,
          username: log.username,
          userRole: log.userRole
        });
      }
    });

    return Array.from(userMap.values()).sort((a, b) => 
      a.username.localeCompare(b.username)
    );
  } catch (error) {
    console.warn('Failed to get unique users:', error);
    return [];
  }
};

/**
 * Migrate localStorage activity logs to Supabase
 * 
 * @returns Promise<boolean> - True if migration successful or already completed
 */
export const migrateActivityLogsToSupabase = async (): Promise<boolean> => {
  try {
    // Check if migration already done
    if (typeof window !== 'undefined' && localStorage.getItem(MIGRATION_KEY) === 'true') {
      return true;
    }

    const localLogs = getActivityLogsFromLocalStorage();
    
    if (localLogs.length === 0) {
      // No logs to migrate, mark as complete
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIGRATION_KEY, 'true');
      }
      return true;
    }

    // Batch insert to Supabase using upsert to handle duplicates
    for (const log of localLogs) {
      try {
        await supabaseHelpers.createActivityLog(log);
      } catch (error) {
        // Log individual errors but continue with migration
        console.warn(`Failed to migrate activity log ${log.id}:`, error);
      }
    }

    // Mark migration as complete
    if (typeof window !== 'undefined') {
      localStorage.setItem(MIGRATION_KEY, 'true');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to migrate activity logs to Supabase:', error);
    return false;
  }
};

/**
 * Clear all activity logs (useful for testing or admin cleanup)
 */
export const clearActivityLogs = (): void => {
  try {
    localStorage.removeItem(ACTIVITY_LOGS_KEY);
  } catch (error) {
    console.warn('Failed to clear activity logs:', error);
  }
};
