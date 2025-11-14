# Troubleshooting Notes & Reminders Migration

## Common Issues and Solutions

### Issue 1: "Error creating lead reminder: {}"

**Symptoms:**
- Console shows: `Error creating lead reminder: {}`
- Reminders don't save
- Empty error object

**Cause:**
The `lead_reminders` table doesn't exist in your Supabase database yet.

**Solution:**
1. Open Supabase Dashboard → SQL Editor
2. Open the file `lead-reminders-migration.sql`
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click "Run" button
6. Refresh your application

**Verification:**
Run this query in Supabase SQL Editor:
```sql
SELECT * FROM lead_reminders LIMIT 1;
```
If the table exists, you'll see column headers (even if no data).

---

### Issue 2: "Error creating lead note"

**Symptoms:**
- Console shows error when creating notes
- Notes don't save

**Cause:**
The `lead_notes` table doesn't exist in your Supabase database yet.

**Solution:**
1. Open Supabase Dashboard → SQL Editor
2. Open the file `leads-supabase-migration.sql`
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click "Run" button
6. Refresh your application

**Verification:**
Run this query in Supabase SQL Editor:
```sql
SELECT * FROM lead_notes LIMIT 1;
```

---

### Issue 3: "relation does not exist"

**Symptoms:**
- Error message mentions "relation" and "does not exist"
- Full error: `relation "public.lead_reminders" does not exist`

**Cause:**
The database table hasn't been created yet.

**Solution:**
Follow the steps in Issue 1 or Issue 2 depending on which table is missing.

---

### Issue 4: RLS Policy Errors

**Symptoms:**
- Error about "row-level security policy"
- Can't read/write data even though table exists

**Cause:**
Row Level Security (RLS) policies aren't set up correctly.

**Solution:**
1. Re-run the migration file (it's safe to run multiple times)
2. Or manually check policies in Supabase Dashboard → Authentication → Policies

**Verification:**
```sql
-- Check RLS policies for lead_reminders
SELECT * FROM pg_policies WHERE tablename = 'lead_reminders';

-- Check RLS policies for lead_notes
SELECT * FROM pg_policies WHERE tablename = 'lead_notes';
```

You should see 4 policies for each table (SELECT, INSERT, UPDATE, DELETE).

---

### Issue 5: User Not Authenticated

**Symptoms:**
- Console shows: "User not authenticated"
- Operations fail silently

**Cause:**
User is not logged in or auth state is not loaded.

**Solution:**
1. Make sure you're logged in to the application
2. Check that `useAuthStore` is returning a valid user
3. Verify Supabase auth is configured correctly

**Debug:**
Add this to your component:
```typescript
const user = useAuthStore((state) => state.user);
console.log('Current user:', user);
```

---

### Issue 6: Data Not Showing Up

**Symptoms:**
- No errors in console
- Data saves successfully
- But doesn't appear in UI

**Cause:**
- Component not refreshing after data changes
- Wrong user ID filter

**Solution:**
1. Check browser console for any warnings
2. Verify the `refreshTrigger` prop is being updated
3. Check that `userId` matches between insert and query

**Debug:**
```typescript
// In component
useEffect(() => {
  console.log('Loading data for lead:', lead.id);
  loadData();
}, [lead.id, refreshTrigger]);
```

---

## Quick Diagnostic Checklist

Run these checks in order:

### 1. Check Tables Exist
```sql
-- In Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lead_notes', 'lead_reminders');
```
Expected: 2 rows (both tables)

### 2. Check RLS is Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('lead_notes', 'lead_reminders');
```
Expected: Both should show `rowsecurity = true`

### 3. Check Policies Exist
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('lead_notes', 'lead_reminders');
```
Expected: 8 policies total (4 for each table)

### 4. Test Insert Manually
```sql
-- Replace with your actual user ID and lead ID
INSERT INTO lead_reminders (
  "leadId", 
  "userId", 
  "reminderDate", 
  note, 
  completed
) VALUES (
  'your-lead-id-here',
  'your-user-id-here',
  NOW() + INTERVAL '1 day',
  'Test reminder',
  false
);
```

If this fails, check the error message for clues.

---

## Still Having Issues?

### Get More Details

Add this to your component to see detailed error info:

```typescript
try {
  await createLeadReminder(leadId, userId, date, note);
} catch (error: any) {
  console.error('Full error object:', error);
  console.error('Error message:', error.message);
  console.error('Error code:', error.code);
  console.error('Error details:', error.details);
  console.error('Error hint:', error.hint);
}
```

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Click on "Logs" in the sidebar
3. Look for recent errors
4. Check the "Postgres Logs" tab

### Verify Environment Variables

Make sure these are set in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Migration Order

If you're setting up from scratch, run migrations in this order:

1. `leads-supabase-migration.sql` - Creates leads, routes, notes, interactions, attachments tables
2. `lead-reminders-migration.sql` - Creates reminders table
3. Test the application
4. Optionally migrate localStorage data using helper functions

---

## Rollback Instructions

If you need to remove the tables:

```sql
-- WARNING: This will delete all data!
DROP TABLE IF EXISTS lead_reminders CASCADE;
DROP TABLE IF EXISTS lead_notes CASCADE;
DROP TABLE IF EXISTS lead_interactions CASCADE;
DROP TABLE IF EXISTS lead_attachments CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
```

Then you can re-run the migrations fresh.
