# Migration Safety Guide

## ⚠️ IMPORTANT: Non-Destructive Migration

The `supabase-sync-migration.sql` script is designed to be **NON-DESTRUCTIVE** and will NOT modify any existing tables.

## What This Migration Does

### ✅ SAFE OPERATIONS (What WILL Happen)

1. **Creates NEW tables** (only if they don't exist):
   - `activity_logs` - For tracking user activities
   - `scraper_industries` - For custom industry management
   - `scraper_saved_sessions` - For saved scraper configurations

2. **Adds indexes** (only if they don't exist):
   - Performance indexes on `activity_logs`
   - Performance indexes on `deal_calculations` (existing table)
   - Performance indexes on new tables

3. **Adds RLS policies**:
   - Security policies for `activity_logs`
   - Security policies for `deal_calculations` (replaces permissive policy)
   - Security policies for `scraper_industries`
   - Security policies for `scraper_saved_sessions`

4. **Creates helper views**:
   - `recent_activity_logs` - View for recent activities
   - `user_deal_stats` - View for deal statistics

5. **Inserts sample data** (optional, safe to skip):
   - 3 sample activity logs for testing
   - Sample data uses `ON CONFLICT DO NOTHING` to prevent duplicates

### ❌ WILL NOT HAPPEN (Guaranteed)

1. **NO table structure changes** to existing tables:
   - `deal_calculations` structure remains unchanged
   - `users` table remains unchanged
   - `scraper_sessions` remains unchanged
   - All other existing tables remain unchanged

2. **NO data deletion**:
   - Existing data is never deleted
   - Existing records are never modified

3. **NO column type changes**:
   - `deal_calculations.id` remains UUID (not changed to VARCHAR)
   - All existing column types remain the same

4. **NO constraint modifications**:
   - Existing primary keys remain unchanged
   - Existing foreign keys remain unchanged
   - Existing unique constraints remain unchanged

## Existing Table Structure (Preserved)

Based on your current database, these tables exist and will NOT be modified:

```
✅ users (id: UUID, username: VARCHAR, etc.)
✅ deal_calculations (id: UUID, userId: UUID, etc.) - camelCase columns
✅ scraper_sessions (id: UUID, userid: UUID, etc.) - snake_case columns
✅ scraper_businesses (id: UUID, sessionid: VARCHAR, etc.)
✅ scraper_logs (id: UUID, sessionid: VARCHAR, etc.)
✅ hardware_items (id: VARCHAR, camelCase columns)
✅ connectivity_items (id: VARCHAR, camelCase columns)
✅ licensing_items (id: VARCHAR, camelCase columns)
✅ factors (id: UUID)
✅ scales (id: UUID)
```

## Column Naming Conventions

Your database uses a mix of naming conventions (this is fine and will be preserved):

- **camelCase**: `deal_calculations` uses `userId`, `createdAt`, `dealName`, etc.
- **snake_case**: `scraper_sessions` uses `userid`, `sessionid`, etc.
- **Mixed**: Some tables use camelCase, others use snake_case

The migration script respects these conventions and does not change them.

## RLS Policy Changes

The only potentially breaking change is replacing the permissive RLS policy on `deal_calculations`:

**Before:**
```sql
CREATE POLICY "Allow all deal operations" ON deal_calculations FOR ALL USING (true);
```

**After:**
```sql
-- Users can only see their own deals (admins see all)
CREATE POLICY "Users can view own deals" ON deal_calculations
FOR SELECT USING ("userId" = auth.uid() OR EXISTS (...admin check...));

-- Similar policies for INSERT, UPDATE, DELETE
```

**Impact**: If you're currently relying on the permissive policy, you'll need to ensure:
1. Users are properly authenticated (`auth.uid()` returns their UUID)
2. User roles are correctly set in the `users` table
3. Admin users have `role = 'admin'` in the `users` table

## Rollback Plan

If you need to rollback the RLS policies:

```sql
-- Drop new RLS policies
DROP POLICY IF EXISTS "Users can view own deals" ON deal_calculations;
DROP POLICY IF EXISTS "Users can insert own deals" ON deal_calculations;
DROP POLICY IF EXISTS "Users can update own deals" ON deal_calculations;
DROP POLICY IF EXISTS "Users can delete own deals" ON deal_calculations;
DROP POLICY IF EXISTS "Admins can view all deals" ON deal_calculations;
DROP POLICY IF EXISTS "Admins can delete any deal" ON deal_calculations;

-- Restore permissive policy
CREATE POLICY "Allow all deal operations" ON deal_calculations 
FOR ALL USING (true) WITH CHECK (true);
```

## Pre-Migration Checklist

Before running the migration:

- [ ] Backup your database (Supabase provides automatic backups)
- [ ] Review the migration script
- [ ] Verify you have admin access to Supabase
- [ ] Test in a development/staging environment first (if available)
- [ ] Ensure no active users are performing critical operations

## Post-Migration Verification

After running the migration:

1. **Verify new tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('activity_logs', 'scraper_industries', 'scraper_saved_sessions');
   ```

2. **Verify existing tables unchanged:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'deal_calculations' 
   ORDER BY ordinal_position;
   ```

3. **Verify RLS policies:**
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

4. **Test basic queries:**
   ```sql
   -- Should work (returns your data)
   SELECT * FROM activity_logs WHERE "userId" = auth.uid();
   
   -- Should work (returns your deals)
   SELECT * FROM deal_calculations WHERE "userId" = auth.uid();
   ```

## Support

If you encounter any issues:

1. Check Supabase logs in the dashboard
2. Verify RLS policies are correct
3. Ensure users are properly authenticated
4. Review the rollback plan above
5. Contact support with specific error messages

## Summary

✅ **Safe to run** - No existing data or structure will be modified
✅ **Non-destructive** - Only adds new tables, indexes, and policies
✅ **Reversible** - RLS policies can be rolled back if needed
✅ **Tested** - Includes test script for verification

The migration is designed to be safe and non-invasive to your existing database structure.
