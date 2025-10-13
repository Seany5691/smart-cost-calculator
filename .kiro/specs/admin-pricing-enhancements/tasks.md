# Implementation Plan

- [x] 1. Fix connectivity pricing issue in calculator
  - [x] Debug why connectivity pricing shows as 0 in calculator despite having role-based pricing structure
  - [x] Verify getItemCost function is being called correctly for connectivity items
  - [x] Test role-based pricing for connectivity items in calculator
  - _Requirements: 1.3, 1.4_

- [x] 2. Enhance type definitions for role-based scales and factors
  - [x] Update Scales interface to support cost/managerCost/userCost structure for all scale categories
  - [x] Update FactorData interface to support cost/managerFactors/userFactors structure
  - [x] Create migration utilities to convert existing single-tier data to three-tier structure
  - [x] Update Item interface to support showOnProposal and isTemporary properties
  - [x] Update admin FactorSheetConfig component with three-tier tabbed interface
  - [x] Update admin ScalesConfig component with three-tier tabbed interface
  - [x] Update calculator sections to support temporary items with showOnProposal and isExtension properties
  - _Requirements: 2.1, 2.2_

- [x] 3. Implement enhanced ScalesConfig component with three-tier pricing
  - [x] Modify ScalesConfig to display three-tier tabbed interface: Cost, Manager Cost, User Cost
  - [x] Implement automatic migration from legacy single-tier data
  - [x] Add visual indicators for different pricing tiers
  - [x] Fix save functionality to persist all three pricing tiers correctly
  - [x] Add batch save functionality to save all scale changes at once





  - [x] Implement visual indicators for unsaved changes



  - _Requirements: 2.1, 1.1, 1.5_

- [x] 4. Implement enhanced FactorSheetConfig component with three-tier factors
  - [x] Create tabbed interface for Cost Factors, Manager Factors, User Factors
  - [x] Maintain existing decimal precision (5-6 decimal places) for factor values
  - [x] Implement automatic migration from legacy single-tier data
  - [x] Add bulk operations to copy factors between tiers with multipliers
  - [x] Fix save functionality to persist all three factor tiers correctly
  - [ ] Implement batch save functionality for all factor changes
  - _Requirements: 2.2, 1.1, 1.5_

- [x] 5. Enhance temporary item management in calculator sections
  - [x] Add isExtension checkbox for hardware temporary items with appropriate default
  - [x] Add showOnProposal checkbox for all temporary items (hardware, connectivity, licensing) defaulted to true
  - [x] Update temporary item creation to include isTemporary property
  - [x] Add visual indicators for temporary items and proposal visibility in calculator tables
  - [x] This function does already work, but Ensure temporary items are cleared when starting new deal calculations





  - _Requirements: 3.1, 3.2, 3.6, 3.7_

- [x] 5.1. Fix admin configuration save functionality


  - [x] Update store to handle both legacy and enhanced data formats for factors and scales
  - [x] Fix FactorSheetConfig to save complete EnhancedFactorData structure instead of just cost factors
  - [x] Fix ScalesConfig to save complete EnhancedScales structure instead of just cost scales
  - [x] Update API endpoints to handle both legacy and enhanced data formats
  - [x] Implement save protection to prevent periodic sync from overriding recent saves
  - [x] Ensure manager and user pricing changes persist correctly after save
  - _Requirements: 1.1, 2.1, 2.2_



- [ ] 6. Update pricing engine to support enhanced scales and factors

  - Modify getFactorForDeal function to accept user role and use appropriate factor tier
  - Create getScaleValue function to retrieve role-based scale values
  - Update calculateTotalCosts to use role-based scales and factors
  - Ensure admin users see cost pricing, managers see manager pricing, users see user pricing
  - _Requirements: 2.3, 2.4, 2.5_

- [ ] 7. Implement proposal visibility control for temporary items
  - Update ProposalGenerator to filter items based on showOnProposal property
  - Ensure only items marked as "Show on Proposal = true" appear in generated PDFs
  - Test proposal generation with mixed visibility settings
  - _Requirements: 3.3, 3.5_

- [ ] 8. Enhance deal management system for admin visibility
  - Modify deal saving to capture original user context and pricing information
  - Update deals page to show all deals for admin users, filtered deals for others
  - Implement auto-save functionality when proposals are generated
  - Store deal metadata including user role and pricing tiers used
  - _Requirements: 4.1, 4.2, 4.3, 4.7_

- [ ] 9. Implement admin cost pricing view for saved deals
  - Create admin-specific deal viewer that overrides pricing with cost values
  - Modify deal loading to detect admin users and apply cost pricing
  - Update PDF generation from admin view to use cost pricing
  - Ensure managers and users continue to see their appropriate pricing levels
  - _Requirements: 4.4, 4.5, 4.6, 4.7_

- [ ] 10. Add batch save functionality to admin configuration components
  - Implement change tracking across all admin config components
  - Add visual indicators for unsaved changes (dirty state)
  - Provide single save action that persists all changes
  - Add confirmation dialogs for navigation with unsaved changes
  - _Requirements: 1.1, 1.2, 1.5, 1.6_

- [ ] 11. Test and validate role-based pricing across all components
  - Create comprehensive test scenarios for all user roles (admin, manager, user)
  - Verify pricing calculations use correct tiers for scales, factors, and items
  - Test deal saving and loading with different user contexts
  - Validate admin cost pricing view shows accurate cost information
  - _Requirements: 2.3, 2.4, 2.5, 4.4, 4.5_

- [ ] 12. Implement data migration for existing configurations
  - Create migration scripts to convert existing scales to three-tier structure
  - Create migration scripts to convert existing factors to three-tier structure
  - Ensure backward compatibility during migration process
  - Test migration with existing configuration data
  - _Requirements: 2.1, 2.2_

- [x] 13. Enhance settlement calculator with manual settlement input option





  - Improve "Include Settlement" toggle button UI to be larger and more visible
  - When toggle is ON: Use existing settlement calculator functionality
  - When toggle is OFF: Show manual settlement amount input field
  - Allow manual settlement input to accept any value including 0
  - Update calculator logic to use manual settlement amount when toggle is OFF
  - Ensure settlement amount is properly integrated into total cost calculations
  - Add validation for manual settlement input (numeric values only)
  - _Requirements: User Experience Enhancement_