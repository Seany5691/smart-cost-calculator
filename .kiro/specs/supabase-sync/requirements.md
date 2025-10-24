# Requirements Document

## Introduction

This specification covers the migration of user activity logs and saved deals from browser localStorage to Supabase database. The primary goal is to enable cross-device access to activity history and saved deals, ensuring users can view their data from any device or browser. This migration must be implemented without breaking any existing functionality, maintaining backward compatibility during the transition period.

## Requirements

### Requirement 1: Activity Logs Supabase Integration

**User Story:** As a user, I want my activity timeline to be stored in Supabase instead of localStorage, so that I can see my activity history from any device or browser.

#### Acceptance Criteria

1. WHEN a user performs any action (deal created, deal saved, proposal generated, PDF generated, deal loaded) THEN the system SHALL save the activity log to the Supabase `activity_logs` table
2. WHEN a user views the Recent Activity section THEN the system SHALL retrieve activity logs from Supabase instead of localStorage
3. WHEN an admin views the Recent Activity section with user filter THEN the system SHALL retrieve filtered activity logs from Supabase based on the selected user
4. IF the Supabase save operation fails THEN the system SHALL fall back to localStorage and log a warning without blocking the user action
5. WHEN activity logs are retrieved from Supabase THEN the system SHALL display them in reverse chronological order (most recent first)
6. WHEN the system initializes THEN the system SHALL migrate any existing localStorage activity logs to Supabase as a one-time operation
7. IF a user has activity logs in both localStorage and Supabase THEN the system SHALL merge them and remove duplicates based on activity ID
8. WHEN activity logs are stored in Supabase THEN the system SHALL maintain the same data structure as the current localStorage implementation

### Requirement 2: Saved Deals Supabase Integration

**User Story:** As a user, I want my saved deals to be stored in Supabase instead of localStorage, so that I can access my deals from any device or browser.

#### Acceptance Criteria

1. WHEN a user saves a deal (new or update) THEN the system SHALL save the deal to the Supabase `deal_calculations` table
2. WHEN a user views their deals list (My Deals, All Deals, Admin Deals) THEN the system SHALL retrieve deals from Supabase instead of localStorage
3. WHEN a user loads an existing deal THEN the system SHALL retrieve the deal data from Supabase
4. WHEN a user deletes a deal THEN the system SHALL remove the deal from Supabase
5. IF the Supabase save operation fails THEN the system SHALL fall back to localStorage and display an error message to the user
6. WHEN the system initializes THEN the system SHALL migrate any existing localStorage deals to Supabase as a one-time operation
7. IF a user has deals in both localStorage and Supabase THEN the system SHALL merge them and remove duplicates based on deal ID
8. WHEN deals are stored in Supabase THEN the system SHALL maintain the same data structure as the current localStorage implementation
9. WHEN a deal is updated THEN the system SHALL preserve the original `createdAt` timestamp and update only the `updatedAt` timestamp
10. WHEN retrieving deals THEN the system SHALL filter deals based on user role (users see only their deals, admins see all deals)

### Requirement 3: Database Schema Updates

**User Story:** As a developer, I want the Supabase database schema to include tables for activity logs and deal calculations, so that the data can be properly stored and queried.

#### Acceptance Criteria

1. WHEN the database schema is updated THEN the system SHALL include an `activity_logs` table with columns for id, userId, username, userRole, activityType, dealId, dealName, timestamp, and metadata
2. WHEN the database schema is updated THEN the system SHALL ensure the existing `deal_calculations` table matches the current deal data structure
3. WHEN the `activity_logs` table is created THEN the system SHALL include indexes on userId, activityType, and timestamp for query performance
4. WHEN the `deal_calculations` table is queried THEN the system SHALL include indexes on userId and createdAt for query performance
5. WHEN Row Level Security is configured THEN the system SHALL allow users to access only their own data (except admins who can access all data)
6. IF the schema already exists THEN the system SHALL not duplicate tables or cause errors

### Requirement 4: Migration and Backward Compatibility

**User Story:** As a user with existing localStorage data, I want my data to be automatically migrated to Supabase, so that I don't lose any of my activity history or saved deals.

#### Acceptance Criteria

1. WHEN a user first accesses the application after the update THEN the system SHALL automatically migrate their localStorage activity logs to Supabase
2. WHEN a user first accesses the application after the update THEN the system SHALL automatically migrate their localStorage deals to Supabase
3. WHEN migration is complete THEN the system SHALL mark the migration as complete in localStorage to prevent duplicate migrations
4. IF migration fails for any reason THEN the system SHALL log the error and continue using localStorage without blocking the user
5. WHEN migration is in progress THEN the system SHALL display a loading indicator to the user
6. WHEN migration is complete THEN the system SHALL display a success message to the user
7. IF a user accesses the application from multiple devices THEN the system SHALL handle concurrent migrations gracefully without data loss
8. WHEN all data is successfully migrated THEN the system SHALL optionally clear the localStorage data (with user confirmation)

### Requirement 5: Error Handling and Resilience

**User Story:** As a user, I want the application to continue working even if Supabase is temporarily unavailable, so that I can continue my work without interruption.

#### Acceptance Criteria

1. IF Supabase is unavailable THEN the system SHALL fall back to localStorage for all operations
2. WHEN Supabase becomes available again THEN the system SHALL sync any localStorage changes to Supabase
3. IF a Supabase operation fails THEN the system SHALL log the error with sufficient detail for debugging
4. WHEN an error occurs THEN the system SHALL display a user-friendly error message without exposing technical details
5. IF network connectivity is lost THEN the system SHALL queue operations and retry when connectivity is restored
6. WHEN the system detects Supabase is unavailable THEN the system SHALL display a warning banner to the user
7. IF data conflicts occur during sync THEN the system SHALL use the most recent timestamp to resolve conflicts

### Requirement 6: Performance and Optimization

**User Story:** As a user, I want the application to load quickly and respond smoothly, so that the Supabase integration doesn't slow down my workflow.

#### Acceptance Criteria

1. WHEN retrieving activity logs THEN the system SHALL limit results to the most recent 100 entries per user
2. WHEN retrieving deals THEN the system SHALL use pagination if more than 50 deals exist
3. WHEN querying Supabase THEN the system SHALL use appropriate indexes to ensure fast query performance
4. IF a query takes longer than 3 seconds THEN the system SHALL display a loading indicator
5. WHEN the application initializes THEN the system SHALL cache frequently accessed data in memory
6. WHEN data is updated THEN the system SHALL invalidate the cache and refresh the data
7. IF the user is offline THEN the system SHALL use cached data and display a notification

### Requirement 7: Scraper Industries Supabase Integration

**User Story:** As a user, I want my custom scraper industries to be stored in Supabase instead of localStorage, so that I can access my industry list from any device or browser.

#### Acceptance Criteria

1. WHEN a user adds a custom industry THEN the system SHALL save the industry to the Supabase `scraper_industries` table
2. WHEN a user views the scraper page THEN the system SHALL retrieve industries from Supabase instead of localStorage
3. WHEN a user deletes a custom industry THEN the system SHALL remove the industry from Supabase
4. IF the Supabase save operation fails THEN the system SHALL fall back to localStorage and display a warning message
5. WHEN the system initializes THEN the system SHALL migrate any existing localStorage industries to Supabase as a one-time operation
6. IF a user has industries in both localStorage and Supabase THEN the system SHALL merge them and remove duplicates based on industry name
7. WHEN industries are stored in Supabase THEN the system SHALL maintain the same data structure as the current localStorage implementation

### Requirement 8: Scraper Saved Sessions Supabase Integration

**User Story:** As a user, I want my saved scraper sessions to be stored in Supabase instead of localStorage, so that I can access my saved configurations from any device or browser.

#### Acceptance Criteria

1. WHEN a user saves a scraper session configuration THEN the system SHALL save the session to the Supabase `scraper_saved_sessions` table
2. WHEN a user views saved sessions THEN the system SHALL retrieve sessions from Supabase instead of localStorage
3. WHEN a user loads a saved session THEN the system SHALL retrieve the session configuration from Supabase
4. WHEN a user deletes a saved session THEN the system SHALL remove the session from Supabase
5. IF the Supabase save operation fails THEN the system SHALL fall back to localStorage and display an error message
6. WHEN the system initializes THEN the system SHALL migrate any existing localStorage saved sessions to Supabase as a one-time operation
7. IF a user has saved sessions in both localStorage and Supabase THEN the system SHALL merge them and remove duplicates based on session name
8. WHEN saved sessions are stored in Supabase THEN the system SHALL maintain the same data structure as the current localStorage implementation

### Requirement 9: Testing and Validation

**User Story:** As a developer, I want comprehensive testing to ensure the Supabase integration works correctly, so that users don't experience data loss or corruption.

#### Acceptance Criteria

1. WHEN testing the migration THEN the system SHALL verify all localStorage data is correctly transferred to Supabase
2. WHEN testing activity logging THEN the system SHALL verify all activity types are correctly saved to Supabase
3. WHEN testing deal operations THEN the system SHALL verify create, read, update, and delete operations work correctly
4. WHEN testing scraper industries THEN the system SHALL verify add, retrieve, and delete operations work correctly
5. WHEN testing scraper saved sessions THEN the system SHALL verify save, load, and delete operations work correctly
6. WHEN testing error handling THEN the system SHALL verify fallback to localStorage works when Supabase is unavailable
7. WHEN testing concurrent access THEN the system SHALL verify no data loss occurs when multiple devices access the same account
8. WHEN testing role-based access THEN the system SHALL verify users can only access their own data and admins can access all data
9. WHEN testing performance THEN the system SHALL verify query response times are acceptable (< 1 second for typical operations)
