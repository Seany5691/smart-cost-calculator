# 🔧 Fix "Error creating lead reminder" 

## The Problem
You're seeing this error in your browser console:
```
Error creating lead reminder: {}
```

## The Solution (2 minutes)

### 1. Open Supabase
Go to: https://supabase.com/dashboard/project/YOUR-PROJECT/sql

### 2. Copy This File
Open: `lead-reminders-migration.sql`

### 3. Paste and Run
- Copy ALL the contents of that file
- Paste into Supabase SQL Editor
- Click "Run" button

### 4. Refresh Browser
- Refresh your app
- Error should be gone ✅

## That's It!

The migration creates the `lead_reminders` table that the app needs.

---

## Need More Help?

See detailed guides:
- `NOTES_REMINDERS_MIGRATION_COMPLETE.md` - Full migration info
- `TROUBLESHOOTING_NOTES_REMINDERS.md` - Detailed troubleshooting
- `NOTES_REMINDERS_MIGRATION_GUIDE.md` - Complete guide

## What This Does

The migration:
- ✅ Creates `lead_reminders` table
- ✅ Sets up security policies (RLS)
- ✅ Creates indexes for performance
- ✅ Adds helper views

Safe to run multiple times - it won't break anything!
