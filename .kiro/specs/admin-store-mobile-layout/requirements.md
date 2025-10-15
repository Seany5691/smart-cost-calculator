# Requirements Document

## Introduction

The admin configuration pages (HardwareConfig, ConnectivityConfig, LicensingConfig) currently use wide table layouts with 8+ columns that require horizontal scrolling on mobile devices, making it difficult to view and edit configuration data. This creates a poor user experience on mobile. The calculator store sections (HardwareSection, ConnectivitySection, LicensingSection) have been successfully updated with a mobile-friendly card layout using a responsive dual-layout system: desktop shows tables, mobile shows cards with no horizontal scrolling. The admin configuration pages need the same responsive treatment to provide a consistent, mobile-optimized experience across the application.

## Requirements

### Requirement 1: Eliminate Horizontal Scrolling on Mobile

**User Story:** As an admin user on a mobile device, I want to view all configuration data without horizontal scrolling, so that I can easily manage hardware, connectivity, and licensing settings.

#### Acceptance Criteria

1. WHEN viewing admin config pages on a mobile device (viewport width < 768px) THEN the system SHALL display items in a card-based layout without requiring horizontal scrolling
2. WHEN viewing item information THEN the system SHALL display all relevant data (name, cost price, manager cost, user cost, extension status, locked status) within the viewport width
3. WHEN interacting with admin config on mobile THEN the system SHALL NOT require horizontal scrolling to access edit/delete buttons
4. IF the viewport is desktop-sized (>= 768px) THEN the system SHALL maintain the existing table layout for optimal desktop viewing
5. WHEN viewing on tablet (768px-1024px) THEN the system SHALL use the table layout with responsive column sizing

### Requirement 2: Implement Card-Based Layout for Mobile

**User Story:** As an admin user on mobile, I want to see configuration items in organized cards with clear sections for pricing and settings, so that I can quickly understand and edit each item.

#### Acceptance Criteria

1. WHEN viewing an item card on mobile THEN the system SHALL display the item name prominently at the top
2. WHEN displaying pricing information THEN the system SHALL show Cost Price, Manager Cost, and User Cost in a clear grid layout
3. WHEN showing item settings THEN the system SHALL display Extension status and Locked status with clear visual indicators (badges)
4. WHEN displaying pricing information THEN the system SHALL format currency values consistently (e.g., R1,234.56)
5. WHEN showing action buttons THEN the system SHALL display Edit and Delete buttons in a touch-friendly layout at the bottom of each card
6. IF an item is being edited THEN the system SHALL show inline input fields within the card with Save/Cancel buttons

### Requirement 3: Maintain Touch-Optimized Interactions

**User Story:** As an admin user on mobile, I want larger, touch-friendly buttons and controls, so that I can easily interact with the admin store without mis-taps.

#### Acceptance Criteria

1. WHEN displaying action buttons (edit, delete, add) THEN the system SHALL ensure minimum touch target size of 44x44px
2. WHEN showing interactive elements THEN the system SHALL provide adequate spacing between touch targets to prevent accidental taps
3. WHEN a user taps a button THEN the system SHALL provide immediate visual feedback (e.g., color change, scale effect)
4. IF there are multiple actions available THEN the system SHALL organize them in a touch-friendly layout with clear visual separation

### Requirement 4: Preserve Visual Design Consistency

**User Story:** As an admin user, I want the admin config mobile layout to match the calculator store's design aesthetic, so that the application feels cohesive and professional.

#### Acceptance Criteria

1. WHEN viewing admin config on mobile THEN the system SHALL use similar card styling as the calculator store sections (white/60 background, rounded corners, shadows)
2. WHEN displaying item cards THEN the system SHALL use consistent spacing, padding, and typography with the calculator store
3. WHEN showing pricing grids THEN the system SHALL use similar visual treatment (borders, backgrounds, text styles) as the calculator sections
4. WHEN displaying badges (Extension, Locked) THEN the system SHALL use consistent badge styling with appropriate colors
5. IF the calculator store design is updated THEN the admin config SHALL maintain visual consistency with those changes

### Requirement 5: Maintain All Existing Functionality

**User Story:** As an admin user, I want all existing admin configuration features to work correctly on the new mobile layout, so that I don't lose any functionality.

#### Acceptance Criteria

1. WHEN using the mobile layout THEN the system SHALL preserve all CRUD operations (Create, Read, Update, Delete)
2. WHEN editing an item THEN the system SHALL provide the same editing capabilities as the desktop version (inline editing)
3. WHEN reordering items THEN the system SHALL maintain the up/down arrow functionality in the mobile layout
4. WHEN applying markup percentages THEN the system SHALL maintain the markup controls and "Apply to All" functionality
5. WHEN saving changes THEN the system SHALL maintain the batch save functionality with unsaved changes tracking
6. IF there are validation errors THEN the system SHALL display them clearly in the mobile layout
