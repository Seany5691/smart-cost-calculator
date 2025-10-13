# Requirements Document

## Introduction

This feature enhances the admin panel and pricing system to provide better user experience, consistent role-based pricing across all components, improved deal management, and enhanced admin visibility into cost structures. The system currently has partial role-based pricing implementation that needs to be completed and several UX issues that need resolution.

## Requirements

### Requirement 1: Admin Panel UX Improvements

**User Story:** As an admin, I want to be able to make multiple pricing changes efficiently without losing my work, so that I can update configurations quickly and accurately.

#### Acceptance Criteria

1. WHEN an admin changes multiple prices in the admin console THEN the system SHALL allow saving all changes at once without requiring individual item saves
2. WHEN an admin changes prices and the page refreshes THEN the system SHALL preserve unsaved changes or provide clear warning before losing data
3. WHEN an admin updates connectivity pricing in the admin console THEN the system SHALL immediately reflect these changes in the calculator interface
4. WHEN connectivity pricing shows as 0 in the calculator THEN the system SHALL display the correct role-based pricing from the admin configuration
5. WHEN an admin makes changes to any configuration THEN the system SHALL provide visual indicators for unsaved changes
6. WHEN an admin saves configuration changes THEN the system SHALL provide immediate feedback and refresh the calculator data

### Requirement 2: Complete Role-Based Pricing System

**User Story:** As a system administrator, I want all pricing components (hardware, connectivity, licensing, scales, and factors) to have consistent manager and user pricing tiers, so that different user roles see appropriate pricing throughout the application.

#### Acceptance Criteria

1. WHEN configuring scales in the admin panel THEN the system SHALL provide manager pricing and user pricing fields for all scale categories
2. WHEN configuring factors in the admin panel THEN the system SHALL provide manager factors and user factors for all factor combinations in the factor sheet
3. WHEN a manager logs into the calculator THEN the system SHALL display manager pricing for scales and factors
4. WHEN a regular user logs into the calculator THEN the system SHALL display user pricing for scales and factors
5. WHEN an admin logs into the calculator THEN the system SHALL display manager pricing for scales and factors
6. WHEN connectivity or licensing pricing is updated THEN the system SHALL correctly apply role-based pricing in the calculator

### Requirement 3: Enhanced Temporary Item Management in Calculator

**User Story:** As a user working in the calculator, I want to add temporary items with full control over their properties and proposal visibility, so that I can customize deals without affecting the base configuration and control what appears in generated proposals.

#### Acceptance Criteria

1. WHEN adding a temporary hardware item in the calculator THEN the system SHALL provide a checkbox to mark it as an extension with appropriate default value
2. WHEN adding any temporary item (hardware, connectivity, or licensing) in the calculator THEN the system SHALL provide a "Show on Proposal" checkbox defaulted to checked
3. WHEN a temporary item is marked as "Show on Proposal = false" THEN the system SHALL exclude it from generated proposals
4. WHEN a temporary item is marked as an extension THEN the system SHALL include it in extension count calculations
5. WHEN generating a proposal THEN the system SHALL only include items where "Show on Proposal" is true
6. WHEN starting a new deal calculation THEN the system SHALL clear all temporary items from the previous calculation
7. WHEN adding temporary items THEN the system SHALL apply role-based pricing appropriate to the current user

### Requirement 4: Comprehensive Deal Management System

**User Story:** As an admin, I want to see all saved deals from all users with cost pricing visibility, so that I can analyze deal profitability and provide accurate cost information for business decisions.

#### Acceptance Criteria

1. WHEN any user saves a deal THEN the system SHALL automatically save it to a centralized admin-accessible location
2. WHEN a user generates a proposal from a deal THEN the system SHALL automatically trigger saving of that deal
3. WHEN an admin views saved deals THEN the system SHALL display all deals from all users in the system
4. WHEN an admin opens a saved deal THEN the system SHALL display all pricing at cost price levels (not manager or user pricing)
5. WHEN a manager views saved deals THEN the system SHALL only display their own deals at manager pricing
6. WHEN a regular user views saved deals THEN the system SHALL only display their own deals at user pricing
7. WHEN an admin generates a PDF from a saved deal THEN the system SHALL use cost pricing for all calculations and display

### Requirement 5: Role-Based Deal Visibility and Pricing

**User Story:** As a user with different roles, I want to see only my relevant deals at my appropriate pricing level, so that I have access to the right information for my role without seeing unauthorized data.

#### Acceptance Criteria

1. WHEN a user accesses saved deals THEN the system SHALL filter deals based on user role and ownership
2. WHEN displaying deal pricing THEN the system SHALL use role-appropriate pricing (cost for admin, manager for managers, user for users)
3. WHEN a deal is saved THEN the system SHALL store the original user context and pricing information
4. WHEN an admin views any deal THEN the system SHALL override stored pricing with current cost pricing
5. WHEN generating reports or PDFs THEN the system SHALL use pricing appropriate to the current user's role and permissions