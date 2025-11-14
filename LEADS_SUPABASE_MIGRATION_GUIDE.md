# Leads Management Supabase Migration Guide

## Overview

This guide documents the complete migration of the Leads Management system from localStorage to Supabase with full user isolation. Each user will only be able to see and manage their own leads and routes.

## What Changed

### Before Migration
- All leads and routes were stored in browser localStorage
- Data was not synced across devices
- No user isolation (all data visible to all users)
- No backup or recovery options
- Limited by browser storage capacity

### After Migration
- All leads and routes stored in Supabase PostgreSQL database
- Data synced across all devices
- Complete user isolation with Row Level Security (RLS)
- Automatic backups and recovery
- Unlimited storage capacity
- Audit trail for all changes

## Database Schema

### Tables Created

1. **leads** - Stores all lead information
   - User-specific with RLS policies
   - Indexed for fast queries
   - Automatic timestamp updates

2. **routes** - Stores generated routes
   - User-specific with RLS policies
   - Links to leads via lead_ids array

3. **lead_notes** - Stores notes for leads
   - User-specific with RLS policies
   - Linked to leads with cascade delete

4. **lead_interactions** - Audit trail for all lead changes
   - User-specific with RLS policies
   - Tracks status changes, notes, updates, attachments

5. **lead_attachments** - Stores file attachment metadata
   - User-specific with RLS policies
   - Files stored in Supabase Storage bucket
   - Linked to leads with cascade delete

### Storage Bucket

**lead-attachments** - Private storage bucket for file uploads
- User-specific folders: `{user_id}/{lead_id}/{filename}`
- Storage policies enforce user isolation
- Supports images, PDFs, documents (max 50MB per file)

## Row Level Security (RLS)

### User Isolation

All tables have RLS policies that ensure:
- Users can only SELECT their own data
- Users can only INSERT data with their own user_id
- Users can only UPDATE their own data
- Users can only DELETE their own data

### Policy Examples

```sql
-- Users can only view their own leads
CREATE POLICY "Users can view own leads" ON leads
    FOR SELECT 
    USING ("userId" = auth.uid());

-- Users can only insert their own leads
CREATE POLICY "Users can insert own leads" ON leads
    FOR INSERT 
    WITH CHECK ("userId" = auth.uid());
```

## Migration Steps

### 1. Run Database Migration

Execute the SQL migration file in your Supabase SQL editor:

```bash
# File: leads-supabase-migration.sql
```

This will create:
- All necessary tables
- Indexes for performance
- RLS policies for security
- Helper views for statistics
- Automatic timestamp triggers

### 2. Set Up Storage Bucket

**Option A: Manual Setup (Recommended)**

1. Go to Supabase Dashboard > Storage
2. Click "Create a new bucket"
3. Name: `lead-attachments`
4. Set as Private (uncheck "Public bucket")
5. Click "Create bucket"
6. Go to the bucket's "Policies" tab
7. Run the SQL from `leads-storage-setup.sql`

**Option B: SQL Setup**

Execute the storage setup file:

```bash
# File: leads-storage-setup.sql
```

This will create:
- Storage bucket for attachments
- Storage policies for user isolation
- File size and type restrictions

### 3. Verify Migration

After running the migration, verify:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('leads', 'routes', 'lead_notes', 'lead_interactions');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('leads', 'routes', 'lead_notes', 'lead_interactions');

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 4. Update Environment Variables

Ensure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Test User Isolation

1. Create two test users
2. Add leads as User A
3. Log in as User B
4. Verify User B cannot see User A's leads
5. Verify User B can create their own leads

## Data Migration (Optional)

If you have existing data in localStorage that needs to be migrated:

### Export from localStorage

```javascript
// Run in browser console
const leads = JSON.parse(localStorage.getItem('list-app-leads') || '[]');
const routes = JSON.parse(localStorage.getItem('list-app-routes') || '[]');

console.log('Leads:', JSON.stringify(leads, null, 2));
console.log('Routes:', JSON.stringify(routes, null, 2));
```

### Import to Supabase

Use the Supabase dashboard or create a migration script:

```typescript
// Example migration script
import { supabase } from '@/lib/supabase';

async function migrateLocalStorageData(userId: string) {
  // Get data from localStorage
  const leads = JSON.parse(localStorage.getItem('list-app-leads') || '[]');
  const routes = JSON.parse(localStorage.getItem('list-app-routes') || '[]');

  // Transform and insert leads
  for (const lead of leads) {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        mapsAddress: lead.maps_address,
        number: lead.number,
        name: lead.name,
        phone: lead.phone,
        provider: lead.provider,
        address: lead.address,
        typeOfBusiness: lead.type_of_business,
        status: lead.status,
        notes: lead.notes,
        dateToCallBack: lead.date_to_call_back,
        coordinates: lead.coordinates,
        backgroundColor: lead.background_color,
        listName: lead.list_name,
        userId: userId,
        importSessionId: lead.import_session_id,
      });

    if (error) {
      console.error('Error migrating lead:', error);
    }
  }

  // Transform and insert routes
  for (const route of routes) {
    const { data, error } = await supabase
      .from('routes')
      .insert({
        name: route.name,
        routeUrl: route.route_url,
        stopCount: route.stop_count,
        leadIds: route.lead_ids,
        startingPoint: route.starting_point,
        notes: route.notes,
        userId: userId,
      });

    if (error) {
      console.error('Error migrating route:', error);
    }
  }

  console.log('Migration complete!');
}
```

## Code Changes

### Store Updates

Both `leads.ts` and `routes.ts` stores have been updated to:
- Use `supabaseLeads` helper instead of localStorage
- Pass `userId` to all operations
- Handle Supabase errors properly
- Transform data between camelCase (DB) and snake_case (app)

### Key Changes

1. **Fetch Operations**
   ```typescript
   // Before
   const leads = storage.get<Lead[]>(STORAGE_KEYS.LEADS) || [];
   
   // After
   const leads = await supabaseLeads.getLeads(user.id, filters);
   ```

2. **Create Operations**
   ```typescript
   // Before
   storage.set(STORAGE_KEYS.LEADS, [...allLeads, newLead]);
   
   // After
   const createdLead = await supabaseLeads.createLead(user.id, newLead);
   ```

3. **Update Operations**
   ```typescript
   // Before
   allLeads[index] = updatedLead;
   storage.set(STORAGE_KEYS.LEADS, allLeads);
   
   // After
   const updatedLead = await supabaseLeads.updateLead(user.id, leadId, updates);
   ```

## Features

### Automatic Renumbering

When a lead changes status, the system automatically:
1. Assigns the next number in the new status category
2. Renumbers all leads in the old status category
3. Maintains sequential numbering

### Audit Trail

All lead interactions are logged:
- Status changes
- Note additions/updates/deletions
- Lead creation/updates
- Callback scheduling

### Statistics Views

Pre-built views for quick statistics:
- `lead_stats_by_user` - Lead counts by status per user
- `route_stats_by_user` - Route statistics per user
- `leads_with_reminders` - Leads with callback dates and reminder status

## Testing

### Test User Isolation

1. **Create Test Users**
   ```sql
   INSERT INTO users (username, password, role, name, email) VALUES
   ('testuser1', 'password123', 'user', 'Test User 1', 'test1@example.com'),
   ('testuser2', 'password123', 'user', 'Test User 2', 'test2@example.com');
   ```

2. **Add Test Data**
   ```sql
   -- As testuser1
   INSERT INTO leads (name, mapsAddress, status, "userId") VALUES
   ('Test Lead 1', 'https://maps.google.com/?q=test', 'new', 'testuser1-id');
   
   -- As testuser2
   INSERT INTO leads (name, mapsAddress, status, "userId") VALUES
   ('Test Lead 2', 'https://maps.google.com/?q=test', 'new', 'testuser2-id');
   ```

3. **Verify Isolation**
   ```sql
   -- This should only return testuser1's leads
   SELECT * FROM leads WHERE "userId" = 'testuser1-id';
   
   -- This should only return testuser2's leads
   SELECT * FROM leads WHERE "userId" = 'testuser2-id';
   ```

### Test RLS Policies

```sql
-- Set the current user context
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'testuser1-id';

-- This should only return testuser1's leads
SELECT * FROM leads;

-- This should fail (trying to access another user's data)
SELECT * FROM leads WHERE "userId" = 'testuser2-id';
```

## Performance Considerations

### Indexes

All tables have appropriate indexes:
- `userId` for user-specific queries
- `status` for filtering by status
- `listName` for filtering by list
- `createdAt` for sorting by date

### Query Optimization

The helper functions use:
- Selective column fetching
- Proper filtering at database level
- Efficient sorting and ordering
- Batch operations where possible

## Security

### RLS Policies

- All tables have RLS enabled
- Policies enforce user isolation
- No user can access another user's data
- Policies are tested and verified

### Data Validation

- Required fields enforced at database level
- Status values constrained with CHECK constraints
- Foreign key relationships maintained
- Timestamps automatically managed

## Troubleshooting

### Common Issues

1. **"User not authenticated" error**
   - Ensure user is logged in
   - Check auth token is valid
   - Verify user exists in users table

2. **"Permission denied" error**
   - Check RLS policies are enabled
   - Verify user has correct role
   - Ensure userId matches auth.uid()

3. **Data not appearing**
   - Check userId is correct
   - Verify RLS policies allow access
   - Check filters are not too restrictive

### Debug Queries

```sql
-- Check current user
SELECT current_user, current_setting('request.jwt.claim.sub', true);

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'leads';

-- Check user's leads
SELECT * FROM leads WHERE "userId" = 'your-user-id';

-- Check audit trail
SELECT * FROM lead_interactions WHERE "userId" = 'your-user-id' ORDER BY "createdAt" DESC LIMIT 10;
```

## Rollback Plan

If you need to rollback to localStorage:

1. Export data from Supabase
2. Revert code changes to use localStorage
3. Import data back to localStorage
4. Drop Supabase tables (optional)

```sql
-- Drop tables (if needed)
DROP TABLE IF EXISTS lead_interactions CASCADE;
DROP TABLE IF EXISTS lead_notes CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
```

## File Attachments

### Upload Files

Use the `AttachmentUploader` component:

```tsx
import AttachmentUploader from '@/components/leads/attachments/AttachmentUploader';

<AttachmentUploader 
  leadId={lead.id}
  onUploadComplete={() => console.log('Upload complete')}
/>
```

### Supported File Types

- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, Word (.doc, .docx), Excel (.xls, .xlsx)
- Text: Plain text (.txt), CSV (.csv)
- Max file size: 50MB

### Storage Structure

Files are organized by user and lead:
```
lead-attachments/
  {user_id}/
    {lead_id}/
      {timestamp}-{random}.{ext}
```

### Security

- Files stored in private bucket
- Only file owner can access
- Signed URLs expire after 1 hour
- Storage policies enforce user isolation

## Next Steps

1. ✅ Run database migration
2. ✅ Set up storage bucket
3. ✅ Verify RLS policies
4. ✅ Test user isolation
5. ✅ Migrate existing data (if any)
6. ✅ Test all lead operations
7. ✅ Test all route operations
8. ✅ Test file uploads
9. ✅ Monitor performance
10. ✅ Set up backups

## Support

For issues or questions:
1. Check this guide
2. Review Supabase documentation
3. Check application logs
4. Test with SQL queries
5. Contact development team

## Conclusion

The migration to Supabase provides:
- ✅ Complete user isolation
- ✅ Data persistence across devices
- ✅ Automatic backups
- ✅ Audit trail
- ✅ Better performance
- ✅ Scalability
- ✅ Security with RLS

All lead management functionality now works exactly as before, but with the added benefits of cloud storage and complete user isolation.
