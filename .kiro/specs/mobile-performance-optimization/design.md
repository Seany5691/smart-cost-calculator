# Mobile Performance Optimization Design

## Overview

This design document outlines the technical approach for optimizing the Smart Cost Calculator application's performance on mobile devices. The solution implements device-aware optimizations including query batching, pagination, reduced animations, and debouncing while maintaining full functionality on desktop devices.

## Architecture

### Device Detection Strategy

The system will use CSS media queries and React hooks to detect mobile devices:

- **Breakpoint**: 768px (standard tablet/mobile breakpoint)
- **Detection Method**: `window.matchMedia` with React state management
- **Responsive Behavior**: Dynamic adjustment based on viewport changes

### Performance Optimization Layers

1. **Data Layer**: Optimized Supabase queries with batching and pagination
2. **Caching Layer**: Enhanced caching with localStorage persistence
3. **UI Layer**: Conditional rendering and reduced animations
4. **Interaction Layer**: Debounced user inputs and lazy loading

## Components and Interfaces

### 1. Mobile Detection Hook

**File**: `src/hooks/useIsMobile.ts`

```typescript
interface UseIsMobileReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}
```

Custom hook that detects device type and updates on viewport changes.

### 2. Enhanced Dashboard Stats Service

**File**: `src/lib/dashboardStats.ts`


**New Function**: `getDashboardStatsOptimized()`

```typescript
interface DashboardStats {
  totalDeals: number;
  activeProjects: number;
  calculations: number;
}

async function getDashboardStatsOptimized(
  userId: string, 
  isAdmin: boolean, 
  isMobile: boolean
): Promise<DashboardStats>
```

Combines all three statistics queries into a single optimized Supabase call for mobile devices.

### 3. Paginated Activity Timeline

**File**: `src/components/dashboard/ActivityTimeline.tsx`

**New Props**:
```typescript
interface ActivityTimelineProps {
  userRole: 'admin' | 'manager' | 'user';
  currentUserId: string;
  isMobile?: boolean;
  pageSize?: number;
}
```

**State Management**:
```typescript
interface PaginationState {
  currentPage: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  activities: ActivityLog[];
}
```

### 4. Skeleton Loaders

**File**: `src/components/ui/skeletons.tsx`

```typescript
- StatCardSkeleton: Skeleton for statistics cards
- ActivityCardSkeleton: Skeleton for activity timeline items
- DashboardSkeleton: Complete dashboard loading state
```

### 5. Debounce Utility

**File**: `src/lib/utils/debounce.ts`

```typescript
function useDebounce<T>(value: T, delay: number): T
```

Custom hook for debouncing values with cleanup.

### 6. Mobile-Optimized Animations

**File**: `src/components/ui/modern.tsx`

Enhanced components with mobile-aware animation settings:
- Reduced AnimatedBackground particles (75% reduction)
- Simplified transitions
- Disabled staggered delays on mobile

## Data Models

### Enhanced Cache Structure

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PersistentCache {
  stats: CacheEntry<DashboardStats> | null;
  activities: CacheEntry<ActivityLog[]> | null;
  lastSync: number;
}
```

Cache will be stored in both memory and localStorage for persistence across page navigations.

### Pagination Metadata

```typescript
interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
}
```

## Error Handling

### Error Recovery Strategy

1. **Network Errors**: Display error message with retry button
2. **Timeout Errors**: Fall back to cached data if available
3. **Supabase Errors**: Fall back to localStorage data
4. **Cache Expiry**: Silently refresh in background

### Error UI Components

```typescript
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  showRetry: boolean;
}
```

## Testing Strategy

### Performance Metrics

Track and measure:
- Initial page load time (target: < 2s on mobile)
- Time to interactive (target: < 3s on mobile)
- Supabase query count (target: 1-2 queries on initial load)
- Memory usage during scrolling

### Device Testing

Test on:
- Mobile devices (< 768px)
- Tablets (768px - 1024px)
- Desktop (> 1024px)

### Test Scenarios

1. **Cold Start**: First load with no cache
2. **Warm Start**: Load with valid cache
3. **Slow Network**: Simulate 3G connection
4. **Rapid Interactions**: Fast scrolling and filtering
5. **Cache Expiry**: Load after cache TTL expires

## Implementation Details

### Query Optimization

**Desktop Approach** (Current):
```typescript
// 3 separate queries
const [deals, projects, calculations] = await Promise.all([
  getTotalDealsAsync(),
  getActiveProjectsAsync(),
  getTotalCalculationsAsync()
]);
```

**Mobile Approach** (Optimized):
```typescript
// Single query with aggregations
const stats = await supabase
  .rpc('get_dashboard_stats', { user_id: userId, is_admin: isAdmin });
```

### Pagination Implementation

**Initial Load**:
- Mobile: 20 records
- Desktop: 50 records

**Infinite Scroll**:
- Trigger: 100px from bottom
- Load: Next 20 records
- Debounce: 300ms

### Animation Reduction

**Mobile Settings**:
```typescript
const mobileAnimationConfig = {
  particleCount: 5,        // vs 20 on desktop
  animationDuration: 0,    // disable stagger
  transitionDuration: 150, // vs 300 on desktop
  enableHoverEffects: false
};
```

### Cache Strategy

**Memory Cache**:
- TTL: 5 minutes
- Max size: 10 entries
- Eviction: LRU

**localStorage Cache**:
- TTL: 15 minutes
- Sync on: Page load, data update
- Clear on: Logout

### Debounce Configuration

- **Admin Filter**: 300ms on mobile, 150ms on desktop
- **Search Input**: 500ms on mobile, 300ms on desktop
- **Scroll Events**: 100ms on all devices

## Performance Targets

### Mobile Devices

- **Initial Load**: < 2 seconds
- **Supabase Queries**: 1-2 per page load
- **Activity Pagination**: < 500ms per page
- **Smooth Scrolling**: 60 FPS maintained
- **Memory Usage**: < 50MB increase during session

### Desktop Devices

- Maintain current performance levels
- No regression in functionality
- Preserve all animations and effects

## Migration Strategy

### Phase 1: Infrastructure
- Add mobile detection hook
- Create skeleton components
- Implement debounce utilities

### Phase 2: Data Optimization
- Add optimized stats query
- Implement pagination in ActivityTimeline
- Enhance caching with localStorage

### Phase 3: UI Optimization
- Add conditional animations
- Implement skeleton loaders
- Add error recovery UI

### Phase 4: Testing & Refinement
- Performance testing on real devices
- Fine-tune debounce timings
- Optimize cache TTL values

## Backward Compatibility

- Desktop users see no changes
- All existing functionality preserved
- Graceful degradation if optimizations fail
- Fall back to current implementation on errors
