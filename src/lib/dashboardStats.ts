/**
 * Dashboard Statistics Utility
 * 
 * Provides functions to calculate statistics for the dashboard
 */

import { getActivityLogs } from './activityLogger';
import { supabaseHelpers } from './supabase';

// Cache for statistics with 5-minute TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const statsCache = new Map<string, CacheEntry<number>>();

/**
 * Get cached value or fetch new data
 */
const getCachedOrFetch = async <T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
): Promise<T> => {
  const cached = statsCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data as T;
  }

  const data = await fetchFn();
  statsCache.set(cacheKey, { data: data as number, timestamp: now });
  return data;
};

/**
 * Invalidate cache for a specific key or all keys
 */
export const invalidateStatsCache = (cacheKey?: string) => {
  if (cacheKey) {
    statsCache.delete(cacheKey);
  } else {
    statsCache.clear();
  }
};

/**
 * Calculate total deals for a user (async version with Supabase)
 * For admin, counts all deals. For other users, counts only their deals.
 * 
 * @param userId - Current user ID
 * @param isAdmin - Whether the user is an admin
 * @returns Promise<Total number of deals>
 */
export const getTotalDealsAsync = async (userId: string, isAdmin: boolean): Promise<number> => {
  const cacheKey = `total-deals-${isAdmin ? 'admin' : userId}`;
  
  return getCachedOrFetch(cacheKey, async () => {
    try {
      const deals = await supabaseHelpers.getDeals(userId, isAdmin);
      return deals.length;
    } catch (error) {
      console.warn('Failed to fetch deals from Supabase, falling back to localStorage:', error);
      // Fall back to localStorage
      const dealsData = localStorage.getItem('deals-storage');
      if (!dealsData) return 0;

      const deals = JSON.parse(dealsData);
      
      if (isAdmin) {
        return deals.length;
      } else {
        return deals.filter((deal: any) => deal.userId === userId).length;
      }
    }
  });
};

/**
 * Calculate active projects (deals modified in last 30 days) (async version with Supabase)
 * For admin, counts all active deals. For other users, counts only their active deals.
 * 
 * @param userId - Current user ID
 * @param isAdmin - Whether the user is an admin
 * @returns Promise<Number of active projects>
 */
export const getActiveProjectsAsync = async (userId: string, isAdmin: boolean): Promise<number> => {
  const cacheKey = `active-projects-${isAdmin ? 'admin' : userId}`;
  
  return getCachedOrFetch(cacheKey, async () => {
    try {
      const deals = await supabaseHelpers.getDeals(userId, isAdmin);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return deals.filter((deal: any) => {
        const updatedAt = new Date(deal.updatedAt);
        return updatedAt >= thirtyDaysAgo;
      }).length;
    } catch (error) {
      console.warn('Failed to fetch deals from Supabase, falling back to localStorage:', error);
      // Fall back to localStorage
      const dealsData = localStorage.getItem('deals-storage');
      if (!dealsData) return 0;

      const deals = JSON.parse(dealsData);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let filteredDeals = deals;
      
      if (!isAdmin) {
        filteredDeals = deals.filter((deal: any) => deal.userId === userId);
      }

      return filteredDeals.filter((deal: any) => {
        const updatedAt = new Date(deal.updatedAt);
        return updatedAt >= thirtyDaysAgo;
      }).length;
    }
  });
};

/**
 * Calculate total calculations (deal saves + loads) from activity log (async version with Supabase)
 * For admin, counts all users' calculations. For other users, counts only their calculations.
 * 
 * @param userId - Current user ID
 * @param isAdmin - Whether the user is an admin
 * @returns Promise<Total number of calculations>
 */
export const getTotalCalculationsAsync = async (userId: string, isAdmin: boolean): Promise<number> => {
  const cacheKey = `total-calculations-${isAdmin ? 'admin' : userId}`;
  
  return getCachedOrFetch(cacheKey, async () => {
    try {
      const logs = await supabaseHelpers.getActivityLogs(isAdmin ? undefined : userId);
      
      // Count deal_created, deal_saved, and deal_loaded activities
      return logs.filter(log => 
        log.activityType === 'deal_created' || 
        log.activityType === 'deal_saved' || 
        log.activityType === 'deal_loaded'
      ).length;
    } catch (error) {
      console.warn('Failed to fetch activity logs from Supabase, falling back to localStorage:', error);
      // Fall back to localStorage
      const logs = isAdmin ? getActivityLogs() : getActivityLogs(userId);
      
      return logs.filter(log => 
        log.activityType === 'deal_created' || 
        log.activityType === 'deal_saved' || 
        log.activityType === 'deal_loaded'
      ).length;
    }
  });
};

/**
 * Calculate total deals for a user (sync version - deprecated, use getTotalDealsAsync)
 * For admin, counts all deals. For other users, counts only their deals.
 * 
 * @param userId - Current user ID
 * @param isAdmin - Whether the user is an admin
 * @returns Total number of deals
 * @deprecated Use getTotalDealsAsync instead
 */
export const getTotalDeals = (userId: string, isAdmin: boolean): number => {
  try {
    const dealsData = localStorage.getItem('deals-storage');
    if (!dealsData) {
      return 0;
    }

    const deals = JSON.parse(dealsData);
    
    if (isAdmin) {
      // Admin sees all deals
      return deals.length;
    } else {
      // Non-admin sees only their own deals
      return deals.filter((deal: any) => deal.userId === userId).length;
    }
  } catch (error) {
    console.warn('Failed to calculate total deals:', error);
    return 0;
  }
};

/**
 * Calculate active projects (deals modified in last 30 days) (sync version - deprecated)
 * For admin, counts all active deals. For other users, counts only their active deals.
 * 
 * @param userId - Current user ID
 * @param isAdmin - Whether the user is an admin
 * @returns Number of active projects
 * @deprecated Use getActiveProjectsAsync instead
 */
export const getActiveProjects = (userId: string, isAdmin: boolean): number => {
  try {
    const dealsData = localStorage.getItem('deals-storage');
    if (!dealsData) {
      return 0;
    }

    const deals = JSON.parse(dealsData);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let filteredDeals = deals;
    
    // Filter by user if not admin
    if (!isAdmin) {
      filteredDeals = deals.filter((deal: any) => deal.userId === userId);
    }

    // Count deals modified in last 30 days
    return filteredDeals.filter((deal: any) => {
      const updatedAt = new Date(deal.updatedAt);
      return updatedAt >= thirtyDaysAgo;
    }).length;
  } catch (error) {
    console.warn('Failed to calculate active projects:', error);
    return 0;
  }
};

/**
 * Calculate total calculations (deal saves + loads) from activity log (sync version - deprecated)
 * For admin, counts all users' calculations. For other users, counts only their calculations.
 * 
 * @param userId - Current user ID
 * @param isAdmin - Whether the user is an admin
 * @returns Total number of calculations
 * @deprecated Use getTotalCalculationsAsync instead
 */
export const getTotalCalculations = (userId: string, isAdmin: boolean): number => {
  try {
    const logs = isAdmin ? getActivityLogs() : getActivityLogs(userId);
    
    // Count deal_created, deal_saved, and deal_loaded activities
    return logs.filter(log => 
      log.activityType === 'deal_created' || 
      log.activityType === 'deal_saved' || 
      log.activityType === 'deal_loaded'
    ).length;
  } catch (error) {
    console.warn('Failed to calculate total calculations:', error);
    return 0;
  }
};
