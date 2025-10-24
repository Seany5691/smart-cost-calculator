# Design Document

## Overview

This design document outlines the technical solution for fixing the critical bug where existing deals with text-based IDs cannot be migrated to Supabase due to UUID type constraints. The root cause is that the `deal_calculations` table uses UUID type for the `id` column, but legacy deals use text-based IDs like `deal_1756736387419_xqm3j7r99`.

### Problem Statement

**Current Error:**
```
invalid input syntax for type uuid: "deal_1756736387419_xqm3j7r99"
```

**Root Cause:**
- The Supabase schema defines `deal_calculations.id` as UUID type
- Legacy deals in localStorage use text-based IDs (format: `deal_{timestamp}_{random}`)
- PostgreSQL rejects text-based IDs when inserting into UUID columns
- Migration fails completely, preventing users from accessing their deals

### Design Principles

1. **Backward Compatibility**: Support both legacy text-based IDs and new UUID format IDs
2. **Zero Data Loss**: All existing deals must be preserved and migrated successfully
3. **Forward Compatibility**: New deals should use proper UUID format
4. **Minimal Changes**: Limit changes to database schema and migration logic only
5. **Safe Migration**: Handle errors gracefully without blocking users

## Architecture

### System Components Affected

1. **Database Schema** (`supabase-schema.sql`)
   - Change `deal_calculations.id` from UUID to TEXT
   - Change `activity_logs.dealId` from VARCHAR to TEXT for consistency

2. **Migration Logic** (`src/store/calculator.ts`)
   - Update `migrateDealsToSupabase()` to handle both ID formats
   - Add ID validation and transformation logic

3. **Deal ID Generation** (`src/store/calculator.ts`)
   - Update `saveDeal()` to generate UUID format for new deals
   - Preserve existing IDs when updating deals

4. **Supabase Helpers** (`src/lib/supabase.ts`)
   - No changes needed (already uses string parameters)

## Database Schema Changes

### Current Schema (Problematic)

```sql
CREATE TABLE deal_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID REFERENCES users(id),
    username VARCHAR(255),
    userRole VARCHAR(50),
    dealName VARCHAR(255),
    customerName VARCHAR(255),
    dealDetails JSONB NOT NULL,
    sectionsData JSONB NOT NULL,
    totalsData JSONB NOT NULL,
    factorsData JSONB NOT NULL,
    scalesData JSONB NOT NULL,
    pdfUrl VARCHAR(500),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### New Schema (Fixed)

```sql
CREATE TABLE deal_calculations (
    id TEXT PRIMARY KEY,  -- Changed from UUID to TEXT
    userId UUID REFERENCES users(id),
    username VARCHAR(255),
    userRole VARCHAR(50),
    dealName VARCHAR(255),
    customerName VARCHAR(255),
    dealDetails JSONB NOT NULL,
    sectionsData JSONB NOT NULL,
    totalsData JSONB NOT NULL,
    factorsData JSONB NOT NULL,
    scalesData JSONB NOT NULL,
    pdfUrl VARCHAR(500),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Activity Logs Schema Update

```sql
CREATE TABLE activity_logs (
    id VARCHAR(255) PRIMARY KEY,
    userId UUID NOT NULL REFERENCES users(id),
    username VARCHAR(255) NOT NULL,
    userRole VARCHAR(50) NOT NULL CHECK (userRole IN ('admin', 'manager', 'user')),
    activityType VARCHAR(50) NOT NULL CHECK (activityType IN ('deal_created', 'deal_saved', 'proposal_generated', 'pdf_generated', 'deal_loaded')),
    dealId TEXT,  -- Changed from VARCHAR(255) to TEXT for consistency
    dealName VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Migration SQL Script

**File**: `fix-deal-id-schema.sql`

```sql
-- Fix deal_calculations table to accept both UUID and text-based IDs
-- This script safely converts the id column from UUID to TEXT

-- Step 1: Check if table exists and has data
DO $
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deal_calculations') THEN
        RAISE NOTICE 'deal_calculations table exists, proceeding with migration';
    ELSE
        RAISE EXCEPTION 'deal_calculations table does not exist';
    END IF;
END $;

-- Step 2: Drop existing constraints and indexes that depend on the id column
ALTER TABLE deal_calculations DROP CONSTRAINT IF EXISTS deal_calculations_pkey CASCADE;
DROP INDEX IF EXISTS idx_deal_calculations_user_id;
DROP INDEX IF EXISTS idx_deal_calculations_created_at;

-- Step 3: Convert id column from UUID to TEXT
-- This preserves existing UUID values as text
ALTER TABLE deal_calculations ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Step 4: Re-add primary key constraint
ALTER TABLE deal_calculations ADD PRIMARY KEY (id);

-- Step 5: Recreate indexes
CREATE INDEX idx_deal_calculations_user_id ON deal_calculations(userId);
CREATE INDEX idx_deal_calculations_created_at ON deal_calculations(createdAt DESC);

-- Step 6: Update activity_logs table to use TEXT for dealId
ALTER TABLE activity_logs ALTER COLUMN dealId TYPE TEXT USING dealId::TEXT;

-- Step 7: Verify the changes
DO $
DECLARE
    id_type TEXT;
BEGIN
    SELECT data_type INTO id_type
    FROM information_schema.columns
    WHERE table_name = 'deal_calculations' AND column_name = 'id';
    
    IF id_type = 'text' THEN
        RAISE NOTICE 'SUCCESS: deal_calculations.id is now TEXT type';
    ELSE
        RAISE EXCEPTION 'FAILED: deal_calculations.id is still % type', id_type;
    END IF;
END $;

-- Success message
SELECT 'Deal ID schema migration completed successfully!' as status,
       'The deal_calculations table now accepts both UUID and text-based IDs' as message;
```

## Components and Interfaces

### 1. Deal ID Generation Utility

**File**: `src/lib/utils/idGenerator.ts` (New)

```typescript
/**
 * Generate a UUID for new deals
 * Uses crypto.randomUUID() if available, otherwise falls back to a polyfill
 */
export function generateDealId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validate if a string is a valid UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate if a string is a valid legacy deal ID format
 */
export function isValidLegacyDealId(id: string): boolean {
  const legacyRegex = /^deal_\d+_[a-z0-9]+$/;
  return legacyRegex.test(id);
}

/**
 * Validate if a string is any valid deal ID format
 */
export function isValidDealId(id: string): boolean {
  return isValidUUID(id) || isValidLegacyDealId(id);
}

/**
 * Get the ID format type
 */
export function getDealIdType(id: string): 'uuid' | 'legacy' | 'invalid' {
  if (isValidUUID(id)) return 'uuid';
  if (isValidLegacyDealId(id)) return 'legacy';
  return 'invalid';
}
```

### 2. Updated Calculator Store - saveDeal()

**File**: `src/store/calculator.ts`

**Changes to saveDeal() method:**

```typescript
saveDeal: async () => {
  const { sections, dealDetails, currentDealId, originalUserContext } = get();
  const user = useAuthStore.getState().user;

  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const totals = get().calculateTotalCosts();
    
    // Generate new UUID for new deals, preserve existing ID for updates
    const dealId = currentDealId || generateDealId();
    
    const dealData = {
      id: dealId,
      userId: originalUserContext?.userId || user.id,
      username: originalUserContext?.username || user.username,
      userRole: originalUserContext?.role || user.role,
      customerName: dealDetails.customerName,
      dealName: dealDetails.customerName,
      dealDetails,
      sectionsData: sections,
      totalsData: totals,
      factorsData: get().factors,
      scalesData: get().scales,
      updatedAt: new Date().toISOString()
    };

    if (currentDealId) {
      // Update existing deal (preserve createdAt)
      const { data, error } = await supabase
        .from('deal_calculations')
        .update(dealData)
        .eq('id', currentDealId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity({
        userId: user.id,
        username: user.username,
        userRole: user.role,
        activityType: 'deal_saved',
        dealId: currentDealId,
        dealName: dealDetails.customerName
      });
    } else {
      // Create new deal (set createdAt)
      const newDealData = {
        ...dealData,
        createdAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('deal_calculations')
        .insert(newDealData)
        .select()
        .single();

      if (error) throw error;

      // Set current deal ID
      set({ currentDealId: dealId });

      // Log activity
      await logActivity({
        userId: user.id,
        username: user.username,
        userRole: user.role,
        activityType: 'deal_created',
        dealId: dealId,
        dealName: dealDetails.customerName
      });
    }

    toast.success('Deal Saved', 'Your deal has been saved successfully.');
    return true;
  } catch (error) {
    console.error('Failed to save deal to Supabase:', error);
    toast.error('Save Failed', 'Could not save deal to database.');
    return false;
  }
}
```

### 3. Updated Migration Logic

**File**: `src/store/calculator.ts`

**Changes to migrateDealsToSupabase():**

```typescript
migrateDealsToSupabase: async () => {
  try {
    const migrationKey = 'deals-migrated-v2'; // New key to force re-migration
    
    // Check if migration already completed
    if (typeof window !== 'undefined') {
      if (localStorage.getItem(migrationKey) === 'true') {
        return true;
      }
    }

    // Get deals from localStorage
    const localDeals = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('deals-storage') || '[]')
      : [];

    if (localDeals.length === 0) {
      // No deals to migrate
      if (typeof window !== 'undefined') {
        localStorage.setItem(migrationKey, 'true');
      }
      return true;
    }

    console.log(`Starting migration of ${localDeals.length} deals...`);

    // Transform deals to match Supabase schema
    const dealsToMigrate = localDeals.map((deal: any) => ({
      id: deal.id, // Preserve original ID (text or UUID)
      userId: deal.userId,
      username: deal.username,
      userRole: deal.userRole,
      customerName: deal.customerName || deal.dealDetails?.customerName,
      dealName: deal.customerName || deal.dealDetails?.customerName,
      dealDetails: deal.dealDetails || {
        customerName: deal.customerName,
        term: deal.term,
        escalation: deal.escalation,
        distanceToInstall: deal.distanceToInstall,
        settlement: deal.settlement
      },
      sectionsData: deal.sections || deal.sectionsData,
      totalsData: deal.totals || deal.totalsData,
      factorsData: deal.factors || deal.factorsData,
      scalesData: deal.scales || deal.scalesData,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt
    }));

    // Migrate deals one by one to handle errors gracefully
    let successCount = 0;
    let failCount = 0;

    for (const deal of dealsToMigrate) {
      try {
        // Validate deal ID
        if (!isValidDealId(deal.id)) {
          console.warn(`Invalid deal ID format: ${deal.id}, generating new UUID`);
          deal.id = generateDealId();
        }

        // Check if deal already exists
        const { data: existingDeal, error: fetchError } = await supabase
          .from('deal_calculations')
          .select('id, createdAt')
          .eq('id', deal.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected
          throw fetchError;
        }

        if (existingDeal) {
          // Update existing deal, preserving original createdAt
          const { error: updateError } = await supabase
            .from('deal_calculations')
            .update({
              ...deal,
              createdAt: existingDeal.createdAt // Preserve original createdAt
            })
            .eq('id', deal.id);

          if (updateError) throw updateError;
          console.log(`Updated existing deal: ${deal.id}`);
        } else {
          // Create new deal
          const { error: insertError } = await supabase
            .from('deal_calculations')
            .insert(deal);

          if (insertError) throw insertError;
          console.log(`Migrated new deal: ${deal.id}`);
        }

        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to migrate deal ${deal.id}:`, error);
        // Continue with next deal
      }
    }

    console.log(`Migration complete: ${successCount} succeeded, ${failCount} failed`);

    // Mark migration as complete even if some deals failed
    // This prevents infinite retry loops
    if (typeof window !== 'undefined') {
      localStorage.setItem(migrationKey, 'true');
    }

    // Show user feedback
    if (successCount > 0) {
      toast.success(
        'Migration Complete',
        `Successfully migrated ${successCount} deal${successCount > 1 ? 's' : ''} to cloud storage.`
      );
    }

    if (failCount > 0) {
      toast.warning(
        'Partial Migration',
        `${failCount} deal${failCount > 1 ? 's' : ''} could not be migrated. Please contact support.`
      );
    }

    return successCount > 0;
  } catch (error) {
    console.error('Failed to migrate deals to Supabase:', error);
    toast.error('Migration Failed', 'Could not migrate deals to cloud storage.');
    return false;
  }
}
```

## Data Models

### Deal Calculation Interface

```typescript
interface DealCalculation {
  id: string;                    // TEXT - accepts both UUID and legacy format
  userId: string;                // UUID of user who created deal
  username: string;              // Username for display
  userRole: string;              // User role at time of creation
  dealName: string;              // Deal/customer name
  customerName: string;          // Customer name
  dealDetails: DealDetails;      // Deal configuration
  sectionsData: Section[];       // Calculator sections
  totalsData: TotalCosts;        // Calculated totals
  factorsData: any;              // Financing factors
  scalesData: any;               // Pricing scales
  pdfUrl?: string;               // Generated PDF URL
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

### ID Format Examples

**Legacy Format (Text-based):**
```
deal_1756736387419_xqm3j7r99
deal_1756736388520_abc123xyz
```

**New Format (UUID):**
```
550e8400-e29b-41d4-a716-446655440000
f47ac10b-58cc-4372-a567-0e02b2c3d479
```

## Error Handling

### Migration Error Scenarios

1. **Invalid ID Format**
   - **Detection**: Use `isValidDealId()` to validate
   - **Resolution**: Generate new UUID and log warning
   - **User Impact**: None (transparent fix)

2. **Duplicate Deal ID**
   - **Detection**: Check if deal exists before insert
   - **Resolution**: Update existing deal instead of insert
   - **User Impact**: None (upsert behavior)

3. **Supabase Connection Error**
   - **Detection**: Catch network/database errors
   - **Resolution**: Log error, continue with next deal
   - **User Impact**: Partial migration, show warning

4. **Schema Mismatch**
   - **Detection**: PostgreSQL error on insert/update
   - **Resolution**: Log error, skip deal
   - **User Impact**: Deal not migrated, show error

### Error Logging Strategy

```typescript
// Detailed error logging for debugging
console.error('Migration error details:', {
  dealId: deal.id,
  dealName: deal.dealName,
  error: error.message,
  errorCode: error.code,
  timestamp: new Date().toISOString()
});
```

## Testing Strategy

### Unit Tests

**File**: `src/lib/utils/idGenerator.test.ts`

```typescript
describe('ID Generator', () => {
  test('generateDealId returns valid UUID', () => {
    const id = generateDealId();
    expect(isValidUUID(id)).toBe(true);
  });

  test('isValidUUID recognizes valid UUIDs', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('invalid-uuid')).toBe(false);
  });

  test('isValidLegacyDealId recognizes legacy format', () => {
    expect(isValidLegacyDealId('deal_1756736387419_xqm3j7r99')).toBe(true);
    expect(isValidLegacyDealId('invalid_format')).toBe(false);
  });

  test('isValidDealId accepts both formats', () => {
    expect(isValidDealId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidDealId('deal_1756736387419_xqm3j7r99')).toBe(true);
    expect(isValidDealId('invalid')).toBe(false);
  });
});
```

### Integration Tests

1. **Test Migration with Legacy IDs**
   - Create localStorage deals with text-based IDs
   - Run migration
   - Verify deals exist in Supabase with original IDs

2. **Test Migration with UUID IDs**
   - Create localStorage deals with UUID format IDs
   - Run migration
   - Verify deals exist in Supabase

3. **Test Mixed ID Formats**
   - Create deals with both legacy and UUID IDs
   - Run migration
   - Verify all deals migrated successfully

4. **Test New Deal Creation**
   - Create new deal after migration
   - Verify it uses UUID format
   - Verify it saves to Supabase

5. **Test Deal Update**
   - Load legacy deal with text-based ID
   - Update and save
   - Verify ID remains unchanged

### Manual Testing Checklist

- [ ] Run schema migration SQL on Supabase
- [ ] Verify `deal_calculations.id` is TEXT type
- [ ] Create test deals with legacy IDs in localStorage
- [ ] Run application and trigger migration
- [ ] Verify all deals appear in Supabase
- [ ] Verify no console errors
- [ ] Create new deal and verify UUID format
- [ ] Update legacy deal and verify ID preserved
- [ ] Delete legacy deal and verify removal
- [ ] Test with empty localStorage
- [ ] Test with already-migrated deals

## Deployment Plan

### Phase 1: Database Schema Update

1. **Backup Current Data**
   ```sql
   -- Create backup of deal_calculations table
   CREATE TABLE deal_calculations_backup AS SELECT * FROM deal_calculations;
   ```

2. **Run Migration Script**
   - Execute `fix-deal-id-schema.sql` on Supabase
   - Verify no errors in execution
   - Verify id column is TEXT type

3. **Verify Data Integrity**
   ```sql
   -- Check row count matches
   SELECT COUNT(*) FROM deal_calculations;
   SELECT COUNT(*) FROM deal_calculations_backup;
   
   -- Verify all IDs converted correctly
   SELECT id FROM deal_calculations LIMIT 10;
   ```

### Phase 2: Code Deployment

1. **Deploy ID Generator Utility**
   - Add `src/lib/utils/idGenerator.ts`
   - Run unit tests

2. **Update Calculator Store**
   - Update `saveDeal()` method
   - Update `migrateDealsToSupabase()` method
   - Test locally with sample data

3. **Deploy to Staging**
   - Deploy code changes
   - Test migration with production-like data
   - Monitor console for errors

4. **Deploy to Production**
   - Deploy during low-traffic period
   - Monitor error logs
   - Watch for migration success messages

### Phase 3: Monitoring and Validation

1. **Monitor Migration Success**
   - Check Supabase dashboard for new deals
   - Monitor console logs for errors
   - Track user feedback

2. **Verify Deal Operations**
   - Test creating new deals
   - Test loading existing deals
   - Test updating deals
   - Test deleting deals

3. **Performance Check**
   - Monitor query response times
   - Check database load
   - Verify indexes are used

### Rollback Plan

If critical issues occur:

1. **Revert Code Changes**
   - Deploy previous version of calculator store
   - Restore old migration logic

2. **Restore Database Schema** (if needed)
   ```sql
   -- Restore from backup
   DROP TABLE deal_calculations;
   ALTER TABLE deal_calculations_backup RENAME TO deal_calculations;
   
   -- Recreate indexes
   CREATE INDEX idx_deal_calculations_user_id ON deal_calculations(userId);
   CREATE INDEX idx_deal_calculations_created_at ON deal_calculations(createdAt);
   ```

3. **Clear Migration Flag**
   - Users may need to clear localStorage key `deals-migrated-v2`

## Performance Considerations

### Query Performance

- TEXT type for id column has minimal performance impact
- Existing indexes remain effective
- Primary key lookups are still O(1)

### Migration Performance

- One-by-one migration prevents timeout issues
- Error handling allows partial success
- Progress logging helps debugging

### Storage Impact

- TEXT type uses slightly more storage than UUID
- Negligible impact for typical deal volumes
- Legacy IDs are ~30 bytes, UUIDs are 36 bytes

## Security Considerations

### ID Predictability

- Legacy IDs contain timestamps (predictable)
- New UUIDs are cryptographically random (secure)
- Both formats are acceptable for non-sensitive data

### SQL Injection

- TEXT type doesn't introduce new injection risks
- Supabase client uses parameterized queries
- No raw SQL construction in application code

## Future Enhancements

### Potential Improvements (Out of Scope)

1. **ID Migration to UUID**
   - Gradually convert legacy IDs to UUIDs
   - Maintain mapping table for backward compatibility
   - Update all references in activity logs

2. **ID Format Enforcement**
   - Add database constraint to enforce UUID format
   - Reject legacy format for new deals
   - Implement after all legacy deals converted

3. **Audit Trail**
   - Track ID format changes
   - Log migration events
   - Monitor ID format distribution

4. **Performance Optimization**
   - Consider UUID type with custom validation
   - Implement batch migration for large datasets
   - Add migration progress indicator
