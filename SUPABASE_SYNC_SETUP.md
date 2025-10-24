# Supabase Sync Setup Guide

This guide explains how to set up the Supabase database schema for syncing activity logs, deals, and scraper data from localStorage to Supabase.

## Overview

The Supabase sync feature enables:
- **Cross-device access** to activity logs and saved deals
- **Persistent storage** of user data in PostgreSQL
- **Role-based access control** with Row Level Security (RLS)
- **Seamless migration** from localStorage to Supabase
- **Graceful fallback** to localStorage if Supabase is unavailable

## Database Schema Files

### 1. `supabase-schema.sql` (Base Schema)
The foundation schema that includes:
- Users table with authentication
- Hardware, connectivity, and licensing items
- Factors and scales for calculations
- Deal calculations table (base structure)

**Status**: ✅ Already exists and should be applied first

### 2. `supabase-sync-migration.sql` (Sync Migration)
Adds sync-specific tables and updates:
- **activity_logs** table for tracking user activities
- **scraper_industries** table for custom industries
- **scraper_saved_sessions** table for saved scraper configurations
- Updates **deal_calculations** to use VARCHAR(255) IDs (matches localStorage)
- Implements proper **Row Level Security (RLS)** policies

**Status**: 🆕 New file - apply after base schema

### 3. `test-supabase-sync-schema.sql` (Test Script)
Comprehensive test script that:
- Inserts sample data for all tables
- Verifies table structure and indexes
- Tests query performance
- Validates RLS policies
- Provides detailed test results

**Status**: 🧪 Optional - use for verification

## Setup Instructions

### Step 1: Apply Base Schema (if not already done)

```sql
-- Run in Supabase SQL Editor
-- File: supabase-schema.sql
```

This creates the foundation tables including users, items, and base deal_calculations.

### Step 2: Apply Sync Migration

```sql
-- Run in Supabase SQL Editor
-- File: supabase-sync-migration.sql
```

This adds:
- ✅ activity_logs table with indexes
- ✅ scraper_industries table
- ✅ scraper_saved_sessions table
- ✅ Updates deal_calculations ID type to VARCHAR(255)
- ✅ Implements RLS policies for secure data access
- ✅ Creates helper views for common queries
- ✅ Inserts sample test data

### Step 3: Verify Setup (Optional)

```sql
-- Run in Supabase SQL Editor
-- File: test-supabase-sync-schema.sql
```

This runs comprehensive tests and displays:
- Table row counts
- Index verification
- Query performance analysis
- RLS policy validation
- Summary of all tests

## New Tables

### activity_logs

Stores user activity timeline for cross-device access.

**Columns:**
- `id` (VARCHAR(255), PK) - Unique activity identifier
- `userId` (UUID, FK) - References users.id
- `username` (VARCHAR(255)) - User's display name
- `userRole` (VARCHAR(50)) - User's role (admin, manager, user)
- `activityType` (VARCHAR(50)) - Type of activity (deal_created, deal_saved, etc.)
- `dealId` (VARCHAR(255)) - Associated deal ID (optional)
- `dealName` (VARCHAR(255)) - Customer/deal name (optional)
- `timestamp` (TIMESTAMPTZ) - When activity occurred
- `metadata` (JSONB) - Additional context (optional)
- `createdAt` (TIMESTAMPTZ) - Record creation time

**Indexes:**
- `idx_activity_logs_user_id` - Fast user filtering
- `idx_activity_logs_activity_type` - Filter by activity type
- `idx_activity_logs_timestamp` - Chronological sorting
- `idx_activity_logs_user_timestamp` - Combined user + time queries

**RLS Policies:**
- Users can view their own activity logs
- Admins can view all activity logs
- Users can only insert their own activity logs

### scraper_industries

Stores custom industries for the scraper feature.

**Columns:**
- `id` (UUID, PK) - Unique identifier
- `name` (VARCHAR(255), UNIQUE) - Industry name
- `userId` (UUID, FK) - User who created it (optional)
- `isActive` (BOOLEAN) - Whether industry is active
- `createdAt` (TIMESTAMPTZ) - Creation time
- `updatedAt` (TIMESTAMPTZ) - Last update time

**RLS Policies:**
- All users can view active industries
- Users can insert new industries
- Users can update/delete their own industries
- Admins can update/delete any industry

### scraper_saved_sessions

Stores saved scraper configurations for reuse.

**Columns:**
- `id` (UUID, PK) - Unique identifier
- `userId` (UUID, FK) - References users.id
- `sessionName` (VARCHAR(255)) - Display name for session
- `towns` (TEXT[]) - Array of town names
- `industries` (TEXT[]) - Array of industry names
- `config` (JSONB) - Additional configuration options
- `createdAt` (TIMESTAMPTZ) - Creation time
- `updatedAt` (TIMESTAMPTZ) - Last update time

**RLS Policies:**
- Users can view their own saved sessions
- Admins can view all saved sessions
- Users can insert/update/delete their own sessions

## Updated Tables

### deal_calculations

**Key Changes:**
- ✅ **NO STRUCTURAL CHANGES** - Existing table structure is preserved
- ✅ Adds performance indexes if they don't exist
- ✅ New RLS policies replace permissive "allow all" policy
- ⚠️ **IMPORTANT**: The table already exists with UUID id type - this is fine and works with the sync feature

**New RLS Policies:**
- Users can view their own deals
- Admins can view all deals
- Users can insert/update/delete their own deals
- Admins can delete any deal

**Note**: The migration script does NOT modify the existing `deal_calculations` table structure. It only adds indexes and RLS policies.

## Row Level Security (RLS)

All tables now have proper RLS policies that enforce:

1. **User Isolation**: Users can only access their own data
2. **Admin Override**: Admins can access all users' data
3. **Secure Inserts**: Users can only create records for themselves
4. **Ownership Validation**: Users can only modify their own records

### Testing RLS Policies

The RLS policies use `auth.uid()` to identify the current user. In production, this is automatically set by Supabase Auth. For testing:

```sql
-- Set the current user context (for testing)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO '<user-uuid>';

-- Now queries will respect RLS policies
SELECT * FROM activity_logs; -- Only shows current user's logs
```

## Migration Strategy

The application will automatically migrate localStorage data to Supabase:

1. **On First Load**: Check if migration is needed
2. **Activity Logs**: Migrate all localStorage activity logs
3. **Deals**: Migrate all localStorage deals
4. **Industries**: Migrate custom industries
5. **Sessions**: Migrate saved scraper sessions
6. **Mark Complete**: Set migration flags to prevent duplicates

### Migration Flags (localStorage)

- `activity-logs-migrated` - Activity logs migration complete
- `deals-migrated` - Deals migration complete
- `industries-migrated` - Industries migration complete
- `scraper-sessions-migrated` - Sessions migration complete

## Query Examples

### Get Recent Activity Logs

```sql
-- Get last 100 activities for current user
SELECT * FROM activity_logs
WHERE userId = auth.uid()
ORDER BY timestamp DESC
LIMIT 100;

-- Get all activities (admin only)
SELECT * FROM activity_logs
ORDER BY timestamp DESC
LIMIT 100;
```

### Get User's Deals

```sql
-- Get all deals for current user
SELECT * FROM deal_calculations
WHERE userId = auth.uid()
ORDER BY createdAt DESC;

-- Get all deals (admin only)
SELECT * FROM deal_calculations
ORDER BY createdAt DESC;
```

### Get Active Industries

```sql
-- Get all active industries
SELECT * FROM scraper_industries
WHERE isActive = true
ORDER BY name;
```

### Get Saved Sessions

```sql
-- Get current user's saved sessions
SELECT * FROM scraper_saved_sessions
WHERE userId = auth.uid()
ORDER BY createdAt DESC;
```

## Performance Considerations

### Indexes

All tables have appropriate indexes for common queries:
- User ID lookups
- Timestamp sorting
- Activity type filtering
- Name searches

### Query Limits

The application implements query limits to prevent large data transfers:
- Activity logs: Limited to 100 most recent per user
- Deals: Paginated at 50 per page
- Industries: All active industries (typically < 100)
- Sessions: All user sessions (typically < 20)

### Caching

The application caches frequently accessed data:
- Active industries (shared across users)
- User's recent activity logs
- Deal list (invalidated on updates)

## Troubleshooting

### Migration Issues

**Problem**: Migration fails with "duplicate key" error
**Solution**: Migration has already run. Check localStorage for migration flags.

**Problem**: Data not appearing after migration
**Solution**: Check RLS policies and ensure user is authenticated.

### Query Performance

**Problem**: Queries are slow
**Solution**: Verify indexes exist using:

```sql
SELECT * FROM pg_indexes 
WHERE tablename IN ('activity_logs', 'deal_calculations', 'scraper_industries', 'scraper_saved_sessions');
```

### RLS Policy Issues

**Problem**: User can't see their own data
**Solution**: Verify user is authenticated and `auth.uid()` returns correct UUID:

```sql
SELECT auth.uid(); -- Should return user's UUID
```

**Problem**: Admin can't see all data
**Solution**: Verify user role is 'admin' in users table:

```sql
SELECT * FROM users WHERE id = auth.uid();
```

## Rollback Plan

If issues occur, the application automatically falls back to localStorage:

1. **Supabase Unavailable**: All operations use localStorage
2. **Query Errors**: Fall back to localStorage for that operation
3. **Migration Errors**: Continue using localStorage, log error

To manually disable Supabase sync:
1. Set environment variable: `NEXT_PUBLIC_DISABLE_SUPABASE_SYNC=true`
2. Application will use localStorage exclusively

## Next Steps

After applying the schema:

1. ✅ Verify tables created successfully
2. ✅ Run test script to validate setup
3. ✅ Update application code to use Supabase helpers
4. ✅ Test migration with sample localStorage data
5. ✅ Deploy to production

## Support

For issues or questions:
- Check Supabase logs in dashboard
- Review application console for errors
- Verify RLS policies are correct
- Test queries in Supabase SQL Editor

## Schema Version

- **Base Schema**: v1.0 (supabase-schema.sql)
- **Sync Migration**: v1.0 (supabase-sync-migration.sql)
- **Last Updated**: 2024-10-24
