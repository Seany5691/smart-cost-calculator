# Implementation Plan

- [x] 1. Create mobile detection and utility infrastructure





  - Create `src/hooks/useIsMobile.ts` hook with breakpoint detection at 768px
  - Implement `window.matchMedia` listener with cleanup
  - Export `isMobile`, `isTablet`, and `isDesktop` boolean values
  - Create `src/lib/utils/debounce.ts` with `useDebounce` hook
  - Implement debounce with proper cleanup and dependency tracking
  - _Requirements: 1.5, 4.1, 4.2_

- [x] 2. Create skeleton loader components





  - Create `src/components/ui/skeletons.tsx` file
  - Implement `StatCardSkeleton` component with pulsing animation
  - Implement `ActivityCardSkeleton` component matching activity card layout
  - Implement `DashboardSkeleton` component combining all skeleton states
  - Add mobile-specific sizing and spacing adjustments
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 3. Optimize dashboard statistics queries for mobile





  - Add `getDashboardStatsOptimized()` function to `src/lib/dashboardStats.ts`
  - Implement device-aware query strategy (single query for mobile, multiple for desktop)
  - Create Supabase RPC function `get_dashboard_stats` for batched queries
  - Add localStorage persistence for dashboard stats cache
  - Implement 5-minute TTL for memory cache and 15-minute TTL for localStorage
  - Update cache invalidation logic to clear both memory and localStorage
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [x] 4. Update Dashboard page with mobile optimizations












  - Update `src/app/page.tsx` to use `useIsMobile` hook
  - Replace stats loading with `getDashboardStatsOptimized()` when on mobile
  - Add skeleton loaders during stats loading state
  - Implement conditional animation delays (disabled on mobile)
  - Pass `isMobile` prop to `ActivityTimeline` component
  - Reduce `AnimatedBackground` particle count by 75% on mobile devices
  - _Requirements: 1.1, 1.2, 3.1, 3.3, 5.2_

- [x] 5. Implement pagination in ActivityTimeline component





  - Update `src/components/dashboard/ActivityTimeline.tsx` to accept `isMobile` prop
  - Add pagination state management (currentPage, hasMore, isLoadingMore)
  - Implement initial load with 20 records for mobile, 50 for desktop
  - Create infinite scroll detection (trigger at 100px from bottom)
  - Implement "Load More" functionality with loading indicator
  - Add "No more activities" message when all records loaded
  - Debounce scroll events by 100ms
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 6. Add debouncing to admin user filter
  - Update admin dropdown change handler in `ActivityTimeline.tsx`
  - Implement 300ms debounce for mobile, 150ms for desktop
  - Add loading state to dropdown during debounce period
  - Cancel pending requests when filter changes rapidly
  - Reset pagination to first page on filter change
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7. Optimize animations for mobile devices
  - Update `src/components/ui/modern.tsx` components
  - Add mobile detection to `AnimatedBackground` component
  - Reduce particle count from 20 to 5 on mobile
  - Disable staggered animation delays on mobile
  - Reduce transition durations from 300ms to 150ms on mobile
  - Simplify hover effects on mobile (use only transform and opacity)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 8. Implement error handling and retry functionality
  - Add error state management to Dashboard page
  - Create error UI component with retry button
  - Implement retry logic for failed Supabase queries
  - Add fallback to localStorage when Supabase fails
  - Display user-friendly error messages
  - Add error state to ActivityTimeline with retry option
  - _Requirements: 5.4, 5.5_

- [ ] 9. Add Supabase RPC function for optimized stats query
  - Create SQL migration file for `get_dashboard_stats` RPC function
  - Implement function to return totalDeals, activeProjects, and calculations in single query
  - Add user filtering logic (admin sees all, users see only their data)
  - Optimize query with proper indexes
  - Test RPC function with admin and non-admin users
  - _Requirements: 1.1_

- [ ] 10. Update Supabase helpers for pagination support
  - Update `src/lib/supabase.ts` with pagination parameters
  - Add `getActivityLogsPaginated()` function with page and pageSize parameters
  - Implement offset-based pagination in Supabase query
  - Return pagination metadata (hasMore, totalCount)
  - Add proper error handling for pagination queries
  - _Requirements: 2.1, 2.2_
