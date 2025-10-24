/**
 * Activity Logger Utility
 * 
 * Provides functionality for logging and retrieving user activities
 * in the Smart Cost Calculator application.
 */

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
 * Log a new activity
 * 
 * @param activity - Activity data (without id and timestamp)
 */
export const logActivity = (activity: Omit<ActivityLog, 'id' | 'timestamp'>): void => {
  try {
    const log: ActivityLog = {
      ...activity,
      id: generateId(),
      timestamp: new Date().toISOString()
    };

    const existingLogs = getActivityLogs();
    existingLogs.push(log);

    // Trim logs to prevent storage bloat
    const trimmedLogs = trimActivityLogs(existingLogs);

    // Save to localStorage
    localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify({ logs: trimmedLogs }));
  } catch (error) {
    console.warn('Failed to log activity:', error);
    // Fail silently - activity logging should not block user actions
  }
};

/**
 * Get activity logs, optionally filtered by user ID
 * 
 * @param userId - Optional user ID to filter logs
 * @returns Array of activity logs, sorted by timestamp (newest first)
 */
export const getActivityLogs = (userId?: string): ActivityLog[] => {
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
    console.warn('Failed to retrieve activity logs:', error);
    return [];
  }
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
 * Clear all activity logs (useful for testing or admin cleanup)
 */
export const clearActivityLogs = (): void => {
  try {
    localStorage.removeItem(ACTIVITY_LOGS_KEY);
  } catch (error) {
    console.warn('Failed to clear activity logs:', error);
  }
};
