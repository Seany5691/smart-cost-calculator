-- Test Reminder Insert
-- This will help us see what's actually failing

-- First, let's check if we have any leads and users to work with
SELECT 
    'Checking leads table' as step,
    COUNT(*) as lead_count,
    (SELECT COUNT(*) FROM users) as user_count
FROM leads;

-- Get a sample lead and user ID to test with
SELECT 
    'Sample IDs for testing' as step,
    l.id as sample_lead_id,
    l."userId" as sample_user_id,
    l.name as lead_name
FROM leads l
LIMIT 1;

-- Now try to insert a test reminder
-- REPLACE the UUIDs below with actual IDs from the query above
/*
INSERT INTO lead_reminders (
    "leadId",
    "userId", 
    "reminderDate",
    note,
    completed
) VALUES (
    'REPLACE-WITH-LEAD-ID'::uuid,
    'REPLACE-WITH-USER-ID'::uuid,
    NOW() + INTERVAL '1 day',
    'Test reminder',
    false
) RETURNING *;
*/

-- Check what's in the table
SELECT 
    'Current reminders' as step,
    COUNT(*) as reminder_count
FROM lead_reminders;

-- Check if auth.uid() is working (this is what RLS uses)
SELECT 
    'Auth check' as step,
    auth.uid() as current_user_id,
    CASE 
        WHEN auth.uid() IS NULL THEN 'NOT AUTHENTICATED - This is the problem!'
        ELSE 'Authenticated OK'
    END as auth_status;
