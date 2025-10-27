# Full Manual Testing Document
# Smart Cost Calculator - Comprehensive Test Suite

**Date Created:** October 27, 2025  
**Version:** 1.0  
**Purpose:** Complete manual testing of calculator functionality, pricing, factors, scales, and PDF generation

---

## Test Environment Setup

### Prerequisites
- [ ] Application running locally or on test server
- [ ] Access to admin account (Camryn / Elliot6242!)
- [ ] Access to manager test account
- [ ] Access to user test account
- [ ] Supabase database accessible
- [ ] All configuration data loaded (hardware, connectivity, licensing, factors, scales)

### Test Data Requirements
- [ ] Hardware items configured with admin/manager/user pricing
- [ ] Connectivity items configured with role-based pricing
- [ ] Licensing items configured with role-based pricing
- [ ] Factor sheets configured for 36, 48, 60 months with 0%, 10%, 15% escalation
- [ ] Scales configured for installation, finance fees, gross profit, and additional costs

---

## Section 1: User Role Testing

### Test 1.1: Admin User Login and Access
**Objective:** Verify admin user has full system access

**Steps:**
1. Log in as admin (Camryn / Elliot6242!)
2. Verify dashboard displays all features
3. Check access to Admin Panel
4. Check access to All Deal Calculations
5. Check access to Smart Scraper
6. Check access to Calculator
7. Check access to Instructions

**Expected Results:**
- Admin can access all features
- Dashboard shows admin-specific cards
- No access restrictions

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**



### Test 1.2: Manager User Login and Access
**Objective:** Verify manager user has appropriate access

**Steps:**
1. Log in as manager user
2. Verify dashboard displays manager features
3. Check access to Smart Scraper (should have access)
4. Check NO access to Admin Panel
5. Check NO access to All Deal Calculations
6. Check access to Calculator
7. Check access to My Deal Calculations

**Expected Results:**
- Manager can access Calculator, Smart Scraper, My Deals
- Manager cannot access Admin Panel or All Deals
- Dashboard shows appropriate cards

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


### Test 1.3: Standard User Login and Access
**Objective:** Verify standard user has limited access

**Steps:**
1. Log in as standard user
2. Verify dashboard displays user features
3. Check NO access to Smart Scraper
4. Check NO access to Admin Panel
5. Check NO access to All Deal Calculations
6. Check access to Calculator
7. Check access to My Deal Calculations

**Expected Results:**
- User can access Calculator and My Deals only
- User cannot access Smart Scraper, Admin Panel, or All Deals
- Dashboard shows appropriate cards

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


---

## Section 2: Pricing Verification by Role

### Test 2.1: Admin Pricing (Cost Price)
**Objective:** Verify admin sees cost pricing for all items

**Steps:**
1. Log in as admin
2. Go to Calculator
3. Navigate to Hardware section
4. Record pricing for 3 sample items
5. Navigate to Connectivity section
6. Record pricing for 2 sample items
7. Navigate to Licensing section
8. Record pricing for 2 sample items
9. Compare with database values

**Sample Items to Check:**
- Hardware: Desk Phone B&W, Desk Phone Colour, Cordless Phone
- Connectivity: LTE, Fibre
- Licensing: Premium License, SLA (0-5 users)

**Expected Results:**
- Admin sees cost pricing (lowest price tier)
- Prices match database cost field

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Prices:**
- Desk Phone B&W: R______
- Desk Phone Colour: R______
- Cordless Phone: R______
- LTE: R______
- Fibre: R______
- Premium License: R______
- SLA (0-5): R______

**Notes:**



### Test 2.2: Manager Pricing
**Objective:** Verify manager sees manager pricing for all items

**Steps:**
1. Log in as manager
2. Go to Calculator
3. Navigate to Hardware section
4. Record pricing for same 3 sample items
5. Navigate to Connectivity section
6. Record pricing for same 2 sample items
7. Navigate to Licensing section
8. Record pricing for same 2 sample items
9. Compare with database managerCost values

**Expected Results:**
- Manager sees managerCost pricing (middle price tier)
- Prices match database managerCost field
- Prices are higher than admin cost prices

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Prices:**
- Desk Phone B&W: R______
- Desk Phone Colour: R______
- Cordless Phone: R______
- LTE: R______
- Fibre: R______
- Premium License: R______
- SLA (0-5): R______

**Notes:**


### Test 2.3: User Pricing
**Objective:** Verify user sees user pricing for all items

**Steps:**
1. Log in as standard user
2. Go to Calculator
3. Navigate to Hardware section
4. Record pricing for same 3 sample items
5. Navigate to Connectivity section
6. Record pricing for same 2 sample items
7. Navigate to Licensing section
8. Record pricing for same 2 sample items
9. Compare with database userCost values

**Expected Results:**
- User sees userCost pricing (highest price tier)
- Prices match database userCost field
- Prices are higher than manager prices

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Prices:**
- Desk Phone B&W: R______
- Desk Phone Colour: R______
- Cordless Phone: R______
- LTE: R______
- Fibre: R______
- Premium License: R______
- SLA (0-5): R______

**Notes:**


---

## Section 3: Factor Sheet Testing

### Test 3.1: 36 Month Term - 0% Escalation
**Objective:** Verify correct factor is applied for 36 months with 0% escalation

**Steps:**
1. Log in as admin
2. Create new deal calculation
3. Set term to 36 months
4. Set escalation to 0%
5. Add hardware totaling different amounts to test all bands:
   - Test 1: R15,000 (0-20000 band)
   - Test 2: R35,000 (20001-50000 band)
   - Test 3: R75,000 (50001-100000 band)
   - Test 4: R150,000 (100000+ band)
6. Record factor used in each test
7. Compare with factor sheet

**Expected Factors (from database):**
- 0-20000: 0.03814
- 20001-50000: 0.03814
- 50001-100000: 0.03755
- 100000+: 0.03707

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Factors:**
- Test 1 (R15,000): ______
- Test 2 (R35,000): ______
- Test 3 (R75,000): ______
- Test 4 (R150,000): ______

**Notes:**



### Test 3.2: 36 Month Term - 10% Escalation
**Objective:** Verify correct factor is applied for 36 months with 10% escalation

**Steps:**
1. Create new deal calculation
2. Set term to 36 months
3. Set escalation to 10%
4. Test all finance amount bands
5. Record factors used

**Expected Factors:**
- 0-20000: 0.03511
- 20001-50000: 0.03511
- 50001-100000: 0.03454
- 100000+: 0.03409

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Factors:**
- Test 1 (R15,000): ______
- Test 2 (R35,000): ______
- Test 3 (R75,000): ______
- Test 4 (R150,000): ______

**Notes:**


### Test 3.3: 36 Month Term - 15% Escalation
**Objective:** Verify correct factor is applied for 36 months with 15% escalation

**Steps:**
1. Create new deal calculation
2. Set term to 36 months
3. Set escalation to 15%
4. Test all finance amount bands
5. Record factors used

**Expected Factors:**
- 0-20000: 0.04133
- 20001-50000: 0.04003
- 50001-100000: 0.03883
- 100000+: 0.03803

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Factors:**
- Test 1 (R15,000): ______
- Test 2 (R35,000): ______
- Test 3 (R75,000): ______
- Test 4 (R150,000): ______

**Notes:**


### Test 3.4: 48 Month Term - All Escalations
**Objective:** Verify correct factors for 48 month term

**Steps:**
1. Test 48 months with 0% escalation
2. Test 48 months with 10% escalation
3. Test 48 months with 15% escalation
4. Test multiple finance amount bands for each

**Expected Factors (48 months, 0%):**
- 0-20000: 0.03155
- 20001-50000: 0.03155
- 50001-100000: 0.03093
- 100000+: 0.03043

**Expected Factors (48 months, 10%):**
- 0-20000: 0.02805
- 20001-50000: 0.02805
- 50001-100000: 0.02741
- 100000+: 0.02694

**Expected Factors (48 months, 15%):**
- 0-20000: 0.03375
- 20001-50000: 0.03245
- 50001-100000: 0.03125
- 100000+: 0.03045

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Factors:**
- 0% / R15,000: ______
- 0% / R150,000: ______
- 10% / R15,000: ______
- 10% / R150,000: ______
- 15% / R15,000: ______
- 15% / R150,000: ______

**Notes:**



### Test 3.5: 60 Month Term - All Escalations
**Objective:** Verify correct factors for 60 month term

**Steps:**
1. Test 60 months with 0% escalation
2. Test 60 months with 10% escalation
3. Test 60 months with 15% escalation
4. Test multiple finance amount bands for each

**Expected Factors (60 months, 0%):**
- 0-20000: 0.02772
- 20001-50000: 0.02772
- 50001-100000: 0.02705
- 100000+: 0.02658

**Expected Factors (60 months, 10%):**
- 0-20000: 0.02327
- 20001-50000: 0.02327
- 50001-100000: 0.02315
- 100000+: 0.02267

**Expected Factors (60 months, 15%):**
- 0-20000: 0.02937
- 20001-50000: 0.02807
- 50001-100000: 0.02687
- 100000+: 0.02607

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Factors:**
- 0% / R15,000: ______
- 0% / R150,000: ______
- 10% / R15,000: ______
- 10% / R150,000: ______
- 15% / R15,000: ______
- 15% / R150,000: ______

**Notes:**


---

## Section 4: Sliding Scale Testing

### Test 4.1: Installation Cost Sliding Scale
**Objective:** Verify installation costs scale correctly based on extension count

**Steps:**
1. Create deal with 3 extensions (0-4 band)
2. Record installation cost
3. Create deal with 7 extensions (5-8 band)
4. Record installation cost
5. Create deal with 12 extensions (9-16 band)
6. Record installation cost
7. Create deal with 25 extensions (17-32 band)
8. Record installation cost
9. Create deal with 40 extensions (33+ band)
10. Record installation cost

**Expected Installation Costs (default):**
- 0-4 extensions: R3,500
- 5-8 extensions: R3,500
- 9-16 extensions: R7,000
- 17-32 extensions: R10,500
- 33+ extensions: R15,000

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Costs:**
- 3 extensions: R______
- 7 extensions: R______
- 12 extensions: R______
- 25 extensions: R______
- 40 extensions: R______

**Notes:**



### Test 4.2: Finance Fee Sliding Scale
**Objective:** Verify finance fees scale correctly based on total payout

**Steps:**
1. Create deal with total payout ~R15,000 (0-20000 band)
2. Record finance fee
3. Create deal with total payout ~R35,000 (20001-50000 band)
4. Record finance fee
5. Create deal with total payout ~R75,000 (50001-100000 band)
6. Record finance fee
7. Create deal with total payout ~R150,000 (100001+ band)
8. Record finance fee

**Expected Finance Fees (default):**
- 0-20000: R1,800
- 20001-50000: R1,800
- 50001-100000: R2,800
- 100001+: R3,800

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Finance Fees:**
- R15,000 payout: R______
- R35,000 payout: R______
- R75,000 payout: R______
- R150,000 payout: R______

**Notes:**


### Test 4.3: Gross Profit Sliding Scale
**Objective:** Verify gross profit scales correctly based on extension count

**Steps:**
1. Create deal with 3 extensions (0-4 band)
2. Record gross profit
3. Create deal with 7 extensions (5-8 band)
4. Record gross profit
5. Create deal with 12 extensions (9-16 band)
6. Record gross profit
7. Create deal with 25 extensions (17-32 band)
8. Record gross profit
9. Create deal with 40 extensions (33+ band)
10. Record gross profit

**Expected Gross Profit (default):**
- 0-4 extensions: R10,000
- 5-8 extensions: R15,000
- 9-16 extensions: R20,000
- 17-32 extensions: R25,000
- 33+ extensions: R30,000

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Gross Profit:**
- 3 extensions: R______
- 7 extensions: R______
- 12 extensions: R______
- 25 extensions: R______
- 40 extensions: R______

**Notes:**


### Test 4.4: Additional Costs (Distance & Extension Points)
**Objective:** Verify additional costs calculated correctly

**Steps:**
1. Create deal with 50km distance
2. Record fuel cost (should be 50 × R1.50 = R75)
3. Create deal with 10 extension points
4. Record extension cost (should be 10 × R750 = R7,500)
5. Create deal with both 50km and 10 extensions
6. Verify both costs are added correctly

**Expected Costs (default):**
- Cost per kilometer: R1.50
- Cost per extension point: R750

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Costs:**
- 50km fuel cost: R______
- 10 extension points cost: R______
- Combined (50km + 10 ext): R______

**Notes:**


---

## Section 5: Calculation Accuracy Testing

### Test 5.1: Complete Deal Calculation - Admin
**Objective:** Verify all calculations are accurate for admin user

**Test Deal Parameters:**
- Customer: Test Customer A
- Term: 36 months
- Escalation: 10%
- Distance: 25km
- Settlement: R5,000
- Hardware: 5× Desk Phone B&W, 2× Cordless Phone
- Connectivity: 1× LTE
- Licensing: 1× Premium License

**Steps:**
1. Log in as admin
2. Create deal with above parameters
3. Record all calculated values
4. Manually verify calculations

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Values:**
- Extension Count: ______
- Hardware Total: R______
- Installation Cost: R______
- Gross Profit: R______
- Finance Fee: R______
- Total Payout: R______
- Factor Used: ______
- Hardware Rental: R______
- Connectivity Cost: R______
- Licensing Cost: R______
- Total MRC: R______
- Total Inc VAT: R______

**Manual Calculation Verification:**
- Hardware Total = (5 × cost of Desk Phone B&W) + (2 × cost of Cordless Phone)
- Installation = Sliding scale for 7 extensions + (7 × R750) + (25 × R1.50)
- Finance Fee = Based on total payout band
- Hardware Rental = Total Payout × Factor
- Total MRC = Hardware Rental + Connectivity + Licensing
- Total Inc VAT = Total MRC × 1.15

**Notes:**



### Test 5.2: Complete Deal Calculation - Manager
**Objective:** Verify calculations use manager pricing correctly

**Test Deal Parameters:**
- Same as Test 5.1 but logged in as manager

**Steps:**
1. Log in as manager
2. Create deal with same parameters as Test 5.1
3. Record all calculated values
4. Compare with admin values (should be higher due to manager pricing)

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Values:**
- Extension Count: ______
- Hardware Total: R______ (should be higher than admin)
- Installation Cost: R______
- Gross Profit: R______
- Finance Fee: R______
- Total Payout: R______ (should be higher than admin)
- Factor Used: ______
- Hardware Rental: R______ (should be higher than admin)
- Total MRC: R______ (should be higher than admin)
- Total Inc VAT: R______ (should be higher than admin)

**Notes:**


### Test 5.3: Complete Deal Calculation - User
**Objective:** Verify calculations use user pricing correctly

**Test Deal Parameters:**
- Same as Test 5.1 but logged in as user

**Steps:**
1. Log in as user
2. Create deal with same parameters as Test 5.1
3. Record all calculated values
4. Compare with manager values (should be higher due to user pricing)

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Values:**
- Extension Count: ______
- Hardware Total: R______ (should be highest)
- Installation Cost: R______
- Gross Profit: R______
- Finance Fee: R______
- Total Payout: R______ (should be highest)
- Factor Used: ______
- Hardware Rental: R______ (should be highest)
- Total MRC: R______ (should be highest)
- Total Inc VAT: R______ (should be highest)

**Notes:**


### Test 5.4: Custom Gross Profit Override
**Objective:** Verify custom gross profit can be set and recalculates correctly

**Steps:**
1. Create a deal with default gross profit
2. Record default gross profit value
3. Change gross profit to custom value (e.g., R12,000)
4. Verify all dependent calculations update
5. Record new total payout, finance fee, hardware rental
6. Reset to default
7. Verify calculations return to original values

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Values:**
- Default Gross Profit: R______
- Default Total Payout: R______
- Default Finance Fee: R______
- Custom Gross Profit: R12,000
- New Total Payout: R______
- New Finance Fee: R______
- After Reset Total Payout: R______

**Notes:**


---

## Section 6: PDF Generation Testing

### Test 6.1: PDF Generation - Admin View
**Objective:** Verify PDF generates correctly with admin pricing

**Steps:**
1. Log in as admin
2. Create complete deal (use Test 5.1 parameters)
3. Click "Generate PDF"
4. Open generated PDF
5. Verify all sections present
6. Verify pricing matches calculator
7. Verify calculations are accurate

**PDF Sections to Verify:**
- [ ] Company branding/header
- [ ] Deal details (customer, term, escalation)
- [ ] Hardware breakdown with quantities and prices
- [ ] Connectivity breakdown
- [ ] Licensing breakdown
- [ ] Installation costs
- [ ] Gross profit
- [ ] Finance fee
- [ ] Total payout
- [ ] Monthly recurring costs
- [ ] VAT calculations
- [ ] Terms and conditions

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**



### Test 6.2: PDF Generation - Manager View
**Objective:** Verify PDF shows manager pricing correctly

**Steps:**
1. Log in as manager
2. Create same deal as Test 6.1
3. Generate PDF
4. Verify pricing is manager pricing (not admin cost)
5. Compare with admin PDF to confirm pricing differences

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


### Test 6.3: PDF Generation - User View
**Objective:** Verify PDF shows user pricing correctly

**Steps:**
1. Log in as user
2. Create same deal as Test 6.1
3. Generate PDF
4. Verify pricing is user pricing (highest tier)
5. Compare with manager PDF to confirm pricing differences

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


### Test 6.4: Proposal Generation
**Objective:** Verify proposal generation works correctly

**Steps:**
1. Create complete deal
2. Click "Generate Proposal"
3. Fill in proposal details (company name, contact, etc.)
4. Generate proposal
5. Verify proposal PDF contains all required information
6. Verify formatting is professional

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


---

## Section 7: Deal Saving and Loading

### Test 7.1: Save Deal - Admin
**Objective:** Verify deals save correctly with all data

**Steps:**
1. Log in as admin
2. Create complete deal
3. Click "Save Deal"
4. Verify success message
5. Navigate to "My Deal Calculations"
6. Verify deal appears in list
7. Check deal shows correct customer name, date, totals

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


### Test 7.2: Load Deal - Admin
**Objective:** Verify deals load correctly with all data intact

**Steps:**
1. From "My Deal Calculations", click "Load" on saved deal
2. Verify calculator opens with all data pre-filled
3. Check all sections have correct items and quantities
4. Verify deal details are correct
5. Verify totals match saved values

**Test Result:** ☐ Pass ☐ Fail  
**Verification Checklist:**
- [ ] Customer name correct
- [ ] Term correct
- [ ] Escalation correct
- [ ] Distance correct
- [ ] Settlement correct
- [ ] Hardware items and quantities correct
- [ ] Connectivity items and quantities correct
- [ ] Licensing items and quantities correct
- [ ] Totals match saved values

**Notes:**



### Test 7.3: Update Existing Deal
**Objective:** Verify deals can be updated and changes are saved

**Steps:**
1. Load an existing deal
2. Make changes (add hardware, change quantities, etc.)
3. Save deal again
4. Reload deal
5. Verify changes were saved

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


### Test 7.4: Deal Isolation by User
**Objective:** Verify users only see their own deals

**Steps:**
1. Log in as user A
2. Create and save a deal
3. Log out
4. Log in as user B
5. Go to "My Deal Calculations"
6. Verify user A's deal is NOT visible
7. Create and save a deal as user B
8. Verify only user B's deal is visible

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


---

## Section 8: Admin "All Deals" Analysis

### Test 8.1: View All Deals as Admin
**Objective:** Verify admin can see all users' deals

**Steps:**
1. Ensure multiple users have saved deals
2. Log in as admin
3. Go to "All Deal Calculations"
4. Verify deals from all users are visible
5. Check each deal shows username/creator
6. Verify deals are sorted by date (newest first)

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


### Test 8.2: Admin Load User Deal - Pricing Verification
**Objective:** Verify admin sees correct pricing when loading another user's deal

**Steps:**
1. Have a standard user create and save a deal
2. Log in as admin
3. Go to "All Deal Calculations"
4. Load the user's deal
5. Verify deal shows with ORIGINAL user pricing (not admin pricing)
6. Check totals match what user saw
7. Verify PDF generation uses user's original pricing

**Test Result:** ☐ Pass ☐ Fail  
**Critical Checks:**
- [ ] Hardware prices match user's pricing
- [ ] Connectivity prices match user's pricing
- [ ] Licensing prices match user's pricing
- [ ] Total payout matches user's calculation
- [ ] MRC matches user's calculation
- [ ] PDF shows user's pricing, not admin cost

**Notes:**


### Test 8.3: Admin Cost Analysis View
**Objective:** Verify admin can see cost analysis and GP calculations

**Steps:**
1. Load a user's deal as admin
2. Navigate to analysis/cost view (if available)
3. Verify admin can see:
   - User's pricing (what customer sees)
   - Cost pricing (actual cost)
   - Gross profit margin
   - Rep GP vs Actual GP

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Values:**
- User's Total Payout: R______
- Cost Price Total: R______
- Gross Profit: R______
- GP Percentage: ______%

**Notes:**



### Test 8.4: Admin PDF Generation from User Deal
**Objective:** Verify admin-generated PDF from user deal shows correct pricing

**Steps:**
1. Load a user's deal as admin
2. Generate PDF
3. Verify PDF shows:
   - User's pricing (not admin cost)
   - Correct totals matching user's view
   - User's name as deal creator
4. If admin view available, verify it shows cost analysis

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


---

## Section 9: Edge Cases and Boundary Testing

### Test 9.1: Zero Quantities
**Objective:** Verify calculator handles zero quantities correctly

**Steps:**
1. Create deal with no hardware selected
2. Verify totals calculate correctly (should be minimal)
3. Create deal with hardware but zero connectivity
4. Create deal with hardware but zero licensing
5. Verify all scenarios calculate without errors

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


### Test 9.2: Maximum Quantities
**Objective:** Verify calculator handles large quantities

**Steps:**
1. Create deal with 100 of one hardware item
2. Verify calculations are correct
3. Verify no overflow errors
4. Verify PDF generates correctly

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


### Test 9.3: Boundary Values for Sliding Scales
**Objective:** Verify boundary values are handled correctly

**Steps:**
1. Test with exactly 4 extensions (boundary of 0-4 band)
2. Test with exactly 5 extensions (start of 5-8 band)
3. Test with exactly 8 extensions (end of 5-8 band)
4. Test with exactly 9 extensions (start of 9-16 band)
5. Verify correct sliding scale applied for each

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Installation Costs:**
- 4 extensions: R______ (should be R3,500)
- 5 extensions: R______ (should be R3,500)
- 8 extensions: R______ (should be R3,500)
- 9 extensions: R______ (should be R7,000)

**Notes:**


### Test 9.4: Finance Amount Boundary Values
**Objective:** Verify finance fee boundaries are correct

**Steps:**
1. Create deal with total payout of exactly R20,000
2. Verify finance fee (should be R1,800)
3. Create deal with total payout of exactly R20,001
4. Verify finance fee (should be R1,800)
5. Create deal with total payout of exactly R50,000
6. Verify finance fee (should be R1,800)
7. Create deal with total payout of exactly R50,001
8. Verify finance fee (should be R2,800)

**Test Result:** ☐ Pass ☐ Fail  
**Recorded Finance Fees:**
- R20,000: R______
- R20,001: R______
- R50,000: R______
- R50,001: R______

**Notes:**



---

## Section 10: Cross-Role Comparison Testing

### Test 10.1: Same Deal - All Three Roles
**Objective:** Compare calculations across all user roles for identical deal

**Test Deal Parameters:**
- Customer: Cross-Role Test
- Term: 48 months
- Escalation: 10%
- Distance: 30km
- Settlement: R10,000
- Hardware: 3× Desk Phone B&W, 1× Desk Phone Colour, 2× Cordless Phone
- Connectivity: 1× LTE, 1× Fibre
- Licensing: 1× Premium License, 1× SLA (0-5 users)

**Steps:**
1. Create this exact deal as admin - record all values
2. Create this exact deal as manager - record all values
3. Create this exact deal as user - record all values
4. Compare all three sets of values

**Test Result:** ☐ Pass ☐ Fail

**Admin Values:**
- Hardware Total: R______
- Total Payout: R______
- Factor Used: ______
- Hardware Rental: R______
- Connectivity Cost: R______
- Licensing Cost: R______
- Total MRC: R______
- Total Inc VAT: R______

**Manager Values:**
- Hardware Total: R______
- Total Payout: R______
- Factor Used: ______
- Hardware Rental: R______
- Connectivity Cost: R______
- Licensing Cost: R______
- Total MRC: R______
- Total Inc VAT: R______

**User Values:**
- Hardware Total: R______
- Total Payout: R______
- Factor Used: ______
- Hardware Rental: R______
- Connectivity Cost: R______
- Licensing Cost: R______
- Total MRC: R______
- Total Inc VAT: R______

**Expected Pattern:**
- User values should be highest
- Manager values should be middle
- Admin values should be lowest
- Factor should be the same for all (based on finance amount band)
- Installation costs should be the same for all

**Notes:**


---

## Section 11: Data Persistence Testing

### Test 11.1: Browser Refresh During Calculation
**Objective:** Verify data persists during browser refresh

**Steps:**
1. Start creating a deal
2. Fill in deal details
3. Add some hardware items
4. Refresh browser
5. Verify data is still present

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


### Test 11.2: Navigate Away and Return
**Objective:** Verify unsaved data persists when navigating

**Steps:**
1. Start creating a deal
2. Add items to all sections
3. Navigate to dashboard
4. Return to calculator
5. Verify all data is still present

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


### Test 11.3: Logout and Login
**Objective:** Verify saved deals persist across sessions

**Steps:**
1. Create and save a deal
2. Log out
3. Log back in
4. Go to "My Deal Calculations"
5. Verify deal is still there
6. Load deal and verify all data intact

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


---

## Section 12: Mobile Responsiveness Testing

### Test 12.1: Mobile Calculator View
**Objective:** Verify calculator works on mobile devices

**Steps:**
1. Access calculator on mobile device or mobile view
2. Verify all sections are accessible
3. Check no horizontal scrolling
4. Verify card layouts display correctly
5. Test all input fields are usable
6. Verify buttons are touch-friendly

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


### Test 12.2: Mobile PDF Generation
**Objective:** Verify PDF generation works on mobile

**Steps:**
1. Create complete deal on mobile
2. Generate PDF
3. Verify PDF downloads correctly
4. Open PDF and verify formatting

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


---

## Section 13: Configuration Changes Impact

### Test 13.1: Hardware Price Change Impact
**Objective:** Verify price changes affect new calculations but not saved deals

**Steps:**
1. Create and save a deal (Deal A)
2. As admin, change price of a hardware item
3. Create new deal with same items (Deal B)
4. Verify Deal B uses new pricing
5. Load Deal A
6. Verify Deal A still uses old pricing

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**



### Test 13.2: Factor Sheet Change Impact
**Objective:** Verify factor changes affect new calculations

**Steps:**
1. Note current factor for 36 months, 0%, 0-20000 band
2. Create and save a deal using this factor
3. As admin, change the factor value
4. Create new deal with same parameters
5. Verify new deal uses new factor
6. Load old deal
7. Verify old deal still uses old factor

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


### Test 13.3: Scales Change Impact
**Objective:** Verify scale changes affect new calculations

**Steps:**
1. Note current installation cost for 5-8 extensions
2. Create and save a deal with 7 extensions
3. As admin, change installation cost for 5-8 band
4. Create new deal with 7 extensions
5. Verify new deal uses new installation cost
6. Load old deal
7. Verify old deal still uses old installation cost

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


---

## Section 14: Error Handling and Validation

### Test 14.1: Required Field Validation
**Objective:** Verify required fields are enforced

**Steps:**
1. Try to proceed without entering customer name
2. Verify validation error appears
3. Try to save deal without customer name
4. Verify save is prevented

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


### Test 14.2: Invalid Input Handling
**Objective:** Verify invalid inputs are handled gracefully

**Steps:**
1. Try entering negative numbers in quantity fields
2. Try entering text in numeric fields
3. Try entering extremely large numbers
4. Verify appropriate error messages or input prevention

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


### Test 14.3: Network Error Handling
**Objective:** Verify app handles network errors gracefully

**Steps:**
1. Disconnect from network
2. Try to save a deal
3. Verify appropriate error message
4. Reconnect to network
5. Try to save again
6. Verify save succeeds

**Test Result:** ☐ Pass ☐ Fail  
**Notes:**


---

## Section 15: Performance Testing

### Test 15.1: Large Deal Calculation Speed
**Objective:** Verify calculations remain fast with many items

**Steps:**
1. Create deal with 20+ hardware items
2. Add 5+ connectivity items
3. Add 3+ licensing items
4. Measure time for totals to calculate
5. Verify calculations complete in < 2 seconds

**Test Result:** ☐ Pass ☐ Fail  
**Calculation Time:** ______ seconds  
**Notes:**


### Test 15.2: PDF Generation Speed
**Objective:** Verify PDF generation is reasonably fast

**Steps:**
1. Create large deal (20+ items)
2. Generate PDF
3. Measure time from click to download
4. Verify PDF generates in < 5 seconds

**Test Result:** ☐ Pass ☐ Fail  
**Generation Time:** ______ seconds  
**Notes:**


### Test 15.3: Deal Loading Speed
**Objective:** Verify deals load quickly

**Steps:**
1. Load a saved deal
2. Measure time from click to fully loaded
3. Verify loads in < 3 seconds

**Test Result:** ☐ Pass ☐ Fail  
**Load Time:** ______ seconds  
**Notes:**


---

## Section 16: Final Integration Tests

### Test 16.1: Complete User Journey - Standard User
**Objective:** Test complete workflow for standard user

**Steps:**
1. Log in as standard user
2. Navigate to calculator
3. Create complete deal with all sections filled
4. Save deal
5. Generate PDF
6. Navigate to My Deals
7. Load the deal
8. Modify the deal
9. Save again
10. Generate proposal
11. Log out

**Test Result:** ☐ Pass ☐ Fail  
**Issues Encountered:**


**Notes:**



### Test 16.2: Complete User Journey - Manager
**Objective:** Test complete workflow for manager

**Steps:**
1. Log in as manager
2. Navigate to calculator
3. Create complete deal
4. Save deal
5. Access Smart Scraper
6. Perform a small scrape test
7. Return to calculator
8. Load saved deal
9. Generate PDF
10. Log out

**Test Result:** ☐ Pass ☐ Fail  
**Issues Encountered:**


**Notes:**


### Test 16.3: Complete User Journey - Admin
**Objective:** Test complete workflow for admin

**Steps:**
1. Log in as admin
2. Navigate to Admin Panel
3. Modify a hardware item price
4. Navigate to calculator
5. Create complete deal
6. Save deal
7. Navigate to All Deal Calculations
8. Load another user's deal
9. Verify pricing is correct
10. Generate PDF from user's deal
11. Navigate back to own deals
12. Load own deal
13. Generate PDF
14. Log out

**Test Result:** ☐ Pass ☐ Fail  
**Issues Encountered:**


**Notes:**


---

## Test Summary

### Overall Test Results

**Total Tests:** 60+  
**Tests Passed:** ______  
**Tests Failed:** ______  
**Tests Skipped:** ______  
**Pass Rate:** ______%

### Critical Issues Found

1. 
2. 
3. 

### Minor Issues Found

1. 
2. 
3. 

### Recommendations

1. 
2. 
3. 

### Sign-Off

**Tester Name:** ______________________  
**Date Completed:** ______________________  
**Signature:** ______________________

**Approved By:** ______________________  
**Date:** ______________________  
**Signature:** ______________________

---

## Appendix A: Test Data Reference

### Default Factor Sheet Values

**36 Months:**
- 0% Escalation: 0.03814 (0-20k), 0.03814 (20-50k), 0.03755 (50-100k), 0.03707 (100k+)
- 10% Escalation: 0.03511 (0-20k), 0.03511 (20-50k), 0.03454 (50-100k), 0.03409 (100k+)
- 15% Escalation: 0.04133 (0-20k), 0.04003 (20-50k), 0.03883 (50-100k), 0.03803 (100k+)

**48 Months:**
- 0% Escalation: 0.03155 (0-20k), 0.03155 (20-50k), 0.03093 (50-100k), 0.03043 (100k+)
- 10% Escalation: 0.02805 (0-20k), 0.02805 (20-50k), 0.02741 (50-100k), 0.02694 (100k+)
- 15% Escalation: 0.03375 (0-20k), 0.03245 (20-50k), 0.03125 (50-100k), 0.03045 (100k+)

**60 Months:**
- 0% Escalation: 0.02772 (0-20k), 0.02772 (20-50k), 0.02705 (50-100k), 0.02658 (100k+)
- 10% Escalation: 0.02327 (0-20k), 0.02327 (20-50k), 0.02315 (50-100k), 0.02267 (100k+)
- 15% Escalation: 0.02937 (0-20k), 0.02807 (20-50k), 0.02687 (50-100k), 0.02607 (100k+)

### Default Scales Values

**Installation Costs:**
- 0-4 extensions: R3,500
- 5-8 extensions: R3,500
- 9-16 extensions: R7,000
- 17-32 extensions: R10,500
- 33+ extensions: R15,000

**Finance Fees:**
- R0-20,000: R1,800
- R20,001-50,000: R1,800
- R50,001-100,000: R2,800
- R100,001+: R3,800

**Gross Profit:**
- 0-4 extensions: R10,000
- 5-8 extensions: R15,000
- 9-16 extensions: R20,000
- 17-32 extensions: R25,000
- 33+ extensions: R30,000

**Additional Costs:**
- Cost per kilometer: R1.50
- Cost per extension point: R750.00

### Sample Hardware Items (Default Cost Prices)

- Desk Phone B&W: R1,054
- Desk Phone Colour: R1,378
- Switchboard Colour: R2,207
- Cordless Phone: R2,420
- Bluetooth Headset Mono: R1,996
- Bluetooth Headset Dual: R2,340

---

## Appendix B: Quick Reference Checklist

### Pre-Test Setup
- [ ] Application accessible
- [ ] Admin account working
- [ ] Manager account working
- [ ] User account working
- [ ] Database populated with test data
- [ ] All configuration loaded

### Critical Tests (Must Pass)
- [ ] Test 2.1: Admin Pricing
- [ ] Test 2.2: Manager Pricing
- [ ] Test 2.3: User Pricing
- [ ] Test 3.1-3.5: All Factor Tests
- [ ] Test 4.1: Installation Sliding Scale
- [ ] Test 4.2: Finance Fee Sliding Scale
- [ ] Test 5.1-5.3: Complete Calculations All Roles
- [ ] Test 6.1-6.3: PDF Generation All Roles
- [ ] Test 7.2: Load Deal Integrity
- [ ] Test 8.2: Admin Load User Deal Pricing
- [ ] Test 10.1: Cross-Role Comparison

### High Priority Tests
- [ ] Test 4.3: Gross Profit Sliding Scale
- [ ] Test 4.4: Additional Costs
- [ ] Test 5.4: Custom Gross Profit
- [ ] Test 7.1: Save Deal
- [ ] Test 7.4: Deal Isolation
- [ ] Test 8.1: View All Deals
- [ ] Test 9.3: Boundary Values
- [ ] Test 13.1-13.3: Configuration Changes

### Medium Priority Tests
- [ ] Test 1.1-1.3: User Access
- [ ] Test 9.1-9.2: Edge Cases
- [ ] Test 11.1-11.3: Data Persistence
- [ ] Test 14.1-14.2: Validation
- [ ] Test 16.1-16.3: Complete Journeys

### Low Priority Tests
- [ ] Test 12.1-12.2: Mobile Responsiveness
- [ ] Test 15.1-15.3: Performance
- [ ] Test 14.3: Network Errors

---

**END OF TESTING DOCUMENT**
