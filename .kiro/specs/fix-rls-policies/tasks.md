# Implementation Plan

- [x] 1. Create SAFE RLS policy migration script






  - Create SQL migration file that ONLY modifies policies (no table structure changes)
  - Use DROP POLICY IF EXISTS to safely remove old policies
  - Create new role-based policies for anon and authenticated roles
  - Include policies for all tables: users, hardware_items, connectivity_items, licensing_items, factors, scales, deal_calculations
  - Add BEGIN/COMMIT transaction wrapper for atomic execution
  - Add rollback script as a separate file for safety
  - Include verification queries at the end to confirm policies exist
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 2. Create rollback script
  - Write SQL script that can restore original policies if needed
  - Mirror the structure of the original schema policies
  - Test that rollback script is valid SQL
  - _Requirements: 2.1, 2.2_

- [ ] 3. Create pre-migration verification script
  - Write SQL script to check current state of tables and data
  - Count rows in each table to establish baseline
  - List current policies on each table
  - Save output for comparison after migration
  - _Requirements: 4.1, 4.2_

- [ ] 4. Create RLS policy test script
  - Write SQL test script that switches to anon role and tests all CRUD operations
  - Test INSERT, SELECT, UPDATE, DELETE on deal_calculations table
  - Include test data that can be easily cleaned up
  - Add verification queries to confirm operations succeeded
  - _Requirements: 4.1, 4.2_

- [ ] 5. Create application-level test utility
  - Write TypeScript test file that uses Supabase client to test RLS policies
  - Test deal creation through the actual supabase.ts helper functions
  - Include cleanup logic to remove test data
  - Add clear success/failure logging
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 6. Document safe migration execution steps
  - Create step-by-step guide emphasizing safety measures
  - Include pre-migration checklist (backup verification, row counts)
  - Document how to run pre-migration verification
  - Provide clear instructions for Supabase SQL Editor execution
  - Include post-migration verification steps
  - Document rollback procedure if issues occur
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Enhance error logging in supabase.ts
  - Update createDeal function to log detailed RLS error information
  - Add structured error logging with code, message, details, and hint
  - Ensure errors are distinguishable from other types of failures
  - _Requirements: 1.3_

- [ ] 8. Execute safe migration with verification
  - Run pre-migration verification script and save results
  - Execute migration script in Supabase SQL Editor (within transaction)
  - Verify transaction commits successfully
  - Run post-migration verification to compare row counts
  - Execute SQL test script to verify policies work at database level
  - Run application test utility to verify client-side operations
  - Test actual application by saving a deal through the UI
  - Confirm no RLS errors appear in browser console
  - Verify deal is saved to Supabase (not localStorage fallback)
  - If any issues occur, execute rollback script immediately
  - _Requirements: 1.1, 1.2, 4.3, 4.4_
