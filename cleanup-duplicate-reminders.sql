-- Cleanup Duplicate Reminders
-- This removes duplicate reminders keeping only the oldest one

-- First, let's see what duplicates exist
SELECT 
    "leadId",
    "userId",
    "reminderDate",
    note,
    COUNT(*) as duplicate_count
FROM lead_reminders
GROUP BY "leadId", "userId", "reminderDate", note
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Delete duplicates, keeping only the oldest one (earliest createdAt)
DELETE FROM lead_reminders
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY "leadId", "userId", "reminderDate", note 
                ORDER BY "createdAt" ASC
            ) as rn
        FROM lead_reminders
    ) t
    WHERE rn > 1
);

-- Verify cleanup
SELECT 
    'Cleanup complete' as status,
    COUNT(*) as remaining_reminders
FROM lead_reminders;

-- Show remaining reminders
SELECT 
    "leadId",
    "reminderDate",
    note,
    completed,
    "createdAt"
FROM lead_reminders
ORDER BY "createdAt" DESC
LIMIT 20;
