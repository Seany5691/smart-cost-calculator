-- Cleanup Script for Supabase Sync Migration
-- Run this ONLY if you need to start fresh after a failed migration
-- This will remove any partially created tables from the sync migration

-- WARNING: This will delete the following tables if they exist:
-- - activity_logs
-- - scraper_industries  
-- - scraper_saved_sessions
-- And their associated views and policies

-- ============================================================================
-- DROP VIEWS
-- ============================================================================

DROP VIEW IF EXISTS recent_activity_logs CASCADE;
DROP VIEW IF EXISTS user_deal_stats CASCADE;

-- ============================================================================
-- DROP TABLES (CASCADE will drop all policies and constraints)
-- ============================================================================

DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS scraper_industries CASCADE;
DROP TABLE IF EXISTS scraper_saved_sessions CASCADE;

-- ============================================================================
-- RESTORE PERMISSIVE POLICY ON deal_calculations (if needed)
-- ============================================================================

-- Drop any new policies that might have been added
DROP POLICY IF EXISTS "Users can view own deals" ON deal_calculations;
DROP POLICY IF EXISTS "Users can insert own deals" ON deal_calculations;
DROP POLICY IF EXISTS "Users can update own deals" ON deal_calculations;
DROP POLICY IF EXISTS "Users can delete own deals" ON deal_calculations;
DROP POLICY IF EXISTS "Admins can view all deals" ON deal_calculations;
DROP POLICY IF EXISTS "Admins can delete any deal" ON deal_calculations;

-- Restore permissive policy (if it was removed)
DO $$
BEGIN
    -- Check if the permissive policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'deal_calculations' 
        AND policyname = 'Allow all deal operations'
    ) THEN
        -- Recreate permissive policy
        CREATE POLICY "Allow all deal operations" ON deal_calculations 
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check what tables remain
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('activity_logs', 'scraper_industries', 'scraper_saved_sessions')
ORDER BY table_name;

-- Success message
SELECT 'Cleanup completed!' as status,
       'You can now run supabase-sync-migration.sql fresh' as next_step;
