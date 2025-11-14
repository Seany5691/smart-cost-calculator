-- Check what reminders are actually in the database

-- Show all reminders
SELECT 
    id,
    "leadId",
    "userId",
    "reminderDate",
    note,
    completed,
    "createdAt"
FROM lead_reminders
ORDER BY "createdAt" DESC
LIMIT 20;

-- Count reminders by user
SELECT 
    "userId",
    COUNT(*) as reminder_count,
    COUNT(CASE WHEN completed = false THEN 1 END) as active_count,
    COUNT(CASE WHEN completed = true THEN 1 END) as completed_count
FROM lead_reminders
GROUP BY "userId";

-- Show most recent reminder
SELECT 
    'Most recent reminder' as info,
    *
FROM lead_reminders
ORDER BY "createdAt" DESC
LIMIT 1;
