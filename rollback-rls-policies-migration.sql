-- ============================================================================
-- ROLLBACK RLS POLICIES MIGRATION
-- ============================================================================
-- Purpose: Rollback the RLS policy changes and restore auth.uid() based policies
-- 
-- WARNING: This will restore the previous RLS policies that require Supabase Auth.
--          Only run this if you need to revert to the auth.uid() based approach.
--
-- IMPORTANT: After running this rollback:
-- - Anonymous access will NOT work
-- - You will need to implement Supabase Auth in the application
-- - Or use the service_role key (not recommended for client-side)
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DROP CURRENT ROLE-BASED POLICIES
-- ============================================================================

DO $
BEGIN
    RAISE NOTICE 'Starting rollback: Dropping role-based policies...';
END $;

-- Drop policies on users table
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert access for all users" ON users;
DROP POLICY IF EXISTS "Enable update access for all users" ON users;
DROP POLICY IF EXISTS "Enable delete access for all users" ON users;

-- Drop policies on hardware_items table
DROP POLICY IF EXISTS "Enable read access for all users" ON hardware_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON hardware_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON hardware_items;
DROP POLICY IF EXISTS "Enable delete access for all users" ON hardware_items;

-- Drop policies on connectivity_items table
DROP POLICY IF EXISTS "Enable read access for all users" ON connectivity_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON connectivity_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON connectivity_items;
DROP POLICY IF EXISTS "Enable delete access for all users" ON connectivity_items;

-- Drop policies on licensing_items table
DROP POLICY IF EXISTS "Enable read access for all users" ON licensing_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON licensing_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON licensing_items;
DROP POLICY IF EXISTS "Enable delete access for all users" ON licensing_items;

-- Drop policies on factors table
DROP POLICY IF EXISTS "Enable read access for all users" ON factors;
DROP POLICY IF EXISTS "Enable insert access for all users" ON factors;
DROP POLICY IF EXISTS "Enable update access for all users" ON factors;
DROP POLICY IF EXISTS "Enable delete access for all users" ON factors;

-- Drop policies on scales table
DROP POLICY IF EXISTS "Enable read access for all users" ON scales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON scales;
DROP POLICY IF EXISTS "Enable update access for all users" ON scales;
DROP POLICY IF EXISTS "Enable delete access for all users" ON scales;

-- Drop policies on deal_calculations table
DROP POLICY IF EXISTS "Enable read access for all users" ON deal_calculations;
DROP POLICY IF EXISTS "Enable insert access for all users" ON deal_calculations;
DROP POLICY IF EXISTS "Enable update access for all users" ON deal_calculations;
DROP POLICY IF EXISTS "Enable delete access for all users" ON deal_calculations;

-- Drop policies on activity_logs table (if exists)
DO $
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs'
    ) THEN
        EXECUTE 'DROP POLICY IF EXISTS "Enable read access for all users" ON activity_logs';
        EXECUTE 'DROP POLICY IF EXISTS "Enable insert access for all users" ON activity_logs';
        EXECUTE 'DROP POLICY IF EXISTS "Enable update access for all users" ON activity_logs';
        EXECUTE 'DROP POLICY IF EXISTS "Enable delete access for all users" ON activity_logs';
    END IF;
END $;

-- Drop policies on scraper_industries table (if exists)
DO $
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'scraper_industries'
    ) THEN
        EXECUTE 'DROP POLICY IF EXISTS "Enable read access for all users" ON scraper_industries';
        EXECUTE 'DROP POLICY IF EXISTS "Enable insert access for all users" ON scraper_industries';
        EXECUTE 'DROP POLICY IF EXISTS "Enable update access for all users" ON scraper_industries';
        EXECUTE 'DROP POLICY IF EXISTS "Enable delete access for all users" ON scraper_industries';
    END IF;
END $;

-- Drop policies on scraper_saved_sessions table (if exists)
DO $
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'scraper_saved_sessions'
    ) THEN
        EXECUTE 'DROP POLICY IF EXISTS "Enable read access for all users" ON scraper_saved_sessions';
        EXECUTE 'DROP POLICY IF EXISTS "Enable insert access for all users" ON scraper_saved_sessions';
        EXECUTE 'DROP POLICY IF EXISTS "Enable update access for all users" ON scraper_saved_sessions';
        EXECUTE 'DROP POLICY IF EXISTS "Enable delete access for all users" ON scraper_saved_sessions';
    END IF;
END $;

DO $
BEGIN
    RAISE NOTICE 'Role-based policies dropped successfully';
END $;

-- ============================================================================
-- STEP 2: RESTORE AUTH.UID() BASED POLICIES
-- ============================================================================

DO $
BEGIN
    RAISE NOTICE 'Restoring auth.uid() based policies...';
END $;

-- ----------------------------------------------------------------------------
-- ACTIVITY_LOGS TABLE POLICIES (IF EXISTS)
-- ----------------------------------------------------------------------------

DO $
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs'
    ) THEN
        -- Users can view their own activity logs
        EXECUTE 'CREATE POLICY "Users can view own activity logs" ON activity_logs
            FOR SELECT 
            USING (
                "userId" = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role = ''admin''
                )
            )';

        -- Users can insert their own activity logs
        EXECUTE 'CREATE POLICY "Users can insert own activity logs" ON activity_logs
            FOR INSERT 
            WITH CHECK ("userId" = auth.uid())';

        -- Admins can view all activity logs
        EXECUTE 'CREATE POLICY "Admins can view all activity logs" ON activity_logs
            FOR SELECT 
            USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role = ''admin''
                )
            )';
        
        RAISE NOTICE 'Restored auth.uid() policies for activity_logs';
    END IF;
END $;

-- ----------------------------------------------------------------------------
-- DEAL_CALCULATIONS TABLE POLICIES
-- ----------------------------------------------------------------------------

-- Users can view their own deals
CREATE POLICY "Users can view own deals" ON deal_calculations
    FOR SELECT 
    USING (
        "userId" = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Users can insert their own deals
CREATE POLICY "Users can insert own deals" ON deal_calculations
    FOR INSERT 
    WITH CHECK ("userId" = auth.uid());

-- Users can update their own deals
CREATE POLICY "Users can update own deals" ON deal_calculations
    FOR UPDATE 
    USING ("userId" = auth.uid())
    WITH CHECK ("userId" = auth.uid());

-- Users can delete their own deals
CREATE POLICY "Users can delete own deals" ON deal_calculations
    FOR DELETE 
    USING ("userId" = auth.uid());

-- Admins can view all deals
CREATE POLICY "Admins can view all deals" ON deal_calculations
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admins can delete any deal
CREATE POLICY "Admins can delete any deal" ON deal_calculations
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ----------------------------------------------------------------------------
-- SCRAPER_INDUSTRIES TABLE POLICIES (IF EXISTS)
-- ----------------------------------------------------------------------------

DO $
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'scraper_industries'
    ) THEN
        -- Users can view active industries
        EXECUTE 'CREATE POLICY "Users can view active industries" ON scraper_industries
            FOR SELECT 
            USING ("isActive" = true)';

        -- Users can insert industries
        EXECUTE 'CREATE POLICY "Users can insert industries" ON scraper_industries
            FOR INSERT 
            WITH CHECK (true)';

        -- Users can update industries they created or admins can update any
        EXECUTE 'CREATE POLICY "Users can update own industries" ON scraper_industries
            FOR UPDATE 
            USING (
                "userId" = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role = ''admin''
                )
            )';

        -- Users can delete industries they created or admins can delete any
        EXECUTE 'CREATE POLICY "Users can delete own industries" ON scraper_industries
            FOR DELETE 
            USING (
                "userId" = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role = ''admin''
                )
            )';
        
        RAISE NOTICE 'Restored auth.uid() policies for scraper_industries';
    END IF;
END $;

-- ----------------------------------------------------------------------------
-- SCRAPER_SAVED_SESSIONS TABLE POLICIES (IF EXISTS)
-- ----------------------------------------------------------------------------

DO $
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'scraper_saved_sessions'
    ) THEN
        -- Users can view their own saved sessions
        EXECUTE 'CREATE POLICY "Users can view own saved sessions" ON scraper_saved_sessions
            FOR SELECT 
            USING (
                "userId" = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role = ''admin''
                )
            )';

        -- Users can insert their own saved sessions
        EXECUTE 'CREATE POLICY "Users can insert own saved sessions" ON scraper_saved_sessions
            FOR INSERT 
            WITH CHECK ("userId" = auth.uid())';

        -- Users can update their own saved sessions
        EXECUTE 'CREATE POLICY "Users can update own saved sessions" ON scraper_saved_sessions
            FOR UPDATE 
            USING ("userId" = auth.uid())
            WITH CHECK ("userId" = auth.uid())';

        -- Users can delete their own saved sessions
        EXECUTE 'CREATE POLICY "Users can delete own saved sessions" ON scraper_saved_sessions
            FOR DELETE 
            USING ("userId" = auth.uid())';
        
        RAISE NOTICE 'Restored auth.uid() policies for scraper_saved_sessions';
    END IF;
END $;

-- ----------------------------------------------------------------------------
-- RESTORE PERMISSIVE POLICIES FOR OTHER TABLES
-- ----------------------------------------------------------------------------

-- Users table - permissive policy
CREATE POLICY "Allow all users operations" ON users 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Hardware items - permissive policy
CREATE POLICY "Allow all hardware operations" ON hardware_items 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Connectivity items - permissive policy
CREATE POLICY "Allow all connectivity operations" ON connectivity_items 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Licensing items - permissive policy
CREATE POLICY "Allow all licensing operations" ON licensing_items 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Factors - permissive policy
CREATE POLICY "Allow all factors operations" ON factors 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Scales - permissive policy
CREATE POLICY "Allow all scales operations" ON scales 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

DO $
BEGIN
    RAISE NOTICE 'Auth.uid() based policies restored successfully';
END $;

-- ============================================================================
-- STEP 3: VERIFICATION
-- ============================================================================

DO $
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE 'Rollback complete: % policies restored', policy_count;
    
    -- Verify deal_calculations has auth-based policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'deal_calculations'
        AND policyname LIKE '%own%'
    ) THEN
        RAISE NOTICE '✓ SUCCESS: Auth-based policies restored for deal_calculations';
    ELSE
        RAISE WARNING '✗ WARNING: Auth-based policies may not be fully restored';
    END IF;
END $;

COMMIT;

-- ============================================================================
-- ROLLBACK SUMMARY
-- ============================================================================

SELECT 
    'RLS Policies Rollback Completed!' as status,
    'Policies reverted to auth.uid() based approach' as change,
    'Anonymous access will NO LONGER work' as warning,
    'You must implement Supabase Auth or use service_role key' as action_required;

-- ============================================================================
-- NEXT STEPS AFTER ROLLBACK
-- ============================================================================
-- 
-- After running this rollback, you have two options:
-- 
-- OPTION 1: Implement Supabase Auth in your application
-- - Install @supabase/auth-helpers-nextjs
-- - Set up authentication flow (login/signup)
-- - Use authenticated Supabase client
-- - Update application to use auth.user() for userId
-- 
-- OPTION 2: Use service_role key (NOT RECOMMENDED for client-side)
-- - Update .env to use SUPABASE_SERVICE_ROLE_KEY
-- - This bypasses RLS entirely
-- - Only use for server-side operations
-- - Never expose service_role key to client
-- 
-- OPTION 3: Re-apply the role-based policies migration
-- - Run fix-rls-policies-migration.sql again
-- - This will restore anonymous access functionality
-- 
-- ============================================================================

