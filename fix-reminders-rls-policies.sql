-- Fix Lead Reminders RLS Policies
-- This removes the auth.uid() dependency since the app uses custom auth

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view reminders on own leads" ON lead_reminders;
DROP POLICY IF EXISTS "Users can insert reminders on own leads" ON lead_reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON lead_reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON lead_reminders;

-- ============================================================================
-- DISABLE RLS TEMPORARILY (we'll use application-level security)
-- ============================================================================

-- Option 1: Disable RLS completely (simplest, relies on application security)
ALTER TABLE lead_reminders DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
    'RLS Status' as check_type,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'lead_reminders';

SELECT 'RLS disabled - reminders now use application-level security' as status;

-- ============================================================================
-- NOTES
-- ============================================================================

-- This disables RLS because:
-- 1. Your app uses custom Zustand auth, not Supabase Auth
-- 2. auth.uid() returns NULL, blocking all inserts
-- 3. Application code already filters by userId
-- 4. All Supabase calls go through your helper functions which enforce userId

-- Security is maintained at the application level:
-- - getLeadReminders(leadId) only returns reminders for that lead
-- - getAllUserReminders(userId) only returns that user's reminders  
-- - createLeadReminder requires userId parameter
-- - All operations check user ownership before executing
