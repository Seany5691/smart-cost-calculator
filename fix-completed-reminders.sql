-- Check All Reminders in Database
-- This shows what's actually in the database

-- Show all reminders with details
SELECT 
    id,
    "leadId",
    "userId",
    "reminderDate",
    note,
    completed,
    "createdAt",
    "updatedAt"
FROM lead_reminders
ORDER BY "createdAt" DESC
LIMIT 50;

-- Set all reminders to NOT completed
UPDATE lead_reminders
SET completed = false
WHERE completed = true;

-- Verify the fix
SELECT 
    'Fixed reminders' as status,
    COUNT(*) as total_reminders,
    COUNT(CASE WHEN completed = false THEN 1 END) as active_reminders,
    COUNT(CASE WHEN completed = true THEN 1 END) as completed_reminders
FROM lead_reminders;

-- Show the updated reminders
SELECT 
    id,
    "leadId",
    "reminderDate",
    note,
    completed,
    "createdAt"
FROM lead_reminders
ORDER BY "createdAt" DESC
LIMIT 20;
