# Design Document: Fix RLS Policies

## Overview

The Smart Cost Calculator is experiencing RLS (Row-Level Security) policy violations when attempting to insert records into the `deal_calculations` table. The application uses Supabase's anonymous key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) for database access, which means all operations are performed under the `anon` role. Despite having policies defined in the schema that claim to "Allow all operations", these policies are not functioning correctly.

The root cause is that the existing RLS policies use `USING (true) WITH CHECK (true)`, but Supabase requires explicit role-based policies. The `anon` role is not being granted the necessary permissions through the current policy configuration.

## Architecture

### Current State
- Application uses `@supabase/supabase-js` client library
- Authentication: Anonymous access via `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- No Supabase Auth integration (custom user management in `users` table)
- RLS is enabled on all tables but policies are ineffective

### Target State
- RLS policies explicitly grant permissions to the `anon` role
- Policies use proper PostgreSQL role checks
- All CRUD operations work for anonymous users
- Security is maintained through application-level logic (existing user management)

## Components and Interfaces

### 1. Database Schema Updates

**File**: `fix-rls-policies-migration.sql`

The migration will:
1. Drop existing ineffective policies on all tables
2. Create new policies that explicitly grant permissions to `anon` and `authenticated` roles
3. Optionally grant permissions to `service_role` for administrative operations

### 2. Policy Structure

Each table will have policies following this pattern:

```sql
-- Enable SELECT for anon and authenticated roles
CREATE POLICY "Enable read access for all users" ON table_name
    FOR SELECT
    USING (true);

-- Enable INSERT for anon and authenticated roles  
CREATE POLICY "Enable insert access for all users" ON table_name
    FOR INSERT
    WITH CHECK (true);

-- Enable UPDATE for anon and authenticated roles
CREATE POLICY "Enable update access for all users" ON table_name
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Enable DELETE for anon and authenticated roles
CREATE POLICY "Enable delete access for all users" ON table_name
    FOR DELETE
    USING (true);
```

### 3. Tables Requiring Policy Updates

All tables with RLS enabled:
- `users`
- `hardware_items`
- `connectivity_items`
- `licensing_items`
- `factors`
- `scales`
- `deal_calculations` (primary focus)
- `activity_logs` (if exists)

## Data Models

No changes to data models. The existing schema structure remains intact:

```typescript
deal_calculations: {
  id: UUID (PK)
  userId: UUID (FK to users)
  username: string
  userRole: string
  dealName: string
  customerName: string
  dealDetails: JSONB
  sectionsData: JSONB
  totalsData: JSONB
  factorsData: JSONB
  scalesData: JSONB
  pdfUrl: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

## Error Handling

### Current Error
```
{
  code: '42501',
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "deal_calculations"'
}
```

### Resolution Strategy

1. **Immediate Fix**: Apply migration to update RLS policies
2. **Verification**: Test INSERT operations through Supabase client
3. **Fallback**: Application already has localStorage fallback (keep as safety net)
4. **Monitoring**: Log successful Supabase operations to confirm fix

### Error Logging Enhancement

Update `supabase.ts` helper functions to provide more detailed error information:

```typescript
async createDeal(deal: any) {
  try {
    const { data, error } = await supabase
      .from('deal_calculations')
      .insert(deal)
      .select()
      .single();

    if (error) {
      console.error('Supabase RLS Error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Failed to create deal in Supabase:', error);
    throw error;
  }
}
```

## Testing Strategy

### 1. Direct Database Testing

Create a test SQL script to verify policies work:

```sql
-- Test as anon role
SET ROLE anon;

-- Test INSERT
INSERT INTO deal_calculations (
  userId, username, userRole, dealName, customerName,
  dealDetails, sectionsData, totalsData, factorsData, scalesData
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'test_user',
  'user',
  'Test Deal',
  'Test Customer',
  '{}', '{}', '{}', '{}', '{}'
);

-- Test SELECT
SELECT * FROM deal_calculations LIMIT 1;

-- Test UPDATE
UPDATE deal_calculations 
SET dealName = 'Updated Test Deal'
WHERE id = (SELECT id FROM deal_calculations LIMIT 1);

-- Test DELETE
DELETE FROM deal_calculations 
WHERE dealName = 'Test Deal';

-- Reset role
RESET ROLE;
```

### 2. Application Testing

Test through the actual application interface:
1. Open calculator page
2. Configure a deal with items
3. Click "Save Deal" button
4. Verify no RLS errors in console
5. Verify deal appears in saved deals list
6. Verify no localStorage fallback message

### 3. API Testing

Test using Supabase client directly:

```typescript
// test-rls-fix.ts
import { supabase } from './src/lib/supabase';

async function testRLSFix() {
  const testDeal = {
    userId: '00000000-0000-0000-0000-000000000000',
    username: 'test_user',
    userRole: 'user',
    dealName: 'RLS Test Deal',
    customerName: 'Test Customer',
    dealDetails: {},
    sectionsData: {},
    totalsData: {},
    factorsData: {},
    scalesData: {}
  };

  try {
    const { data, error } = await supabase
      .from('deal_calculations')
      .insert(testDeal)
      .select()
      .single();

    if (error) {
      console.error('❌ RLS Test Failed:', error);
      return false;
    }

    console.log('✅ RLS Test Passed:', data);
    
    // Cleanup
    await supabase
      .from('deal_calculations')
      .delete()
      .eq('id', data.id);

    return true;
  } catch (err) {
    console.error('❌ RLS Test Exception:', err);
    return false;
  }
}

testRLSFix();
```

## Implementation Notes

### Security Considerations

1. **Anonymous Access**: The application currently uses anonymous access, which is appropriate for this use case since:
   - Custom user management is implemented in the `users` table
   - Application-level authentication controls access
   - RLS provides defense-in-depth but not primary security

2. **Future Enhancement**: Consider migrating to Supabase Auth for:
   - User-specific RLS policies (users can only see their own deals)
   - Proper JWT-based authentication
   - Built-in session management

3. **Current Approach**: Permissive policies are acceptable because:
   - Application is internal/controlled environment
   - User management exists at application level
   - RLS prevents accidental data exposure, not malicious access

### Migration Execution

The migration should be executed in Supabase SQL Editor:
1. Navigate to Supabase Dashboard → SQL Editor
2. Create new query
3. Paste migration SQL
4. Execute
5. Verify no errors
6. Test application immediately

### Rollback Plan

If issues occur:
1. Policies can be dropped and recreated
2. Original schema file can be re-run (though this resets data)
3. Application continues to work via localStorage fallback

## Alternative Approaches Considered

### 1. Use Service Role Key
**Pros**: Bypasses RLS entirely
**Cons**: Security risk, not recommended for client-side code
**Decision**: Rejected - keep using anon key with proper policies

### 2. Disable RLS
**Pros**: Simplest solution
**Cons**: Removes security layer, not best practice
**Decision**: Rejected - fix policies instead

### 3. Implement Supabase Auth
**Pros**: Proper authentication, user-specific policies
**Cons**: Requires significant refactoring of existing user management
**Decision**: Deferred - fix immediate issue first, consider for future

## Success Criteria

1. ✅ Deal calculations can be inserted without RLS errors
2. ✅ All CRUD operations work on all tables
3. ✅ No console errors related to RLS policies
4. ✅ Application no longer falls back to localStorage
5. ✅ Test script passes all policy checks
6. ✅ Existing data remains intact and accessible
