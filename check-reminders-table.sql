-- Check if lead_reminders table exists
-- Run this in Supabase SQL Editor to verify the migration status

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'lead_reminders'
ORDER BY 
    ordinal_position;

-- If the query returns no rows, the table doesn't exist yet
-- You need to run: lead-reminders-migration.sql

-- Check if lead_notes table exists (should already exist)
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'lead_notes'
ORDER BY 
    ordinal_position;
