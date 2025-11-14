-- Fix RLS Policies for Leads Management
-- This removes the auth.uid() dependency since the app uses custom authentication

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

-- Drop all existing policies on leads tables
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON leads;

DROP POLICY IF EXISTS "Users can view own routes" ON routes;
DROP POLICY IF EXISTS "Users can insert own routes" ON routes;
DROP POLICY IF EXISTS "Users can update own routes" ON routes;
DROP POLICY IF EXISTS "Users can delete own routes" ON routes;

DROP POLICY IF EXISTS "Users can view notes on own leads" ON lead_notes;
DROP POLICY IF EXISTS "Users can insert notes on own leads" ON lead_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON lead_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON lead_notes;

DROP POLICY IF EXISTS "Users can view interactions on own leads" ON lead_interactions;
DROP POLICY IF EXISTS "Users can insert interactions on own leads" ON lead_interactions;

-- ============================================================================
-- DISABLE RLS (Since we're using custom auth, not Supabase Auth)
-- ============================================================================

ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE PERMISSIVE POLICIES (Allow all operations)
-- ============================================================================
-- Note: User isolation is handled at the application level through the userId field
-- The Supabase helpers always filter by userId, ensuring data isolation

-- Re-enable RLS with permissive policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;

-- Leads policies - allow all operations (app-level filtering by userId)
CREATE POLICY "Allow all leads operations" ON leads FOR ALL USING (true) WITH CHECK (true);

-- Routes policies - allow all operations (app-level filtering by userId)
CREATE POLICY "Allow all routes operations" ON routes FOR ALL USING (true) WITH CHECK (true);

-- Lead notes policies - allow all operations (app-level filtering by userId)
CREATE POLICY "Allow all lead_notes operations" ON lead_notes FOR ALL USING (true) WITH CHECK (true);

-- Lead interactions policies - allow all operations (app-level filtering by userId)
CREATE POLICY "Allow all lead_interactions operations" ON lead_interactions FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled with permissive policies
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
AND tablename IN ('leads', 'routes', 'lead_notes', 'lead_interactions');

-- Show all policies
SELECT 
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('leads', 'routes', 'lead_notes', 'lead_interactions');

-- Success message
SELECT 'RLS policies fixed successfully!' as status,
       'All tables now use permissive policies' as policy_type,
       'User isolation is handled at application level through userId field' as security_note;
