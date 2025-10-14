# 🧪 Calculation Testing Guide

## Overview
This guide will help you verify that all calculations are accurate and match exactly between the Total Costs section and Admin Deals analysis.

---

## Test Scenario 1: Basic Deal

### Step 1: Create a Test Deal
1. Login to the calculator
2. Navigate to Hardware section
3. Add the following items:
   - **Yealink T54W**: Quantity 5
   - **Yealink W73H**: Quantity 3
4. Navigate to Connectivity section
5. Add:
   - **SIP Trunk**: Quantity 5
6. Navigate to Licensing section
7. Add:
   - **3CX Standard**: Quantity 5
8. Navigate to Deal Details
9. Enter:
   - **Customer Name**: Test Customer 1
   - **Term**: 36 months
   - **Escalation**: 10%
   - **Distance to Install**: 50 km
   - **Settlement**: R5,000

### Step 2: Review Total Costs
1. Navigate to Total Costs section
2. **Record these values**:
   ```
   Extension Count: _______
   Hardware Total: R_______
   Installation Cost: R_______
   Gross Profit: R_______
   Finance Fee: R_______
   Settlement: R_______
   Total Payout: R_______
   
   Hardware Rental: R_______ /month
   Connectivity Cost: R_______ /month
   Licensing Cost: R_______ /month
   Total MRC: R_______ /month
   Factor Used: _______
   ```

### Step 3: Generate PDF from Total Costs
1. Click "Generate PDF" button
2. PDF should download and open
3. **Verify**: All values in PDF match what you recorded above ✅

### Step 4: Save the Deal
1. Click "Save Deal" button
2. Wait for success message

### Step 5: View in Admin Deals
1. Logout and login as Admin
2. Navigate to Admin → All Deals
3. Find "Test Customer 1" deal
4. Click "View Analysis" or "Generate PDF"

### Step 6: Verify Customer Pricing Matches
**Compare these values with Step 2**:
```
Customer Pricing Section:
- Hardware Total: Should match ✅
- Installation Cost: Should match ✅
- Gross Profit: Should match ✅
- Finance Fee: Should match ✅
- Settlement: Should match ✅
- Total Payout: Should match ✅

Monthly Revenue:
- Connectivity: Should match ✅
- Licensing: Should match ✅
```

### Step 7: Verify Cost Analysis is Shown
**Check that these are displayed**:
```
Cost Analysis Section:
- Hardware Cost: R_______ (should be less than Hardware Total)
- Installation Cost: R_______ (should be less than Installation Cost)
- Total Costs: R_______

GP Analysis:
- Actual GP: R_______ (should be positive)
- GP %: _______% (should be reasonable, e.g., 20-40%)

Monthly Cost Analysis:
- Connectivity Cost: R_______ (should be less than Connectivity Revenue)
- Licensing Cost: R_______ (should be less than Licensing Revenue)
- Monthly GP: R_______ (should be positive)
- Monthly GP %: _______% (should be reasonable)
```

---

## Test Scenario 2: Edge Case - High Extensions

### Setup
- **Hardware**: 35 extensions (to test 33+ band)
- **Term**: 60 months
- **Escalation**: 0%
- **Settlement**: R0

### Expected Behavior
- Installation cost should use "33+" band
- Finance fee should be calculated correctly
- All calculations should still match between views

---

## Test Scenario 3: Edge Case - Zero Settlement

### Setup
- **Hardware**: 10 extensions
- **Term**: 36 months
- **Escalation**: 10%
- **Settlement**: R0

### Expected Behavior
- GP calculation should not include settlement
- All other calculations should work normally

---

## Test Scenario 4: Monthly Separation

### Verification Points
1. **Hardware Deal Section** should show:
   - Hardware Total
   - Installation Cost
   - Gross Profit
   - Finance Fee
   - Settlement
   - **Total Payout** (this is the hardware deal value)

2. **Monthly Recurring Section** should show:
   - Connectivity (monthly)
   - Licensing (monthly)
   - **NOT** Hardware Rental (that's part of hardware deal)

3. **Hardware Rental** should be shown as:
   - Part of Total MRC
   - Calculated as: Total Payout × Factor

---

## Common Issues and Solutions

### Issue 1: Customer Pricing Doesn't Match
**Symptom**: Values in Admin Deals don't match Total Costs

**Solution**:
1. Check if deal was saved properly
2. Verify `totals` object exists in saved deal
3. Check browser console for errors

### Issue 2: Cost Pricing Shows Zero
**Symptom**: All cost prices show R0.00

**Solution**:
1. Check admin config has cost pricing set
2. Verify items have `cost` field populated
3. Check scales have admin cost data

### Issue 3: GP Calculation Seems Wrong
**Symptom**: GP is negative or unreasonably high

**Solution**:
1. Verify formula: `GP = Payout - Hardware Cost - Installation Cost - Settlement`
2. Check that settlement is not being double-counted
3. Verify cost pricing is using admin costs, not user/manager costs

### Issue 4: Monthly GP Includes Hardware Rental
**Symptom**: Monthly GP seems too high

**Solution**:
1. Verify monthly GP only includes connectivity + licensing
2. Hardware rental should NOT be in monthly GP calculation
3. Hardware rental is part of hardware deal (payout × factor)

---

## Validation Checklist

### ✅ Total Costs PDF
- [ ] All values match displayed totals exactly
- [ ] Hardware section shows correct items and quantities
- [ ] Connectivity section shows correct items and quantities
- [ ] Licensing section shows correct items and quantities
- [ ] Installation cost includes sliding scale + extensions + fuel
- [ ] Total Payout is calculated correctly
- [ ] Factor is displayed correctly
- [ ] Monthly costs are shown separately

### ✅ Admin Deals Analysis
- [ ] Customer pricing matches Total Costs exactly
- [ ] Cost pricing is displayed
- [ ] Hardware cost uses admin cost pricing
- [ ] Installation cost uses admin cost scales
- [ ] GP calculation is correct
- [ ] Monthly costs are separated from hardware
- [ ] Monthly GP only includes connectivity + licensing
- [ ] Hardware rental is shown as part of MRC, not monthly GP

### ✅ Calculations
- [ ] Extension count is correct
- [ ] Installation sliding scale uses correct band
- [ ] Finance fee uses correct band
- [ ] Factor is correct for term/escalation/amount
- [ ] VAT calculation is correct (15%)
- [ ] All currency formatting is correct

### ✅ Edge Cases
- [ ] 0 extensions works correctly
- [ ] 33+ extensions uses correct band
- [ ] R0 settlement works correctly
- [ ] High payout (>R100k) works correctly
- [ ] 0% escalation works correctly
- [ ] 60-month term works correctly

---

## Performance Checks

### PDF Generation Speed
- [ ] Total Costs PDF generates in < 2 seconds
- [ ] Admin Analysis PDF generates in < 3 seconds
- [ ] No browser freezing during generation

### Data Accuracy
- [ ] No rounding errors
- [ ] No calculation discrepancies
- [ ] Consistent across multiple views

---

## Reporting Issues

If you find any calculation discrepancies:

1. **Document the issue**:
   - What values don't match?
   - Which section (Total Costs vs Admin Deals)?
   - What were the deal parameters?

2. **Check the console**:
   - Open browser developer tools (F12)
   - Check for any error messages
   - Note any warnings

3. **Provide test data**:
   - Export the deal data
   - Note the exact steps to reproduce
   - Include screenshots if possible

4. **Expected vs Actual**:
   - What did you expect to see?
   - What did you actually see?
   - What is the difference?

---

## Success Criteria

The implementation is successful if:

1. ✅ Total Costs PDF matches displayed values exactly
2. ✅ Admin Deals customer pricing matches Total Costs exactly
3. ✅ Cost pricing is displayed correctly in Admin Deals
4. ✅ GP calculations are accurate
5. ✅ Monthly costs are properly separated from hardware
6. ✅ All edge cases work correctly
7. ✅ No calculation discrepancies
8. ✅ Performance is acceptable

---

## Quick Test (5 Minutes)

For a quick verification:

1. Create a simple deal (5 extensions, 36 months, 10% escalation)
2. Note Total Payout value
3. Generate PDF from Total Costs
4. Save deal
5. Open in Admin Deals
6. Verify Total Payout matches exactly
7. Verify cost analysis is shown
8. ✅ If all match, implementation is working!

---

**Last Updated**: 2025-10-14
**Status**: Ready for Testing
