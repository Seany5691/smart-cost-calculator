-- Diagnostic Query: Check lead_reminders table status
-- Run this in Supabase SQL Editor to see what's actually there

-- 1. Check if table exists and see its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'lead_reminders'
ORDER BY 
    ordinal_position;

-- 2. Check RLS policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM 
    pg_policies
WHERE 
    tablename = 'lead_reminders';

-- 3. Try to select from the table (should work if table exists)
SELECT COUNT(*) as total_reminders FROM lead_reminders;

-- 4. Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM 
    pg_tables
WHERE 
    schemaname = 'public'
    AND tablename = 'lead_reminders';
