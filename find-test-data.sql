-- Find Test Data for "Fochville Apteek /Pharmacy"
-- Run this AFTER adding the test reminder and note

-- Find the lead
SELECT 
    'Lead Info' as type,
    id as lead_id,
    name,
    status,
    "createdAt"
FROM leads
WHERE name LIKE '%Fochville%'
ORDER BY "createdAt" DESC;

-- Find reminders for this lead (using the lead_id from above)
SELECT 
    'Reminders' as type,
    lr.id,
    lr."leadId",
    lr."reminderDate",
    lr.note,
    lr.completed,
    lr."createdAt",
    l.name as lead_name
FROM lead_reminders lr
JOIN leads l ON l.id = lr."leadId"
WHERE l.name LIKE '%Fochville%'
ORDER BY lr."createdAt" DESC;

-- Find notes for this lead
SELECT 
    'Notes' as type,
    ln.id,
    ln."leadId",
    ln.content,
    ln."createdAt",
    l.name as lead_name
FROM lead_notes ln
JOIN leads l ON l.id = ln."leadId"
WHERE l.name LIKE '%Fochville%'
ORDER BY ln."createdAt" DESC;

-- Show all recent reminders (last 10)
SELECT 
    'Recent Reminders' as type,
    lr.id,
    lr."reminderDate",
    lr.note,
    lr.completed,
    lr."createdAt",
    l.name as lead_name
FROM lead_reminders lr
JOIN leads l ON l.id = lr."leadId"
ORDER BY lr."createdAt" DESC
LIMIT 10;

-- Show all recent notes (last 10)
SELECT 
    'Recent Notes' as type,
    ln.id,
    ln.content,
    ln."createdAt",
    l.name as lead_name
FROM lead_notes ln
JOIN leads l ON l.id = ln."leadId"
ORDER BY ln."createdAt" DESC
LIMIT 10;
