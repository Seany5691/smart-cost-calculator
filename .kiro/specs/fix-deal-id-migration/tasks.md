# Implementation Plan

- [x] 1. Create database schema migration script





  - Write SQL script to convert deal_calculations.id from UUID to TEXT
  - Add safe migration with data preservation
  - Update activity_logs.dealId to TEXT type
  - Include rollback instructions
  - Add verification queries
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4_

- [ ] 2. Execute database schema migration on Supabase
  - Backup existing deal_calculations table
  - Run schema migration script
  - Verify id column is TEXT type
  - Verify all existing data preserved
  - Test inserting both UUID and text-based IDs
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Create ID generator utility module




  - [x] 3.1 Implement UUID generation function


    - Create generateDealId() using crypto.randomUUID()
    - Add fallback for environments without crypto API
    - _Requirements: 2.1, 2.4, 2.5_
  
  - [x] 3.2 Implement ID validation functions


    - Create isValidUUID() to check UUID format
    - Create isValidLegacyDealId() to check legacy format
    - Create isValidDealId() to accept both formats
    - Create getDealIdType() to identify format type
    - _Requirements: 2.2, 2.3, 3.6_
  
  - [ ]* 3.3 Write unit tests for ID utilities
    - Test UUID generation produces valid UUIDs
    - Test UUID validation with valid and invalid inputs
    - Test legacy ID validation with various formats
    - Test combined validation function
    - Test ID type detection
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 4. Update calculator store saveDeal() method




  - [x] 4.1 Update deal ID generation for new deals


    - Import and use generateDealId() for new deals
    - Preserve existing currentDealId for updates
    - Remove old timestamp-based ID generation
    - _Requirements: 2.1, 2.3_
  
  - [x] 4.2 Update deal creation logic


    - Use new UUID format for deal.id
    - Set createdAt timestamp for new deals
    - Ensure all required fields are included
    - _Requirements: 2.1, 5.3_
  
  - [x] 4.3 Update deal update logic


    - Preserve original deal ID (text or UUID)
    - Update only updatedAt timestamp
    - Maintain backward compatibility
    - _Requirements: 2.2, 2.3, 5.2_

- [ ] 5. Update calculator store migration logic
  - [ ] 5.1 Update migrateDealsToSupabase() function
    - Change migration key to 'deals-migrated-v2' to force re-migration
    - Add ID validation for each deal
    - Generate new UUID for invalid IDs with warning
    - Preserve original IDs for valid formats
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 5.1_
  
  - [ ] 5.2 Implement improved error handling
    - Track success and failure counts
    - Log detailed error information for each failure
    - Continue migration even if individual deals fail
    - Show user-friendly success/failure messages
    - _Requirements: 3.4, 3.5, 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 5.3 Add upsert logic for duplicate handling
    - Check if deal exists before insert
    - Update existing deals instead of creating duplicates
    - Preserve original createdAt for existing deals
    - _Requirements: 3.3, 5.2_
  
  - [ ] 5.4 Add migration progress feedback
    - Log migration start with deal count
    - Log each successful migration
    - Log migration completion with statistics
    - Display toast notifications for user feedback
    - _Requirements: 6.1, 6.5_

- [ ] 6. Test migration with legacy deal IDs
  - [ ] 6.1 Create test localStorage data
    - Add deals with text-based IDs to localStorage
    - Add deals with UUID format IDs to localStorage
    - Add deals with mixed ID formats
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 6.2 Run migration and verify results
    - Trigger migration by loading application
    - Verify all deals appear in Supabase
    - Verify original IDs are preserved
    - Verify no console errors
    - Check migration success messages
    - _Requirements: 3.1, 3.2, 5.1_
  
  - [ ] 6.3 Test deal operations with migrated data
    - Load legacy deal and verify data integrity
    - Update legacy deal and verify ID preserved
    - Delete legacy deal and verify removal
    - Create new deal and verify UUID format used
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.4_

- [ ] 7. Verify activity logs compatibility
  - Test activity logs with text-based deal IDs
  - Test activity logs with UUID format deal IDs
  - Verify dealId references work correctly
  - Verify no errors in activity timeline display
  - _Requirements: 4.1, 4.2, 4.3, 7.5_

- [ ]* 8. Update documentation
  - Document ID format change in migration notes
  - Add troubleshooting guide for migration errors
  - Update developer documentation with new ID utilities
  - Document rollback procedure
  - _Requirements: 6.5_

- [ ]* 9. Performance and load testing
  - Test migration with large number of deals (100+)
  - Verify query performance with TEXT id column
  - Check database indexes are still effective
  - Monitor migration time and resource usage
  - _Requirements: 7.1, 7.2, 7.3_
