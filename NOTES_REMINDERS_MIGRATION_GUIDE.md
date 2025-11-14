# Notes & Reminders Migration to Supabase

This document outlines the migration of Notes and Reminders from localStorage to Supabase for the Leads Management section.

## Overview

Previously, notes and reminders were stored in localStorage using these keys:
- `list-app-notes` - Array of lead notes
- `list-app-reminders` - Array of lead reminders

Now they are stored in Supabase tables with proper user isolation and RLS policies.

## Database Changes

### New Table: `lead_reminders`

```sql
CREATE TABLE lead_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "leadId" UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "reminderDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    note TEXT NOT NULL DEFAULT 'Reminder',
    completed BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Existing Table: `lead_notes`

The `lead_notes` table was already created in the previous migration but was not being used. Now it's fully integrated.

## Migration Steps

### 1. Check Current Database State

First, verify if the tables exist:

```bash
# In Supabase SQL Editor, run:
smart-cost-calculator/check-reminders-table.sql
```

This will show you:
- If `lead_reminders` table exists (should be empty if not migrated)
- If `lead_notes` table exists (should already exist from previous migration)

### 2. Run the Database Migration

Execute the SQL migration file in Supabase SQL Editor:

**IMPORTANT:** Copy and paste the entire contents of `lead-reminders-migration.sql` into the Supabase SQL Editor and click "Run".

```bash
# File to run:
smart-cost-calculator/lead-reminders-migration.sql
```

This will:
- Create the `lead_reminders` table
- Set up RLS policies for user isolation
- Create indexes for performance
- Add helpful views for upcoming reminders

### 3. Verify Migration Success

After running the migration, run the check script again to verify:
- The `lead_reminders` table should now show 8 columns
- All RLS policies should be in place

### 2. Code Changes

The following components have been updated to use Supabase:

#### New Helper Library
- `src/lib/leads/supabaseNotesReminders.ts` - Centralized functions for notes and reminders

#### Updated Components
- `src/components/leads/leads/LeadNotesRemindersDropdown.tsx` - Dropdown showing notes/reminders
- `src/components/leads/leads/LeadDetailsModal.tsx` - Modal for viewing/editing lead details
- `src/components/leads/leads/RemindersTab.tsx` - Tab for managing reminders
- `src/components/leads/dashboard/UpcomingReminders.tsx` - Dashboard widget for reminders
- `src/components/leads/dashboard/CallbackCalendar.tsx` - Calendar view of reminders
- `src/app/leads/status-pages/status/working/page.tsx` - Working status page

### 3. Data Migration (Optional)

If you have existing notes and reminders in localStorage that you want to migrate to Supabase, you can use the migration helper functions:

```typescript
import { 
  migrateLocalStorageNotesToSupabase,
  migrateLocalStorageRemindersToSupabase 
} from '@/lib/leads/supabaseNotesReminders';
import { storage } from '@/lib/leads/localStorage';

// Get current user ID
const userId = user.id;

// Migrate notes
const localNotes = storage.get('list-app-notes') || [];
const notesResult = await migrateLocalStorageNotesToSupabase(localNotes, userId);
console.log(`Migrated ${notesResult.success} notes, ${notesResult.failed} failed`);

// Migrate reminders
const localReminders = storage.get('list-app-reminders') || [];
const remindersResult = await migrateLocalStorageRemindersToSupabase(localReminders, userId);
console.log(`Migrated ${remindersResult.success} reminders, ${remindersResult.failed} failed`);

// Clear localStorage after successful migration
if (notesResult.failed === 0) {
  storage.remove('list-app-notes');
}
if (remindersResult.failed === 0) {
  storage.remove('list-app-reminders');
}
```

## API Functions

### Notes

```typescript
// Get all notes for a lead
const notes = await getLeadNotes(leadId);

// Create a new note
const note = await createLeadNote(leadId, userId, content);

// Update a note
const updatedNote = await updateLeadNote(noteId, newContent);

// Delete a note
await deleteLeadNote(noteId);
```

### Reminders

```typescript
// Get all reminders for a lead
const reminders = await getLeadReminders(leadId);

// Get all reminders for a user
const allReminders = await getAllUserReminders(userId);

// Create a new reminder
const reminder = await createLeadReminder(leadId, userId, reminderDate, note);

// Update a reminder
const updated = await updateLeadReminder(reminderId, { 
  reminderDate: newDate, 
  note: newNote,
  completed: true 
});

// Toggle reminder completion
const toggled = await toggleReminderCompletion(reminderId);

// Delete a reminder
await deleteLeadReminder(reminderId);

// Get both notes and reminders at once
const { notes, reminders } = await getLeadNotesAndReminders(leadId);
```

## Security

All notes and reminders are protected by Row Level Security (RLS) policies:

- Users can only view notes/reminders on their own leads
- Users can only create notes/reminders on their own leads
- Users can only update/delete their own notes/reminders
- All operations require authentication

## Benefits

1. **Data Persistence** - Data is stored in the cloud, not browser localStorage
2. **Multi-Device Sync** - Access your notes and reminders from any device
3. **User Isolation** - Each user only sees their own data
4. **Better Performance** - Indexed queries for faster data retrieval
5. **Audit Trail** - Timestamps for creation and updates
6. **Scalability** - No localStorage size limits
7. **Backup & Recovery** - Data is backed up by Supabase

## Testing

After migration, test the following:

1. ✅ Create a new note on a lead
2. ✅ Edit an existing note
3. ✅ Delete a note
4. ✅ Create a new reminder
5. ✅ Toggle reminder completion
6. ✅ Delete a reminder
7. ✅ View notes/reminders in the dropdown
8. ✅ View reminders in the dashboard
9. ✅ View reminders in the calendar
10. ✅ Verify RLS policies (users can't see other users' data)

## Rollback

If you need to rollback to localStorage:

1. Revert the code changes to the previous commit
2. The database tables can remain (they won't interfere)
3. Data in Supabase will be preserved for future migration

## Notes

- The `lead_notes` table already existed from the previous migration but wasn't being used
- The `lead_reminders` table is new
- All localStorage keys (`list-app-notes`, `list-app-reminders`) are no longer used
- The migration is backward compatible - old code will continue to work with localStorage until updated
