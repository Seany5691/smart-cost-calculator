# Design Document

## Overview

This design document outlines the technical approach for migrating user activity logs and saved deals from browser localStorage to Supabase database. The primary goal is to enable cross-device data access while maintaining backward compatibility and ensuring zero data loss during the transition.

### Design Principles

1. **Zero Data Loss**: All existing localStorage data must be migrated safely
2. **Backward Compatibility**: System must work with both localStorage and Supabase during transition
3. **Graceful Degradation**: Fall back to localStorage if Supabase is unavailable
4. **Non-Breaking Changes**: All existing functionality must continue to work
5. **Performance**: Minimize impact on application load time and responsiveness

## Architecture

### System Components

The application follows a Next.js architecture with the following key components:

- **Frontend**: React components with TypeScript
- **State Management**: Zustand stores (calculator, config, auth)
- **Data Storage**: Supabase (primary) + localStorage (fallback)
- **Database**: PostgreSQL via Supabase

### Affected Components

1. **Activity Logger** (`src/lib/activityLogger.ts`)
   - Add Supabase integration for activity logging
   - Maintain localStorage fallback

2. **Calculator Store** (`src/store/calculator.ts`)
   - Update saveDeal() to use Supabase
   - Update loadDeal() to use Supabase
   - Add migration logic

3. **Deals Pages** (`src/app/deals/page.tsx`, `src/app/my-deals/page.tsx`, `src/app/admin/deals/page.tsx`)
   - Update to fetch deals from Supabase
   - Update delete operations to use Supabase

4. **Dashboard** (`src/app/page.tsx`)
   - Update activity timeline to use Supabase
   - Update statistics to use Supabase data

5. **Supabase Client** (`src/lib/supabase.ts`)
   - Add helper functions for activity logs
   - Add helper functions for deal operations

## Database Schema

### Activity Logs Table

```sql
CREATE TABLE activity_logs (
    id VARCHAR(255) PRIMARY KEY,
    userId UUID NOT NULL REFERENCES users(id),
    username VARCHAR(255) NOT NULL,
    userRole VARCHAR(50) NOT NULL CHECK (userRole IN ('admin', 'manager', 'user')),
    activityType VARCHAR(50) NOT NULL CHECK (activityType IN ('deal_created', 'deal_saved', 'proposal_generated', 'pdf_generated', 'deal_loaded')),
    dealId VARCHAR(255),
    dealName VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(userId);
CREATE INDEX idx_activity_logs_activity_type ON activity_logs(activityType);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_user_timestamp ON activity_logs(userId, timestamp DESC);
```

### Deal Calculations Table Updates

The existing `deal_calculations` table already exists but needs to ensure it matches the localStorage structure:

```sql
-- Verify/update deal_calculations table structure
ALTER TABLE deal_calculations 
ADD COLUMN IF NOT EXISTS id VARCHAR(255) PRIMARY KEY;
```


## Components and Interfaces

### 1. Activity Logger Service Enhancement

#### Current Implementation
- Stores activity logs in localStorage with key `activity-logs`
- Limits to 100 logs per user
- Provides functions: `logActivity()`, `getActivityLogs()`, `getUniqueUsers()`

#### New Implementation

**File**: `src/lib/activityLogger.ts`

**New Functions**:
```typescript
// Save activity to Supabase
export const logActivityToSupabase = async (activity: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> => {
  try {
    const log: ActivityLog = {
      ...activity,
      id: generateId(),
      timestamp: new Date().toISOString()
    };

    const { error } = await supabase
      .from('activity_logs')
      .insert(log);

    if (error) throw error;
  } catch (error) {
    console.warn('Failed to log activity to Supabase, falling back to localStorage:', error);
    // Fall back to localStorage
    logActivityToLocalStorage(activity);
  }
};

// Get activity logs from Supabase
export const getActivityLogsFromSupabase = async (userId?: string): Promise<ActivityLog[]> => {
  try {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (userId) {
      query = query.eq('userId', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('Failed to retrieve activity logs from Supabase, falling back to localStorage:', error);
    return getActivityLogsFromLocalStorage(userId);
  }
};

// Migrate localStorage activity logs to Supabase
export const migrateActivityLogsToSupabase = async (): Promise<boolean> => {
  try {
    const localLogs = getActivityLogsFromLocalStorage();
    
    if (localLogs.length === 0) {
      return true; // Nothing to migrate
    }

    // Check if migration already done
    const migrationKey = 'activity-logs-migrated';
    if (localStorage.getItem(migrationKey) === 'true') {
      return true;
    }

    // Batch insert to Supabase
    const { error } = await supabase
      .from('activity_logs')
      .upsert(localLogs, { onConflict: 'id' });

    if (error) throw error;

    // Mark migration as complete
    localStorage.setItem(migrationKey, 'true');
    return true;
  } catch (error) {
    console.error('Failed to migrate activity logs to Supabase:', error);
    return false;
  }
};
```

**Integration Points**:
- Update `logActivity()` to call `logActivityToSupabase()` instead of localStorage
- Update `getActivityLogs()` to call `getActivityLogsFromSupabase()` instead of localStorage
- Add migration call in app initialization

### 2. Calculator Store Enhancement

#### Current Implementation
- Saves deals to localStorage with key `deals-storage`
- Tracks current deal ID for update vs create
- Logs activities when deals are saved/loaded

#### New Implementation

**File**: `src/store/calculator.ts`

**Updated saveDeal() Method**:
```typescript
saveDeal: async () => {
  const { sections, dealDetails, currentDealId, originalUserContext } = get();
  const user = useAuthStore.getState().user;

  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const totals = get().calculateTotalCosts();
    
    const dealData = {
      id: currentDealId || `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: originalUserContext?.userId || user.id,
      username: originalUserContext?.username || user.username,
      userRole: originalUserContext?.role || user.role,
      customerName: dealDetails.customerName,
      dealName: dealDetails.customerName,
      dealDetails,
      sectionsData: sections,
      totalsData: totals,
      factorsData: get().factors,
      scalesData: get().scales,
      createdAt: currentDealId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (currentDealId) {
      // Update existing deal
      const { error } = await supabase
        .from('deal_calculations')
        .update(dealData)
        .eq('id', currentDealId);

      if (error) throw error;

      // Log activity
      await logActivityToSupabase({
        userId: user.id,
        username: user.username,
        userRole: user.role,
        activityType: 'deal_saved',
        dealId: currentDealId,
        dealName: dealDetails.customerName
      });
    } else {
      // Create new deal
      const { error } = await supabase
        .from('deal_calculations')
        .insert(dealData);

      if (error) throw error;

      // Set current deal ID
      set({ currentDealId: dealData.id });

      // Log activity
      await logActivityToSupabase({
        userId: user.id,
        username: user.username,
        userRole: user.role,
        activityType: 'deal_created',
        dealId: dealData.id,
        dealName: dealDetails.customerName
      });
    }

    toast.success('Deal Saved', 'Your deal has been saved successfully.');
    return true;
  } catch (error) {
    console.error('Failed to save deal to Supabase, falling back to localStorage:', error);
    // Fall back to localStorage implementation
    return saveDealToLocalStorage();
  }
}
```


**Updated loadDeal() Method**:
```typescript
loadDeal: async (dealId: string) => {
  try {
    const { data: deal, error } = await supabase
      .from('deal_calculations')
      .select('*')
      .eq('id', dealId)
      .single();

    if (error) throw error;

    if (!deal) {
      throw new Error('Deal not found');
    }

    const user = useAuthStore.getState().user;

    set({
      sections: deal.sectionsData,
      dealDetails: deal.dealDetails,
      currentDealId: dealId,
      originalUserContext: {
        userId: deal.userId,
        username: deal.username,
        role: deal.userRole
      }
    });

    // Log activity
    if (user) {
      await logActivityToSupabase({
        userId: user.id,
        username: user.username,
        userRole: user.role,
        activityType: 'deal_loaded',
        dealId: dealId,
        dealName: deal.customerName
      });
    }

    return deal;
  } catch (error) {
    console.error('Failed to load deal from Supabase, falling back to localStorage:', error);
    return loadDealFromLocalStorage(dealId);
  }
}
```

**Migration Function**:
```typescript
// Add to calculator store initialization
const migrateDealsToSupabase = async (): Promise<boolean> => {
  try {
    const localDeals = JSON.parse(localStorage.getItem('deals-storage') || '[]');
    
    if (localDeals.length === 0) {
      return true;
    }

    // Check if migration already done
    const migrationKey = 'deals-migrated';
    if (localStorage.getItem(migrationKey) === 'true') {
      return true;
    }

    // Transform deals to match Supabase schema
    const dealsToMigrate = localDeals.map((deal: any) => ({
      id: deal.id,
      userId: deal.userId,
      username: deal.username,
      userRole: deal.userRole,
      customerName: deal.customerName || deal.dealDetails?.customerName,
      dealName: deal.customerName || deal.dealDetails?.customerName,
      dealDetails: deal.dealDetails,
      sectionsData: deal.sections,
      totalsData: deal.totals,
      factorsData: deal.factors,
      scalesData: deal.scales,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt
    }));

    // Batch insert to Supabase
    const { error } = await supabase
      .from('deal_calculations')
      .upsert(dealsToMigrate, { onConflict: 'id' });

    if (error) throw error;

    // Mark migration as complete
    localStorage.setItem(migrationKey, 'true');
    return true;
  } catch (error) {
    console.error('Failed to migrate deals to Supabase:', error);
    return false;
  }
};
```

### 3. Supabase Helper Functions

**File**: `src/lib/supabase.ts`

**Add to supabaseHelpers**:
```typescript
// Activity logs
async getActivityLogs(userId?: string, limit: number = 100) {
  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('userId', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
},

async createActivityLog(log: any) {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert(log)
    .select()
    .single();

  if (error) throw error;
  return data;
},

// Deal calculations
async getDeals(userId?: string, isAdmin: boolean = false) {
  let query = supabase
    .from('deal_calculations')
    .select('*')
    .order('createdAt', { ascending: false });

  // Non-admin users can only see their own deals
  if (!isAdmin && userId) {
    query = query.eq('userId', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
},

async getDealById(dealId: string) {
  const { data, error } = await supabase
    .from('deal_calculations')
    .select('*')
    .eq('id', dealId)
    .single();

  if (error) throw error;
  return data;
},

async createDeal(deal: any) {
  const { data, error } = await supabase
    .from('deal_calculations')
    .insert(deal)
    .select()
    .single();

  if (error) throw error;
  return data;
},

async updateDeal(dealId: string, updates: any) {
  const { data, error } = await supabase
    .from('deal_calculations')
    .update(updates)
    .eq('id', dealId)
    .select()
    .single();

  if (error) throw error;
  return data;
},

async deleteDeal(dealId: string) {
  const { error } = await supabase
    .from('deal_calculations')
    .delete()
    .eq('id', dealId);

  if (error) throw error;
  return true;
}
```

### 4. Deals Pages Updates

**Files**: 
- `src/app/deals/page.tsx`
- `src/app/my-deals/page.tsx`
- `src/app/admin/deals/page.tsx`

**Changes**:
```typescript
// Replace localStorage fetch with Supabase
const loadDeals = async () => {
  try {
    setIsLoading(true);
    
    const user = useAuthStore.getState().user;
    const isAdmin = user?.role === 'admin';
    
    const deals = await supabaseHelpers.getDeals(user?.id, isAdmin);
    
    setDeals(deals);
  } catch (error) {
    console.error('Failed to load deals:', error);
    toast.error('Failed to Load Deals', 'Could not retrieve deals from database.');
  } finally {
    setIsLoading(false);
  }
};

// Replace localStorage delete with Supabase
const handleDeleteDeal = async (dealId: string) => {
  try {
    await supabaseHelpers.deleteDeal(dealId);
    toast.success('Deal Deleted', 'Deal has been removed successfully.');
    loadDeals(); // Refresh list
  } catch (error) {
    console.error('Failed to delete deal:', error);
    toast.error('Delete Failed', 'Could not delete deal.');
  }
};
```


### 5. Dashboard Activity Timeline Updates

**File**: `src/app/page.tsx` or activity timeline component

**Changes**:
```typescript
// Replace localStorage fetch with Supabase
const loadActivityLogs = async (userId?: string) => {
  try {
    const logs = await supabaseHelpers.getActivityLogs(userId);
    setActivityLogs(logs);
  } catch (error) {
    console.error('Failed to load activity logs:', error);
    // Fall back to localStorage
    const localLogs = getActivityLogsFromLocalStorage(userId);
    setActivityLogs(localLogs);
  }
};
```

### 6. Migration Component

**File**: `src/components/MigrationHandler.tsx` (New)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { migrateActivityLogsToSupabase } from '@/lib/activityLogger';
import { migrateDealsToSupabase } from '@/store/calculator';

export default function MigrationHandler() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    const runMigration = async () => {
      // Check if migration already completed
      const activityMigrated = localStorage.getItem('activity-logs-migrated') === 'true';
      const dealsMigrated = localStorage.getItem('deals-migrated') === 'true';

      if (activityMigrated && dealsMigrated) {
        return;
      }

      setIsMigrating(true);

      try {
        // Migrate activity logs
        if (!activityMigrated) {
          await migrateActivityLogsToSupabase();
        }

        // Migrate deals
        if (!dealsMigrated) {
          await migrateDealsToSupabase();
        }

        setMigrationComplete(true);
      } catch (error) {
        console.error('Migration failed:', error);
      } finally {
        setIsMigrating(false);
      }
    };

    runMigration();
  }, []);

  if (!isMigrating && !migrationComplete) {
    return null;
  }

  return (
    <>
      {isMigrating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Migrating Data</h3>
            <p className="text-gray-600 mb-4">
              We're upgrading your data storage. This will only take a moment...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      )}

      {migrationComplete && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50">
          <p className="font-semibold">Migration Complete!</p>
          <p className="text-sm">Your data is now synced across all devices.</p>
        </div>
      )}
    </>
  );
}
```

## Data Models

### Activity Log Interface

```typescript
interface ActivityLog {
  id: string;                    // Unique identifier
  userId: string;                // User who performed action (UUID)
  username: string;              // Username for display
  userRole: 'admin' | 'manager' | 'user';
  activityType: ActivityType;    // Type of activity
  dealId?: string;               // Associated deal ID (if applicable)
  dealName?: string;             // Customer name for display
  timestamp: string;             // ISO 8601 timestamp
  metadata?: Record<string, any>; // Additional context
}

type ActivityType = 
  | 'deal_created'
  | 'deal_saved'
  | 'proposal_generated'
  | 'pdf_generated'
  | 'deal_loaded';
```

### Deal Calculation Interface

```typescript
interface DealCalculation {
  id: string;                    // Unique identifier
  userId: string;                // User who created deal (UUID)
  username: string;              // Username for display
  userRole: string;              // User role at time of creation
  dealName: string;              // Deal/customer name
  customerName: string;          // Customer name
  dealDetails: DealDetails;      // Deal configuration
  sectionsData: Section[];       // Calculator sections
  totalsData: TotalCosts;        // Calculated totals
  factorsData: any;              // Financing factors
  scalesData: any;               // Pricing scales
  pdfUrl?: string;               // Generated PDF URL
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

## Error Handling

### Supabase Connection Errors

**Strategy**: Graceful degradation to localStorage

```typescript
try {
  await supabaseOperation();
} catch (error) {
  console.warn('Supabase operation failed, using localStorage:', error);
  return localStorageOperation();
}
```

### Migration Errors

**Strategy**: Log error and continue with localStorage

```typescript
try {
  await migrateToSupabase();
} catch (error) {
  console.error('Migration failed:', error);
  // Don't block user, continue with localStorage
}
```

### Data Conflict Resolution

**Strategy**: Use most recent timestamp

```typescript
const resolveConflict = (localData: any, remoteData: any) => {
  const localTime = new Date(localData.updatedAt).getTime();
  const remoteTime = new Date(remoteData.updatedAt).getTime();
  return remoteTime > localTime ? remoteData : localData;
};
```

## Performance Considerations

### Query Optimization

- Use indexes on frequently queried columns (userId, timestamp, activityType)
- Limit query results to prevent large data transfers
- Use pagination for large datasets

### Caching Strategy

- Cache frequently accessed data in memory
- Invalidate cache on data updates
- Use stale-while-revalidate pattern for better UX

### Batch Operations

- Batch insert operations during migration
- Use upsert for conflict resolution
- Limit batch size to prevent timeouts

## Security Considerations

### Row Level Security

```sql
-- Activity logs: Users can only see their own, admins see all
CREATE POLICY "Users can view own activity logs" ON activity_logs
  FOR SELECT USING (auth.uid() = userId OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert own activity logs" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() = userId);

-- Deal calculations: Users can only see their own, admins see all
CREATE POLICY "Users can view own deals" ON deal_calculations
  FOR SELECT USING (auth.uid() = userId OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert own deals" ON deal_calculations
  FOR INSERT WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update own deals" ON deal_calculations
  FOR UPDATE USING (auth.uid() = userId);

CREATE POLICY "Users can delete own deals" ON deal_calculations
  FOR DELETE USING (auth.uid() = userId);
```

### Data Validation

- Validate all input data before saving to Supabase
- Sanitize user-provided strings
- Verify user permissions before operations

## Testing Strategy

### Unit Tests

- Test activity logger functions with mocked Supabase
- Test calculator store methods with mocked Supabase
- Test migration functions with sample data

### Integration Tests

- Test end-to-end flow: create deal → save → load → delete
- Test activity logging across different actions
- Test migration with various localStorage states

### Manual Testing Checklist

- [ ] Create new deal and verify it saves to Supabase
- [ ] Update existing deal and verify changes persist
- [ ] Load deal from different device/browser
- [ ] View activity timeline and verify logs appear
- [ ] Test admin view of all users' activities
- [ ] Test migration with existing localStorage data
- [ ] Test fallback to localStorage when Supabase unavailable
- [ ] Test concurrent access from multiple devices
- [ ] Verify role-based access control works correctly

## Deployment Considerations

### Database Migration

1. Run SQL schema updates on Supabase
2. Verify tables and indexes created successfully
3. Test RLS policies with different user roles

### Application Deployment

1. Deploy code changes to staging environment
2. Test migration with production-like data
3. Monitor error logs for any issues
4. Deploy to production during low-traffic period
5. Monitor Supabase dashboard for query performance

### Rollback Plan

1. Keep localStorage implementation as fallback
2. Add feature flag to disable Supabase integration
3. Document rollback procedure
4. Have database backup ready

### 7. Scraper Industries Integration

**File**: `src/app/scraper/page.tsx`

**Changes**:
```typescript
// Add Supabase helper functions
const loadIndustries = async () => {
  try {
    const { data, error } = await supabase
      .from('scraper_industries')
      .select('*')
      .eq('isActive', true)
      .order('name');

    if (error) throw error;
    return data.map(i => i.name);
  } catch (error) {
    console.warn('Failed to load industries from Supabase, using localStorage:', error);
    const stored = localStorage.getItem('smart-scrape-industries');
    return stored ? JSON.parse(stored) : [];
  }
};

const saveIndustry = async (industryName: string) => {
  try {
    const { error } = await supabase
      .from('scraper_industries')
      .insert({ name: industryName });

    if (error) throw error;
  } catch (error) {
    console.warn('Failed to save industry to Supabase, using localStorage:', error);
    // Fall back to localStorage
    const stored = localStorage.getItem('smart-scrape-industries');
    const industries = stored ? JSON.parse(stored) : [];
    industries.push(industryName);
    localStorage.setItem('smart-scrape-industries', JSON.stringify(industries));
  }
};

const deleteIndustry = async (industryName: string) => {
  try {
    const { error } = await supabase
      .from('scraper_industries')
      .delete()
      .eq('name', industryName);

    if (error) throw error;
  } catch (error) {
    console.warn('Failed to delete industry from Supabase:', error);
  }
};

// Migration function
const migrateIndustriesToSupabase = async () => {
  try {
    const stored = localStorage.getItem('smart-scrape-industries');
    if (!stored) return true;

    const migrationKey = 'industries-migrated';
    if (localStorage.getItem(migrationKey) === 'true') return true;

    const industries = JSON.parse(stored);
    const industriesToInsert = industries.map((name: string) => ({ name }));

    const { error } = await supabase
      .from('scraper_industries')
      .upsert(industriesToInsert, { onConflict: 'name' });

    if (error) throw error;

    localStorage.setItem(migrationKey, 'true');
    return true;
  } catch (error) {
    console.error('Failed to migrate industries:', error);
    return false;
  }
};
```

### 8. Scraper Saved Sessions Integration

**File**: `src/app/scraper/page.tsx`

**Changes**:
```typescript
// Add Supabase helper functions
const loadSavedSessions = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('scraper_saved_sessions')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('Failed to load saved sessions from Supabase, using localStorage:', error);
    const stored = localStorage.getItem('smart-scrape-sessions');
    return stored ? JSON.parse(stored) : [];
  }
};

const saveScraper Session = async (userId: string, sessionData: any) => {
  try {
    const { error } = await supabase
      .from('scraper_saved_sessions')
      .insert({
        userId,
        sessionName: sessionData.name,
        towns: sessionData.towns,
        industries: sessionData.industries,
        config: sessionData.config
      });

    if (error) throw error;
    toast.success('Session Saved', 'Your scraper configuration has been saved.');
  } catch (error) {
    console.warn('Failed to save session to Supabase, using localStorage:', error);
    // Fall back to localStorage
    const stored = localStorage.getItem('smart-scrape-sessions');
    const sessions = stored ? JSON.parse(stored) : [];
    sessions.push(sessionData);
    localStorage.setItem('smart-scrape-sessions', JSON.stringify(sessions));
    toast.success('Session Saved Locally', 'Your configuration has been saved locally.');
  }
};

const deleteSavedSession = async (sessionId: string) => {
  try {
    const { error } = await supabase
      .from('scraper_saved_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  } catch (error) {
    console.warn('Failed to delete session from Supabase:', error);
  }
};

// Migration function
const migrateSavedSessionsToSupabase = async (userId: string) => {
  try {
    const stored = localStorage.getItem('smart-scrape-sessions');
    if (!stored) return true;

    const migrationKey = 'scraper-sessions-migrated';
    if (localStorage.getItem(migrationKey) === 'true') return true;

    const sessions = JSON.parse(stored);
    const sessionsToInsert = sessions.map((session: any) => ({
      userId,
      sessionName: session.name,
      towns: session.towns,
      industries: session.industries,
      config: session.config || {}
    }));

    const { error } = await supabase
      .from('scraper_saved_sessions')
      .insert(sessionsToInsert);

    if (error) throw error;

    localStorage.setItem(migrationKey, 'true');
    return true;
  } catch (error) {
    console.error('Failed to migrate saved sessions:', error);
    return false;
  }
};
```

## Future Enhancements

### Potential Improvements (Out of Scope)

1. **Real-time Sync**: Use Supabase real-time subscriptions for live updates
2. **Offline Support**: Implement service worker for offline functionality
3. **Data Export**: Allow users to export their data as CSV/JSON
4. **Activity Analytics**: Add charts and insights for activity patterns
5. **Audit Trail**: Track all data changes with full history
6. **Data Archival**: Archive old deals and activities to reduce query load
