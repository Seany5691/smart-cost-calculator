-- Lead Reminders Migration
-- Adds lead_reminders table to store reminders in Supabase instead of localStorage
-- This completes the migration of all lead management features to Supabase

-- ============================================================================
-- LEAD REMINDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "leadId" UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "reminderDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    note TEXT NOT NULL DEFAULT 'Reminder',
    completed BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for lead_reminders performance
CREATE INDEX IF NOT EXISTS idx_lead_reminders_lead_id ON lead_reminders("leadId");
CREATE INDEX IF NOT EXISTS idx_lead_reminders_user_id ON lead_reminders("userId");
CREATE INDEX IF NOT EXISTS idx_lead_reminders_reminder_date ON lead_reminders("reminderDate");
CREATE INDEX IF NOT EXISTS idx_lead_reminders_completed ON lead_reminders(completed);
CREATE INDEX IF NOT EXISTS idx_lead_reminders_user_date ON lead_reminders("userId", "reminderDate");

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on lead_reminders table
ALTER TABLE lead_reminders ENABLE ROW LEVEL SECURITY;

-- Users can view reminders on their own leads
CREATE POLICY "Users can view reminders on own leads" ON lead_reminders
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = lead_reminders."leadId" 
            AND leads."userId" = auth.uid()
        )
    );

-- Users can insert reminders on their own leads
CREATE POLICY "Users can insert reminders on own leads" ON lead_reminders
    FOR INSERT 
    WITH CHECK (
        "userId" = auth.uid() AND
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = lead_reminders."leadId" 
            AND leads."userId" = auth.uid()
        )
    );

-- Users can update their own reminders
CREATE POLICY "Users can update own reminders" ON lead_reminders
    FOR UPDATE 
    USING ("userId" = auth.uid())
    WITH CHECK ("userId" = auth.uid());

-- Users can delete their own reminders
CREATE POLICY "Users can delete own reminders" ON lead_reminders
    FOR DELETE 
    USING ("userId" = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lead_reminders_updated_at BEFORE UPDATE ON lead_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for upcoming reminders
CREATE OR REPLACE VIEW upcoming_reminders AS
SELECT 
    lr.*,
    l.name as lead_name,
    l.phone as lead_phone,
    l.status as lead_status,
    CASE 
        WHEN lr."reminderDate"::date = CURRENT_DATE THEN 'today'
        WHEN lr."reminderDate"::date = CURRENT_DATE + INTERVAL '1 day' THEN 'tomorrow'
        WHEN lr."reminderDate"::date < CURRENT_DATE THEN 'overdue'
        WHEN lr."reminderDate"::date <= CURRENT_DATE + INTERVAL '7 days' THEN 'upcoming'
        ELSE 'future'
    END as reminder_status
FROM lead_reminders lr
JOIN leads l ON l.id = lr."leadId"
WHERE lr.completed = false
ORDER BY lr."reminderDate" ASC;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify table exists
SELECT 
    'lead_reminders' as table_name,
    COUNT(*) as row_count
FROM lead_reminders;

-- Success message
SELECT 'Lead reminders migration completed successfully!' as status,
       'Table created: lead_reminders' as table,
       'RLS policies applied for user isolation' as security,
       'Users can only see and manage reminders on their own leads' as isolation;
