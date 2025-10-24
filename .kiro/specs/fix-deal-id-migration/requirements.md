# Requirements Document

## Introduction

This specification addresses a critical bug in the Supabase migration where existing deals with text-based IDs (e.g., `deal_1756736387419_xqm3j7r99`) cannot be migrated to Supabase because the database schema expects UUID format. This causes the migration to fail with error: `invalid input syntax for type uuid`. The fix must preserve existing deal IDs while ensuring compatibility with the Supabase schema.

## Glossary

- **Deal ID**: A unique identifier for a saved deal calculation
- **UUID**: Universally Unique Identifier, a 128-bit standardized format (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- **Text ID**: Legacy string-based identifier format (e.g., `deal_1756736387419_xqm3j7r99`)
- **Migration**: The process of transferring data from localStorage to Supabase
- **Supabase**: PostgreSQL database service used for cloud storage
- **deal_calculations Table**: Supabase table storing deal data

## Requirements

### Requirement 1: Fix Database Schema for Deal IDs

**User Story:** As a developer, I want the deal_calculations table to accept both UUID and text-based IDs, so that existing deals can be migrated without errors.

#### Acceptance Criteria

1. WHEN the database schema is updated THEN the deal_calculations table SHALL use TEXT type for the id column instead of UUID
2. WHEN a deal is inserted with a text-based ID THEN the system SHALL accept and store the ID without errors
3. WHEN a deal is inserted with a UUID format ID THEN the system SHALL accept and store the ID without errors
4. WHEN the schema is updated THEN the system SHALL preserve all existing data in the table
5. IF the id column is currently UUID type THEN the system SHALL convert it to TEXT type safely

### Requirement 2: Update Deal ID Generation

**User Story:** As a developer, I want new deals to use proper UUID format, so that we follow best practices while maintaining backward compatibility.

#### Acceptance Criteria

1. WHEN a new deal is created THEN the system SHALL generate a UUID format ID
2. WHEN an existing deal with text-based ID is loaded THEN the system SHALL preserve the original text-based ID
3. WHEN an existing deal is updated THEN the system SHALL maintain the original ID format (text or UUID)
4. WHEN the system generates a UUID THEN the system SHALL use the crypto.randomUUID() method or equivalent
5. IF crypto.randomUUID() is not available THEN the system SHALL use a fallback UUID generation method

### Requirement 3: Fix Migration Logic

**User Story:** As a user with existing deals, I want my localStorage deals to be migrated to Supabase successfully, so that I can access them from any device.

#### Acceptance Criteria

1. WHEN the migration runs THEN the system SHALL successfully migrate deals with text-based IDs to Supabase
2. WHEN the migration runs THEN the system SHALL successfully migrate deals with UUID format IDs to Supabase
3. WHEN a deal already exists in Supabase THEN the system SHALL update it instead of creating a duplicate
4. WHEN a deal migration fails THEN the system SHALL log the error and continue with remaining deals
5. WHEN all deals are migrated THEN the system SHALL mark the migration as complete
6. IF a deal has an invalid ID format THEN the system SHALL generate a new UUID and log a warning

### Requirement 4: Update Activity Logs Schema

**User Story:** As a developer, I want the activity_logs table to use TEXT for dealId, so that it can reference both old and new deal IDs.

#### Acceptance Criteria

1. WHEN the database schema is updated THEN the activity_logs table SHALL use TEXT type for the dealId column
2. WHEN an activity log references a text-based deal ID THEN the system SHALL store it without errors
3. WHEN an activity log references a UUID format deal ID THEN the system SHALL store it without errors
4. WHEN the schema is updated THEN the system SHALL preserve all existing activity log data

### Requirement 5: Backward Compatibility

**User Story:** As a user, I want the application to continue working with my existing deals, so that I don't lose any data during the migration.

#### Acceptance Criteria

1. WHEN a user has deals with text-based IDs THEN the system SHALL load and display them correctly
2. WHEN a user updates an old deal with text-based ID THEN the system SHALL save it successfully to Supabase
3. WHEN a user creates a new deal THEN the system SHALL use UUID format for the ID
4. WHEN a user deletes a deal with text-based ID THEN the system SHALL remove it from Supabase successfully
5. WHEN the migration is complete THEN the system SHALL not break any existing functionality

### Requirement 6: Error Handling and Recovery

**User Story:** As a user, I want clear error messages if something goes wrong, so that I understand what happened and can take action.

#### Acceptance Criteria

1. IF the migration fails THEN the system SHALL display a user-friendly error message
2. WHEN a deal fails to migrate THEN the system SHALL log the specific error details for debugging
3. IF Supabase is unavailable during migration THEN the system SHALL fall back to localStorage and retry later
4. WHEN an error occurs THEN the system SHALL not block the user from using the application
5. IF the migration is incomplete THEN the system SHALL allow the user to retry the migration manually

### Requirement 7: Testing and Validation

**User Story:** As a developer, I want to verify the fix works correctly, so that users don't experience data loss or errors.

#### Acceptance Criteria

1. WHEN testing with text-based deal IDs THEN the system SHALL migrate them successfully to Supabase
2. WHEN testing with UUID format deal IDs THEN the system SHALL migrate them successfully to Supabase
3. WHEN testing with mixed ID formats THEN the system SHALL handle both types correctly
4. WHEN testing deal operations (create, read, update, delete) THEN the system SHALL work with both ID formats
5. WHEN testing activity logs THEN the system SHALL correctly reference deals with both ID formats
