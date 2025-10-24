# PostgreSQL Column Name Handling

## Issue: Case-Sensitive Column Names

PostgreSQL treats unquoted identifiers as **lowercase** by default, but the base schema uses **camelCase** column names (e.g., `userId`, `createdAt`, `dealName`).

### The Problem

When you create a table with camelCase columns without quotes:
```sql
CREATE TABLE example (userId UUID);
```

PostgreSQL converts it to lowercase: `userid`

But when you query with camelCase:
```sql
SELECT * FROM example WHERE userId = '123';
```

PostgreSQL looks for lowercase `userid`, which works. However, if the column was created WITH quotes:
```sql
CREATE TABLE example ("userId" UUID);
```

Then you MUST use quotes in queries:
```sql
SELECT * FROM example WHERE "userId" = '123';  -- ✅ Works
SELECT * FROM example WHERE userId = '123';    -- ❌ Fails: column "userid" does not exist
```

## Solution: Quoted Identifiers

All SQL files have been updated to use **quoted identifiers** for camelCase columns:

### Tables with camelCase Columns

#### activity_logs
- `"userId"` - User ID (UUID)
- `"userRole"` - User role
- `"activityType"` - Activity type
- `"dealId"` - Deal ID
- `"dealName"` - Deal name
- `"createdAt"` - Creation timestamp

#### deal_calculations
- `"userId"` - User ID (UUID)
- `"userRole"` - User role
- `"dealName"` - Deal name
- `"customerName"` - Customer name
- `"dealDetails"` - Deal details (JSONB)
- `"sectionsData"` - Sections data (JSONB)
- `"totalsData"` - Totals data (JSONB)
- `"factorsData"` - Factors data (JSONB)
- `"scalesData"` - Scales data (JSONB)
- `"pdfUrl"` - PDF URL
- `"createdAt"` - Creation timestamp
- `"updatedAt"` - Update timestamp

#### scraper_industries
- `"userId"` - User ID (UUID)
- `"isActive"` - Active status
- `"createdAt"` - Creation timestamp
- `"updatedAt"` - Update timestamp

#### scraper_saved_sessions
- `"userId"` - User ID (UUID)
- `"sessionName"` - Session name
- `"createdAt"` - Creation timestamp
- `"updatedAt"` - Update timestamp

### Updated Files

All SQL files now use quoted identifiers:

1. **supabase-sync-migration.sql**
   - Table creation with quoted columns
   - Index creation with quoted columns
   - RLS policies with quoted columns
   - Helper views with quoted columns
   - Sample data inserts with quoted columns

2. **test-supabase-sync-schema.sql**
   - All INSERT statements use quoted columns
   - All SELECT queries use quoted columns
   - All WHERE clauses use quoted columns

## Query Examples

### ✅ Correct Usage (with quotes)

```sql
-- Insert with quoted identifiers
INSERT INTO activity_logs (id, "userId", "userRole", "activityType") 
VALUES ('act_1', 'uuid-here', 'admin', 'deal_created');

-- Query with quoted identifiers
SELECT * FROM activity_logs 
WHERE "userId" = 'uuid-here' 
ORDER BY "createdAt" DESC;

-- Update with quoted identifiers
UPDATE deal_calculations 
SET "updatedAt" = NOW() 
WHERE "userId" = 'uuid-here';

-- RLS policy with quoted identifiers
CREATE POLICY "user_policy" ON activity_logs
FOR SELECT USING ("userId" = auth.uid());
```

### ❌ Incorrect Usage (without quotes)

```sql
-- This will fail if columns were created with quotes
SELECT * FROM activity_logs WHERE userId = 'uuid-here';
-- Error: column "userid" does not exist

-- This will also fail
UPDATE deal_calculations SET updatedAt = NOW();
-- Error: column "updatedat" does not exist
```

## Application Code

When using Supabase client in TypeScript/JavaScript, column names should match exactly:

```typescript
// ✅ Correct - matches camelCase columns
const { data } = await supabase
  .from('activity_logs')
  .select('*')
  .eq('userId', userId)
  .order('createdAt', { ascending: false });

// ✅ Also correct - Supabase handles the quoting
const { data } = await supabase
  .from('deal_calculations')
  .insert({
    id: 'deal_123',
    userId: user.id,
    dealName: 'Acme Corp',
    createdAt: new Date().toISOString()
  });
```

Supabase client automatically handles the quoting, so you can use camelCase in your application code.

## Migration Notes

If you encounter column name errors:

1. **Check if columns exist:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'activity_logs';
   ```

2. **Verify column case:**
   - If you see `userid` (lowercase), the column was created without quotes
   - If you see `userId` (camelCase), the column was created with quotes

3. **Fix queries:**
   - Use quotes for camelCase: `"userId"`
   - Or use lowercase without quotes: `userid`

## Best Practices

1. **Be Consistent**: Either use all lowercase (snake_case) or all camelCase with quotes
2. **Use Quotes**: When using camelCase, always use quotes in SQL
3. **Document**: Make it clear which naming convention is used
4. **Test**: Run test scripts to verify column names work correctly

## Summary

All SQL files in this project now correctly use **quoted identifiers** for camelCase columns. This ensures compatibility with the base schema and prevents "column does not exist" errors.

The migration script (`supabase-sync-migration.sql`) is now ready to run without column name errors.
