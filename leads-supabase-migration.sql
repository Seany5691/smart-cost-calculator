-- Leads Management Supabase Migration
-- Creates tables for leads and routes with proper RLS policies for user isolation
-- Run this migration after the base schema (supabase-schema.sql)

-- ============================================================================
-- LEADS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "mapsAddress" TEXT NOT NULL,
    number INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL,
    phone TEXT,
    provider TEXT,
    address TEXT,
    "typeOfBusiness" TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'leads', 'working', 'bad', 'later', 'signed')),
    notes TEXT,
    "dateToCallBack" TIMESTAMP WITH TIME ZONE,
    coordinates JSONB,
    "backgroundColor" TEXT,
    "listName" TEXT,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "importSessionId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for leads performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads("userId");
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_list_name ON leads("listName");
CREATE INDEX IF NOT EXISTS idx_leads_provider ON leads(provider);
CREATE INDEX IF NOT EXISTS idx_leads_date_to_call_back ON leads("dateToCallBack");
CREATE INDEX IF NOT EXISTS idx_leads_user_status ON leads("userId", status);
CREATE INDEX IF NOT EXISTS idx_leads_user_list ON leads("userId", "listName");
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads("createdAt" DESC);

-- ============================================================================
-- ROUTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    "routeUrl" TEXT NOT NULL,
    "stopCount" INTEGER NOT NULL DEFAULT 0,
    "leadIds" UUID[] NOT NULL DEFAULT '{}',
    "startingPoint" TEXT,
    notes TEXT,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for routes performance
CREATE INDEX IF NOT EXISTS idx_routes_user_id ON routes("userId");
CREATE INDEX IF NOT EXISTS idx_routes_created_at ON routes("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_routes_user_created ON routes("userId", "createdAt" DESC);

-- ============================================================================
-- LEAD NOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "leadId" UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for lead_notes performance
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes("leadId");
CREATE INDEX IF NOT EXISTS idx_lead_notes_user_id ON lead_notes("userId");
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON lead_notes("createdAt" DESC);

-- ============================================================================
-- LEAD INTERACTIONS TABLE (for audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "leadId" UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "interactionType" TEXT NOT NULL CHECK ("interactionType" IN (
        'status_change', 'note_added', 'note_updated', 'note_deleted',
        'lead_created', 'lead_updated', 'callback_scheduled', 'callback_completed',
        'attachment_added', 'attachment_deleted'
    )),
    "oldValue" TEXT,
    "newValue" TEXT,
    metadata JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for lead_interactions performance
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions("leadId");
CREATE INDEX IF NOT EXISTS idx_lead_interactions_user_id ON lead_interactions("userId");
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions("createdAt" DESC);

-- ============================================================================
-- LEAD ATTACHMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "leadId" UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL, -- Path in Supabase Storage
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for lead_attachments performance
CREATE INDEX IF NOT EXISTS idx_lead_attachments_lead_id ON lead_attachments("leadId");
CREATE INDEX IF NOT EXISTS idx_lead_attachments_user_id ON lead_attachments("userId");
CREATE INDEX IF NOT EXISTS idx_lead_attachments_created_at ON lead_attachments("createdAt" DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- LEADS RLS POLICIES - Users can only see their own leads
-- ============================================================================

-- Users can view their own leads
CREATE POLICY "Users can view own leads" ON leads
    FOR SELECT 
    USING ("userId" = auth.uid());

-- Users can insert their own leads
CREATE POLICY "Users can insert own leads" ON leads
    FOR INSERT 
    WITH CHECK ("userId" = auth.uid());

-- Users can update their own leads
CREATE POLICY "Users can update own leads" ON leads
    FOR UPDATE 
    USING ("userId" = auth.uid())
    WITH CHECK ("userId" = auth.uid());

-- Users can delete their own leads
CREATE POLICY "Users can delete own leads" ON leads
    FOR DELETE 
    USING ("userId" = auth.uid());

-- ============================================================================
-- ROUTES RLS POLICIES - Users can only see their own routes
-- ============================================================================

-- Users can view their own routes
CREATE POLICY "Users can view own routes" ON routes
    FOR SELECT 
    USING ("userId" = auth.uid());

-- Users can insert their own routes
CREATE POLICY "Users can insert own routes" ON routes
    FOR INSERT 
    WITH CHECK ("userId" = auth.uid());

-- Users can update their own routes
CREATE POLICY "Users can update own routes" ON routes
    FOR UPDATE 
    USING ("userId" = auth.uid())
    WITH CHECK ("userId" = auth.uid());

-- Users can delete their own routes
CREATE POLICY "Users can delete own routes" ON routes
    FOR DELETE 
    USING ("userId" = auth.uid());

-- ============================================================================
-- LEAD NOTES RLS POLICIES - Users can only see notes on their own leads
-- ============================================================================

-- Users can view notes on their own leads
CREATE POLICY "Users can view notes on own leads" ON lead_notes
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = lead_notes."leadId" 
            AND leads."userId" = auth.uid()
        )
    );

-- Users can insert notes on their own leads
CREATE POLICY "Users can insert notes on own leads" ON lead_notes
    FOR INSERT 
    WITH CHECK (
        "userId" = auth.uid() AND
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = lead_notes."leadId" 
            AND leads."userId" = auth.uid()
        )
    );

-- Users can update their own notes
CREATE POLICY "Users can update own notes" ON lead_notes
    FOR UPDATE 
    USING ("userId" = auth.uid())
    WITH CHECK ("userId" = auth.uid());

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes" ON lead_notes
    FOR DELETE 
    USING ("userId" = auth.uid());

-- ============================================================================
-- LEAD INTERACTIONS RLS POLICIES - Users can only see interactions on their own leads
-- ============================================================================

-- Users can view interactions on their own leads
CREATE POLICY "Users can view interactions on own leads" ON lead_interactions
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = lead_interactions."leadId" 
            AND leads."userId" = auth.uid()
        )
    );

-- Users can insert interactions on their own leads
CREATE POLICY "Users can insert interactions on own leads" ON lead_interactions
    FOR INSERT 
    WITH CHECK (
        "userId" = auth.uid() AND
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = lead_interactions."leadId" 
            AND leads."userId" = auth.uid()
        )
    );

-- ============================================================================
-- LEAD ATTACHMENTS RLS POLICIES - Users can only see attachments on their own leads
-- ============================================================================

-- Users can view attachments on their own leads
CREATE POLICY "Users can view attachments on own leads" ON lead_attachments
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = lead_attachments."leadId" 
            AND leads."userId" = auth.uid()
        )
    );

-- Users can insert attachments on their own leads
CREATE POLICY "Users can insert attachments on own leads" ON lead_attachments
    FOR INSERT 
    WITH CHECK (
        "userId" = auth.uid() AND
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = lead_attachments."leadId" 
            AND leads."userId" = auth.uid()
        )
    );

-- Users can delete their own attachments
CREATE POLICY "Users can delete own attachments" ON lead_attachments
    FOR DELETE 
    USING ("userId" = auth.uid());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_notes_updated_at BEFORE UPDATE ON lead_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for leads with callback reminders
CREATE OR REPLACE VIEW leads_with_reminders AS
SELECT 
    l.*,
    CASE 
        WHEN l."dateToCallBack"::date = CURRENT_DATE THEN 'today'
        WHEN l."dateToCallBack"::date = CURRENT_DATE + INTERVAL '1 day' THEN 'tomorrow'
        WHEN l."dateToCallBack"::date < CURRENT_DATE THEN 'overdue'
        WHEN l."dateToCallBack"::date <= CURRENT_DATE + INTERVAL '7 days' THEN 'upcoming'
        ELSE 'future'
    END as reminder_status
FROM leads l
WHERE l."dateToCallBack" IS NOT NULL
ORDER BY l."dateToCallBack" ASC;

-- View for lead statistics by user
CREATE OR REPLACE VIEW lead_stats_by_user AS
SELECT 
    "userId",
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'new' THEN 1 END) as new_count,
    COUNT(CASE WHEN status = 'leads' THEN 1 END) as leads_count,
    COUNT(CASE WHEN status = 'working' THEN 1 END) as working_count,
    COUNT(CASE WHEN status = 'bad' THEN 1 END) as bad_count,
    COUNT(CASE WHEN status = 'later' THEN 1 END) as later_count,
    COUNT(CASE WHEN status = 'signed' THEN 1 END) as signed_count,
    COUNT(CASE WHEN "dateToCallBack"::date = CURRENT_DATE THEN 1 END) as callbacks_today,
    COUNT(CASE WHEN "dateToCallBack"::date > CURRENT_DATE AND "dateToCallBack"::date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as callbacks_upcoming
FROM leads
GROUP BY "userId";

-- View for route statistics by user
CREATE OR REPLACE VIEW route_stats_by_user AS
SELECT 
    "userId",
    COUNT(*) as total_routes,
    SUM("stopCount") as total_stops,
    AVG("stopCount") as avg_stops_per_route,
    COUNT(CASE WHEN "createdAt" >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as routes_this_month
FROM routes
GROUP BY "userId";

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- ============================================================================
-- STORAGE BUCKET SETUP (Run this in Supabase Dashboard or via API)
-- ============================================================================

-- Create storage bucket for lead attachments
-- Note: This needs to be run separately in Supabase Dashboard > Storage
-- Or use the Supabase Management API

-- Bucket name: lead-attachments
-- Public: false (private bucket)
-- File size limit: 50MB
-- Allowed MIME types: image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain

-- Storage policies (to be created in Supabase Dashboard):
-- 1. Users can upload files to their own folder: lead-attachments/{user_id}/*
-- 2. Users can view files in their own folder
-- 3. Users can delete files in their own folder

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist
SELECT 
    'leads' as table_name,
    COUNT(*) as row_count
FROM leads
UNION ALL
SELECT 
    'routes' as table_name,
    COUNT(*) as row_count
FROM routes
UNION ALL
SELECT 
    'lead_notes' as table_name,
    COUNT(*) as row_count
FROM lead_notes
UNION ALL
SELECT 
    'lead_interactions' as table_name,
    COUNT(*) as row_count
FROM lead_interactions
UNION ALL
SELECT 
    'lead_attachments' as table_name,
    COUNT(*) as row_count
FROM lead_attachments;

-- Success message
SELECT 'Leads management migration completed successfully!' as status,
       'Tables created: leads, routes, lead_notes, lead_interactions, lead_attachments' as tables,
       'RLS policies applied for complete user isolation' as security,
       'Each user can only see and manage their own leads, routes, and attachments' as isolation,
       'Remember to create the lead-attachments storage bucket in Supabase Dashboard' as reminder;
