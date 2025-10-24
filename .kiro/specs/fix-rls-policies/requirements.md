# Requirements Document

## Introduction

The Smart Cost Calculator application is experiencing Row-Level Security (RLS) policy violations when attempting to save deal calculations to Supabase. Despite having "permissive" policies defined in the schema that should allow all operations, the database is rejecting INSERT operations with error code 42501. This feature will diagnose and fix the RLS configuration to enable proper data persistence while maintaining appropriate security controls.

## Glossary

- **RLS (Row-Level Security)**: PostgreSQL feature that restricts which rows users can access in database tables based on policies
- **Supabase**: Backend-as-a-Service platform built on PostgreSQL that enforces RLS by default
- **Deal Calculations Table**: Database table storing completed deal calculations with customer and pricing information
- **Anonymous Access**: Unauthenticated database access using Supabase's anon key
- **Service Role**: Supabase's privileged access role that bypasses RLS policies

## Requirements

### Requirement 1

**User Story:** As a user of the Smart Cost Calculator, I want to save my deal calculations to the database, so that I can retrieve and reference them later.

#### Acceptance Criteria

1. WHEN a user submits a deal calculation, THE Smart Cost Calculator SHALL successfully insert the record into the deal_calculations table
2. WHEN the insert operation completes, THE Smart Cost Calculator SHALL return the created deal record with its generated UUID
3. IF an RLS policy violation occurs, THEN THE Smart Cost Calculator SHALL log detailed error information including the policy name and violation reason
4. THE Smart Cost Calculator SHALL support both authenticated and anonymous user access patterns for deal creation

### Requirement 2

**User Story:** As a developer, I want clear RLS policies that match the application's authentication model, so that the database security is properly configured.

#### Acceptance Criteria

1. THE Supabase Database SHALL have RLS policies that explicitly allow INSERT operations on the deal_calculations table
2. THE RLS policies SHALL match the current authentication implementation in the application code
3. WHEN reviewing the policies, THE Database Administrator SHALL be able to understand which access patterns are permitted
4. THE RLS policies SHALL be tested and verified to work with the application's current Supabase client configuration

### Requirement 3

**User Story:** As a system administrator, I want to understand whether the application uses authenticated or anonymous access, so that I can configure appropriate security policies.

#### Acceptance Criteria

1. THE Development Team SHALL document whether the application uses Supabase authentication or anonymous access
2. THE Development Team SHALL identify which Supabase API key (anon or service_role) is being used in the application
3. IF the application uses anonymous access, THEN THE RLS policies SHALL be configured to permit operations from the anon role
4. IF the application uses service_role access, THEN THE Development Team SHALL document the security implications

### Requirement 4

**User Story:** As a developer, I want to verify that RLS policies work correctly, so that I can confirm the fix resolves the issue.

#### Acceptance Criteria

1. THE Development Team SHALL create a test script that attempts to insert a record into deal_calculations
2. WHEN the test script executes, THE Database SHALL accept the insert operation without RLS violations
3. THE Development Team SHALL verify the fix using the actual application interface
4. WHEN a user clicks "Save Deal" in the calculator, THE Application SHALL successfully save the deal without falling back to localStorage
