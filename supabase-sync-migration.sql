-- Supabase Sync Migration
-- Adds activity_logs table and updates deal_calculations for localStorage sync
-- Run this migration after the base schema (supabase-schema.sql)

-- ============================================================================
-- ACTIVITY LOGS TABLE
-- ============================================================================

-- Create activity_logs table for tracking user activities
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(255) PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    "userRole" VARCHAR(50) NOT NULL CHECK ("userRole" IN ('admin', 'manager', 'user')),
    "activityType" VARCHAR(50) NOT NULL CHECK ("activityType" IN ('deal_created', 'deal_saved', 'proposal_generated', 'pdf_generated', 'deal_loaded')),
    "dealId" VARCHAR(255),
    "dealName" VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for activity_logs performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs("userId");
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs("activityType");
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_timestamp ON activity_logs("userId", timestamp DESC);

-- ============================================================================
-- DEAL CALCULATIONS TABLE UPDATES
-- ============================================================================

-- NOTE: deal_calculations table already exists with UUID id and camelCase columns
-- We are NOT modifying the existing table structure
-- Only adding indexes if they don't exist

-- Add indexes for performance (if they don't already exist)
CREATE INDEX IF NOT EXISTS idx_deal_calculations_user_id ON deal_calculations("userId");
CREATE INDEX IF NOT EXISTS idx_deal_calculations_created_at ON deal_calculations("createdAt");

-- ============================================================================
-- SCRAPER INDUSTRIES TABLE
-- ============================================================================

-- Create scraper_industries table for custom industry management
CREATE TABLE IF NOT EXISTS scraper_industries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for scraper_industries
CREATE INDEX IF NOT EXISTS idx_scraper_industries_name ON scraper_industries(name);
CREATE INDEX IF NOT EXISTS idx_scraper_industries_user_id ON scraper_industries("userId");
CREATE INDEX IF NOT EXISTS idx_scraper_industries_active ON scraper_industries("isActive");

-- ============================================================================
-- SCRAPER SAVED SESSIONS TABLE
-- ============================================================================

-- Create scraper_saved_sessions table for saving scraper configurations
CREATE TABLE IF NOT EXISTS scraper_saved_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "sessionName" VARCHAR(255) NOT NULL,
    towns TEXT[] NOT NULL,
    industries TEXT[] NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for scraper_saved_sessions
CREATE INDEX IF NOT EXISTS idx_scraper_saved_sessions_user_id ON scraper_saved_sessions("userId");
CREATE INDEX IF NOT EXISTS idx_scraper_saved_sessions_created_at ON scraper_saved_sessions("createdAt" DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_saved_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies on deal_calculations if they exist
DROP POLICY IF EXISTS "Allow all deal operations" ON deal_calculations;

-- ============================================================================
-- ACTIVITY LOGS RLS POLICIES
-- ============================================================================

-- Users can view their own activity logs
CREATE POLICY "Users can view own activity logs" ON activity_logs
    FOR SELECT 
    USING (
        "userId" = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Users can insert their own activity logs
CREATE POLICY "Users can insert own activity logs" ON activity_logs
    FOR INSERT 
    WITH CHECK ("userId" = auth.uid());

-- Admins can view all activity logs (additional policy for clarity)
CREATE POLICY "Admins can view all activity logs" ON activity_logs
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================================================
-- DEAL CALCULATIONS RLS POLICIES
-- ============================================================================

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

-- Admins can view all deals (additional policy for clarity)
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

-- ============================================================================
-- SCRAPER INDUSTRIES RLS POLICIES
-- ============================================================================

-- Users can view active industries (shared across all users)
CREATE POLICY "Users can view active industries" ON scraper_industries
    FOR SELECT 
    USING ("isActive" = true);

-- Users can insert industries
CREATE POLICY "Users can insert industries" ON scraper_industries
    FOR INSERT 
    WITH CHECK (true);

-- Users can update industries they created or admins can update any
CREATE POLICY "Users can update own industries" ON scraper_industries
    FOR UPDATE 
    USING (
        "userId" = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Users can delete industries they created or admins can delete any
CREATE POLICY "Users can delete own industries" ON scraper_industries
    FOR DELETE 
    USING (
        "userId" = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================================================
-- SCRAPER SAVED SESSIONS RLS POLICIES
-- ============================================================================

-- Users can view their own saved sessions
CREATE POLICY "Users can view own saved sessions" ON scraper_saved_sessions
    FOR SELECT 
    USING (
        "userId" = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Users can insert their own saved sessions
CREATE POLICY "Users can insert own saved sessions" ON scraper_saved_sessions
    FOR INSERT 
    WITH CHECK ("userId" = auth.uid());

-- Users can update their own saved sessions
CREATE POLICY "Users can update own saved sessions" ON scraper_saved_sessions
    FOR UPDATE 
    USING ("userId" = auth.uid())
    WITH CHECK ("userId" = auth.uid());

-- Users can delete their own saved sessions
CREATE POLICY "Users can delete own saved sessions" ON scraper_saved_sessions
    FOR DELETE 
    USING ("userId" = auth.uid());

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for recent activity logs (last 100 per user)
CREATE OR REPLACE VIEW recent_activity_logs AS
SELECT *
FROM activity_logs
ORDER BY "userId", timestamp DESC
LIMIT 100;

-- View for user deal statistics
CREATE OR REPLACE VIEW user_deal_stats AS
SELECT 
    "userId",
    username,
    COUNT(*) as total_deals,
    COUNT(CASE WHEN "createdAt" >= NOW() - INTERVAL '30 days' THEN 1 END) as deals_last_30_days,
    MAX("createdAt") as last_deal_date
FROM deal_calculations
GROUP BY "userId", username;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample activity logs (only if Camryn user exists)
-- NOTE: This is optional sample data for testing
DO $$
DECLARE
    camryn_id UUID;
BEGIN
    -- Get Camryn's user ID
    SELECT id INTO camryn_id FROM users WHERE username = 'Camryn' LIMIT 1;
    
    IF camryn_id IS NOT NULL THEN
        -- Insert sample activity logs (only for testing, safe to skip)
        INSERT INTO activity_logs (id, "userId", username, "userRole", "activityType", "dealId", "dealName", timestamp) VALUES
        ('activity_test_1', camryn_id, 'Camryn', 'admin', 'deal_created', NULL, 'Sample Activity', NOW() - INTERVAL '2 hours'),
        ('activity_test_2', camryn_id, 'Camryn', 'admin', 'deal_saved', NULL, 'Sample Activity', NOW() - INTERVAL '1 hour'),
        ('activity_test_3', camryn_id, 'Camryn', 'admin', 'proposal_generated', NULL, 'Sample Activity', NOW() - INTERVAL '30 minutes')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist
SELECT 
    'activity_logs' as table_name,
    COUNT(*) as row_count
FROM activity_logs
UNION ALL
SELECT 
    'deal_calculations' as table_name,
    COUNT(*) as row_count
FROM deal_calculations
UNION ALL
SELECT 
    'scraper_industries' as table_name,
    COUNT(*) as row_count
FROM scraper_industries
UNION ALL
SELECT 
    'scraper_saved_sessions' as table_name,
    COUNT(*) as row_count
FROM scraper_saved_sessions;

-- Success message
SELECT 'Supabase sync migration completed successfully!' as status,
       'Tables created: activity_logs, scraper_industries, scraper_saved_sessions' as tables,
       'RLS policies applied for secure data access' as security;
