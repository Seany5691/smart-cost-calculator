/**
 * Dashboard Statistics Utility
 * 
 * Provides functions to calculate statistics for the dashboard
 */

import { getActivityLogs } from './activityLogger';

/**
 * Calculate total deals for a user
 * For admin, counts all deals. For other users, counts only their deals.
 * 
 * @param userId - Current user ID
 * @param isAdmin - Whether the user is an admin
 * @returns Total number of deals
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
 * Calculate active projects (deals modified in last 30 days)
 * For admin, counts all active deals. For other users, counts only their active deals.
 * 
 * @param userId - Current user ID
 * @param isAdmin - Whether the user is an admin
 * @returns Number of active projects
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
 * Calculate total calculations (deal saves + loads) from activity log
 * For admin, counts all users' calculations. For other users, counts only their calculations.
 * 
 * @param userId - Current user ID
 * @param isAdmin - Whether the user is an admin
 * @returns Total number of calculations
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
