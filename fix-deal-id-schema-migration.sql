-- ============================================================================
-- FIX DEAL ID SCHEMA MIGRATION
-- ============================================================================
-- Purpose: Convert deal_calculations.id from UUID to TEXT to support both
--          legacy text-based IDs (e.g., deal_1756736387419_xqm3j7r99) and
--          new UUID format IDs
-- 
-- This migration addresses the critical bug where existing deals with text-based
-- IDs cannot be migrated to Supabase due to UUID type constraints.
--
-- IMPORTANT: This script includes:
-- 1. Safe migration with data preservation
-- 2. Backup creation before changes
-- 3. Rollback instructions
-- 4. Verification queries
-- 5. Activity logs dealId column update
-- ============================================================================

-- ============================================================================
-- STEP 1: PRE-MIGRATION VERIFICATION
-- ============================================================================

DO $$
DECLARE
    table_exists BOOLEAN;
    row_count INTEGER;
    id_type TEXT;
BEGIN
    -- Check if deal_calculations table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'deal_calculations'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'ERROR: deal_calculations table does not exist. Please run base schema first.';
    END IF;
    
    -- Get current row count
    SELECT COUNT(*) INTO row_count FROM deal_calculations;
    RAISE NOTICE 'Pre-migration: deal_calculations has % rows', row_count;
    
    -- Get current id column type
    SELECT data_type INTO id_type
    FROM information_schema.columns
    WHERE table_name = 'deal_calculations' 
    AND column_name = 'id';
    
    RAISE NOTICE 'Pre-migration: id column type is %', id_type;
    
    IF id_type = 'text' THEN
        RAISE NOTICE 'WARNING: id column is already TEXT type. Migration may have already been applied.';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE BACKUP TABLE
-- ============================================================================

-- Drop backup table if it exists from previous migration attempt
DROP TABLE IF EXISTS deal_calculations_backup_uuid_to_text;

-- Create backup of current deal_calculations table
CREATE TABLE deal_calculations_backup_uuid_to_text AS 
SELECT * FROM deal_calculations;

-- Verify backup was created successfully
DO $$
DECLARE
    original_count INTEGER;
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO original_count FROM deal_calculations;
    SELECT COUNT(*) INTO backup_count FROM deal_calculations_backup_uuid_to_text;
    
    IF original_count = backup_count THEN
        RAISE NOTICE 'Backup created successfully: % rows backed up', backup_count;
    ELSE
        RAISE EXCEPTION 'Backup verification failed: original=%, backup=%', original_count, backup_count;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: DROP DEPENDENT CONSTRAINTS AND INDEXES
-- ============================================================================

-- Drop primary key constraint (will be recreated after type change)
ALTER TABLE deal_calculations DROP CONSTRAINT IF EXISTS deal_calculations_pkey CASCADE;

-- Drop indexes that depend on the id column
DROP INDEX IF EXISTS idx_deal_calculations_user_id;
DROP INDEX IF EXISTS idx_deal_calculations_created_at;

-- ============================================================================
-- STEP 4: CONVERT ID COLUMN FROM UUID TO TEXT
-- ============================================================================

-- Convert id column type from UUID to TEXT
-- USING clause converts existing UUID values to their text representation
ALTER TABLE deal_calculations 
ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- ============================================================================
-- STEP 5: RECREATE PRIMARY KEY AND INDEXES
-- ============================================================================

-- Recreate primary key constraint on id column
ALTER TABLE deal_calculations ADD PRIMARY KEY (id);

-- Recreate performance indexes
CREATE INDEX idx_deal_calculations_user_id ON deal_calculations("userId");
CREATE INDEX idx_deal_calculations_created_at ON deal_calculations("createdAt" DESC);

-- Log progress
DO $$
BEGIN
    RAISE NOTICE 'Dropped constraints, converted id column to TEXT, and recreated indexes';
END $$;

-- ============================================================================
-- STEP 6: UPDATE ACTIVITY_LOGS TABLE
-- ============================================================================

-- Drop dependent views before altering activity_logs
DROP VIEW IF EXISTS recent_activity_logs;

-- Check if activity_logs table exists before updating
DO $$
DECLARE
    table_exists BOOLEAN;
    dealid_type TEXT;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Get current dealId column type
        SELECT data_type INTO dealid_type
        FROM information_schema.columns
        WHERE table_name = 'activity_logs' 
        AND column_name = 'dealId';
        
        RAISE NOTICE 'activity_logs.dealId current type: %', dealid_type;
        
        -- Convert dealId to TEXT if it's not already
        IF dealid_type != 'text' THEN
            ALTER TABLE activity_logs 
            ALTER COLUMN "dealId" TYPE TEXT USING "dealId"::TEXT;
            RAISE NOTICE 'Converted activity_logs.dealId to TEXT';
        ELSE
            RAISE NOTICE 'activity_logs.dealId is already TEXT type';
        END IF;
    ELSE
        RAISE NOTICE 'activity_logs table does not exist, skipping dealId update';
    END IF;
END $$;

-- Recreate the recent_activity_logs view
CREATE OR REPLACE VIEW recent_activity_logs AS
SELECT *
FROM activity_logs
ORDER BY "userId", timestamp DESC
LIMIT 100;

-- ============================================================================
-- STEP 7: POST-MIGRATION VERIFICATION
-- ============================================================================

DO $$
DECLARE
    id_type TEXT;
    dealid_type TEXT;
    original_count INTEGER;
    migrated_count INTEGER;
    sample_ids TEXT[];
BEGIN
    -- Verify id column is now TEXT
    SELECT data_type INTO id_type
    FROM information_schema.columns
    WHERE table_name = 'deal_calculations' AND column_name = 'id';
    
    IF id_type = 'text' THEN
        RAISE NOTICE '✓ SUCCESS: deal_calculations.id is now TEXT type';
    ELSE
        RAISE EXCEPTION '✗ FAILED: deal_calculations.id is still % type', id_type;
    END IF;
    
    -- Verify row count matches backup
    SELECT COUNT(*) INTO original_count FROM deal_calculations_backup_uuid_to_text;
    SELECT COUNT(*) INTO migrated_count FROM deal_calculations;
    
    IF original_count = migrated_count THEN
        RAISE NOTICE '✓ SUCCESS: All % rows preserved', migrated_count;
    ELSE
        RAISE EXCEPTION '✗ FAILED: Row count mismatch - original=%, migrated=%', original_count, migrated_count;
    END IF;
    
    -- Verify primary key exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'deal_calculations' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        RAISE NOTICE '✓ SUCCESS: Primary key constraint recreated';
    ELSE
        RAISE EXCEPTION '✗ FAILED: Primary key constraint missing';
    END IF;
    
    -- Verify indexes exist
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'deal_calculations' 
        AND indexname = 'idx_deal_calculations_user_id'
    ) THEN
        RAISE NOTICE '✓ SUCCESS: userId index recreated';
    ELSE
        RAISE WARNING '✗ WARNING: userId index missing';
    END IF;
    
    -- Show sample IDs to verify conversion
    SELECT ARRAY_AGG(id) INTO sample_ids
    FROM (SELECT id FROM deal_calculations LIMIT 3) AS sample;
    
    RAISE NOTICE 'Sample IDs after migration: %', sample_ids;
    
    -- Verify activity_logs.dealId if table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'activity_logs'
    ) THEN
        SELECT data_type INTO dealid_type
        FROM information_schema.columns
        WHERE table_name = 'activity_logs' AND column_name = 'dealId';
        
        IF dealid_type = 'text' THEN
            RAISE NOTICE '✓ SUCCESS: activity_logs.dealId is TEXT type';
        ELSE
            RAISE WARNING '✗ WARNING: activity_logs.dealId is % type', dealid_type;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- STEP 8: TEST INSERTIONS
-- ============================================================================

-- Test inserting a UUID format ID
DO $$
DECLARE
    test_uuid TEXT := '550e8400-e29b-41d4-a716-446655440000';
    test_legacy TEXT := 'deal_1756736387419_xqm3j7r99';
BEGIN
    -- Test UUID format insertion
    BEGIN
        INSERT INTO deal_calculations (
            id, 
            "dealDetails", 
            "sectionsData", 
            "totalsData", 
            "factorsData", 
            "scalesData"
        ) VALUES (
            test_uuid,
            '{"customerName": "Test UUID Customer"}'::jsonb,
            '[]'::jsonb,
            '{}'::jsonb,
            '{}'::jsonb,
            '{}'::jsonb
        );
        RAISE NOTICE '✓ SUCCESS: UUID format ID insertion works';
        
        -- Clean up test data
        DELETE FROM deal_calculations WHERE id = test_uuid;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '✗ FAILED: UUID format ID insertion failed - %', SQLERRM;
    END;
    
    -- Test legacy text format insertion
    BEGIN
        INSERT INTO deal_calculations (
            id, 
            "dealDetails", 
            "sectionsData", 
            "totalsData", 
            "factorsData", 
            "scalesData"
        ) VALUES (
            test_legacy,
            '{"customerName": "Test Legacy Customer"}'::jsonb,
            '[]'::jsonb,
            '{}'::jsonb,
            '{}'::jsonb,
            '{}'::jsonb
        );
        RAISE NOTICE '✓ SUCCESS: Legacy text format ID insertion works';
        
        -- Clean up test data
        DELETE FROM deal_calculations WHERE id = test_legacy;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '✗ FAILED: Legacy text format ID insertion failed - %', SQLERRM;
    END;
END $$;

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================

SELECT 
    'Deal ID Schema Migration Completed Successfully!' as status,
    'deal_calculations.id converted from UUID to TEXT' as change_1,
    'activity_logs.dealId converted to TEXT' as change_2,
    'All existing data preserved' as data_status,
    'Backup table: deal_calculations_backup_uuid_to_text' as backup_info,
    'Both UUID and text-based IDs now supported' as compatibility;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- 
-- If you need to rollback this migration, run the following commands:
-- 
-- WARNING: This will restore the table to UUID type and may lose any
--          text-based IDs that were added after the migration!
-- 
-- -- Step 1: Drop current table
-- DROP TABLE IF EXISTS deal_calculations CASCADE;
-- 
-- -- Step 2: Restore from backup
-- ALTER TABLE deal_calculations_backup_uuid_to_text 
-- RENAME TO deal_calculations;
-- 
-- -- Step 3: Recreate indexes
-- CREATE INDEX idx_deal_calculations_user_id ON deal_calculations("userId");
-- CREATE INDEX idx_deal_calculations_created_at ON deal_calculations("createdAt" DESC);
-- 
-- -- Step 4: Recreate the view
-- CREATE OR REPLACE VIEW recent_activity_logs AS
-- SELECT * FROM activity_logs
-- ORDER BY "userId", timestamp DESC
-- LIMIT 100;
-- 
-- -- Step 5: Verify restoration
-- SELECT COUNT(*) as restored_rows FROM deal_calculations;
-- 
-- ============================================================================
-- CLEANUP INSTRUCTIONS (Run after verifying migration success)
-- ============================================================================
-- 
-- After confirming the migration works correctly in production, you can
-- remove the backup table to free up space:
-- 
-- DROP TABLE IF EXISTS deal_calculations_backup_uuid_to_text;
-- 
-- ============================================================================
-- VERIFICATION QUERIES FOR MANUAL TESTING
-- ============================================================================
-- 
-- -- Check id column type
-- SELECT data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'deal_calculations' AND column_name = 'id';
-- 
-- -- Check activity_logs dealId type
-- SELECT data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'activity_logs' AND column_name = 'dealId';
-- 
-- -- View sample IDs
-- SELECT id, "dealName", "createdAt" 
-- FROM deal_calculations 
-- ORDER BY "createdAt" DESC 
-- LIMIT 10;
-- 
-- -- Count rows in original vs backup
-- SELECT 
--     (SELECT COUNT(*) FROM deal_calculations) as current_rows,
--     (SELECT COUNT(*) FROM deal_calculations_backup_uuid_to_text) as backup_rows;
-- 
-- -- Test inserting both ID formats
-- INSERT INTO deal_calculations (
--     id, "dealDetails", "sectionsData", "totalsData", 
--     "factorsData", "scalesData"
-- ) VALUES (
--     'deal_test_123_abc',  -- Legacy format
--     '{"customerName": "Test"}'::jsonb,
--     '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb
-- );
-- 
-- INSERT INTO deal_calculations (
--     id, "dealDetails", "sectionsData", "totalsData", 
--     "factorsData", "scalesData"
-- ) VALUES (
--     '550e8400-e29b-41d4-a716-446655440000',  -- UUID format
--     '{"customerName": "Test UUID"}'::jsonb,
--     '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb
-- );
-- 
-- -- Clean up test data
-- DELETE FROM deal_calculations WHERE id IN ('deal_test_123_abc', '550e8400-e29b-41d4-a716-446655440000');
-- 
-- ============================================================================
