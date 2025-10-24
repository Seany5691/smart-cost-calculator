# Implementation Plan

- [x] 1. Update Supabase database schema
  - Create activity_logs table with proper indexes
  - Verify deal_calculations table structure
  - Add Row Level Security policies
  - Test schema with sample data
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. Enhance Supabase helper functions
  - [x] 2.1 Add activity log helper functions
    - Implement getActivityLogs() with user filtering
    - Implement createActivityLog() for inserting logs
    - Add error handling and fallback logic
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 2.2 Add deal calculation helper functions
    - Implement getDeals() with role-based filtering
    - Implement getDealById() for single deal retrieval
    - Implement createDeal() for new deals
    - Implement updateDeal() for existing deals
    - Implement deleteDeal() for removing deals
    - Add error handling and fallback logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.10_

- [x] 3. Update activity logger service
  - [x] 3.1 Add Supabase integration functions
    - Create logActivityToSupabase() function
    - Create getActivityLogsFromSupabase() function
    - Preserve existing localStorage functions as fallback
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 3.2 Implement activity logs migration
    - Create migrateActivityLogsToSupabase() function
    - Add migration status tracking in localStorage
    - Handle duplicate prevention with upsert
    - Add error handling for failed migrations
    - _Requirements: 4.1, 4.3, 4.4, 4.7_
  
  - [x] 3.3 Update main logActivity() function
    - Switch primary storage to Supabase
    - Keep localStorage as fallback
    - Maintain same function signature for compatibility
    - _Requirements: 1.1, 1.8, 5.1, 5.2_

- [x] 4. Update calculator store for deals
  - [x] 4.1 Update saveDeal() method
    - Add Supabase save logic for new deals
    - Add Supabase update logic for existing deals
    - Preserve localStorage fallback
    - Update activity logging to use Supabase
    - Maintain currentDealId tracking
    - _Requirements: 2.1, 2.8, 2.9, 5.1_
  
  - [x] 4.2 Update loadDeal() method
    - Fetch deal from Supabase instead of localStorage
    - Add fallback to localStorage on error
    - Update activity logging to use Supabase
    - Maintain originalUserContext tracking
    - _Requirements: 2.2, 2.3, 5.1_
  
  - [x] 4.3 Implement deals migration
    - Create migrateDealsToSupabase() function
    - Transform localStorage deal structure to Supabase schema
    - Add migration status tracking
    - Handle duplicate prevention with upsert
    - Preserve createdAt and updatedAt timestamps
    - _Requirements: 4.2, 4.3, 4.7, 2.9_
  
  - [x] 4.4 Add migration to store initialization
    - Call migration on store init
    - Handle migration errors gracefully
    - Don't block user if migration fails
    - _Requirements: 4.1, 4.2, 4.4_

- [x] 5. Update deals pages
  - [x] 5.1 Update My Deals page
    - Replace localStorage fetch with Supabase query
    - Update delete operation to use Supabase
    - Add loading states
    - Add error handling with user-friendly messages
    - _Requirements: 2.2, 2.4, 5.4, 6.4_
  
  - [x] 5.2 Update All Deals page
    - Replace localStorage fetch with Supabase query
    - Update delete operation to use Supabase
    - Add loading states
    - Add error handling with user-friendly messages
    - _Requirements: 2.2, 2.4, 5.4, 6.4_
  
  - [x] 5.3 Update Admin Deals page
    - Replace localStorage fetch with Supabase query
    - Update delete operation to use Supabase
    - Ensure admin can see all users' deals
    - Add loading states
    - Add error handling with user-friendly messages
    - _Requirements: 2.2, 2.4, 2.10, 5.4, 6.4_

- [x] 6. Update dashboard activity timeline



  - [x] 6.1 Update activity timeline component
    - Replace localStorage fetch with Supabase query
    - Maintain user filtering for admin view
    - Add loading states
    - Add error handling with fallback to localStorage
    - _Requirements: 1.2, 1.3, 1.5, 5.4, 6.4_
  
  - [x] 6.2 Update dashboard statistics


    - Fetch deal counts from Supabase
    - Update getTotalDeals() to use Supabase
    - Update getActiveProjects() to use Supabase
    - Add caching for performance
    - _Requirements: 2.2, 6.1, 6.5_

- [ ] 7. Update scraper industries integration
  - [ ] 7.1 Add Supabase helper functions for industries
    - Implement getIndustries() to fetch from Supabase
    - Implement createIndustry() to add new industry
    - Implement deleteIndustry() to remove industry
    - Add error handling and fallback to localStorage
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 7.2 Implement industries migration
    - Create migrateIndustriesToSupabase() function
    - Add migration status tracking
    - Handle duplicate prevention with upsert
    - Add error handling for failed migrations
    - _Requirements: 7.5, 7.6_
  
  - [ ] 7.3 Update scraper page to use Supabase for industries
    - Replace localStorage fetch with Supabase query
    - Update add industry to use Supabase
    - Update delete industry to use Supabase
    - Maintain same UI and functionality
    - _Requirements: 7.1, 7.2, 7.3, 7.7_

- [ ] 8. Update scraper saved sessions integration
  - [ ] 8.1 Add Supabase helper functions for saved sessions
    - Implement getSavedSessions() to fetch user's sessions
    - Implement createSavedSession() to save configuration
    - Implement deleteSavedSession() to remove session
    - Add error handling and fallback to localStorage
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 8.2 Implement saved sessions migration
    - Create migrateSavedSessionsToSupabase() function
    - Add migration status tracking
    - Handle duplicate prevention
    - Add error handling for failed migrations
    - _Requirements: 8.6, 8.7_
  
  - [ ] 8.3 Update scraper page to use Supabase for saved sessions
    - Replace localStorage fetch with Supabase query
    - Update save session to use Supabase
    - Update load session to use Supabase
    - Update delete session to use Supabase
    - Maintain same UI and functionality
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.8_
