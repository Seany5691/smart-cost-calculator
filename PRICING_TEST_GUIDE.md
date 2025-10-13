# 🧪 Pricing Logic Testing Guide

## Quick Test to Verify the Fix

### Test Scenario: Compare Admin vs User Pricing

#### Step 1: Test as ADMIN
1. **Login** as admin user
2. **Go to Calculator**
3. **Deal Details**: Enter any customer name, select 36 months, 10% escalation
4. **Hardware**: Select 1x of any hardware item
5. **Note the price** shown for that item
6. **Go to Total Costs**
7. **Note the Factor Used** value
8. **Note the Total Payout** amount

#### Step 2: Test as USER
1. **Logout** and login as regular user
2. **Go to Calculator**
3. **Deal Details**: Enter same details (36 months, 10% escalation)
4. **Hardware**: Select 1x of the SAME hardware item
5. **Note the price** shown for that item
6. **Go to Total Costs**
7. **Note the Factor Used** value
8. **Note the Total Payout** amount

#### Expected Results:
- ✅ **Admin hardware price** should be LOWER than User hardware price
- ✅ **Admin factor** should be LOWER than User factor
- ✅ **Admin total payout** should be LOWER than User total payout

---

## Detailed Verification

### Check 1: Hardware Pricing
**Admin/Manager should see:**
- Lower prices (manager pricing)
- Example: If user sees R1000, admin might see R800

**User should see:**
- Higher prices (user pricing)
- Example: R1000

### Check 2: Factor Values
**Admin/Manager should see:**
- Lower factor (manager factor)
- Example: If user sees 0.03500, admin might see 0.03200

**User should see:**
- Higher factor (user factor)
- Example: 0.03500

### Check 3: Total Costs
**Admin/Manager should see:**
- Lower total payout
- Lower hardware rental
- Lower total MRC

**User should see:**
- Higher total payout
- Higher hardware rental
- Higher total MRC

---

## Quick Visual Check

### In Admin Panel:
1. Go to **Admin > Hardware Config**
2. Look at any hardware item
3. You should see THREE prices:
   - **Cost**: Base cost
   - **Manager Cost**: What admin/manager sees
   - **User Cost**: What regular users see

4. Verify: `Cost < Manager Cost < User Cost`

### In Admin Panel - Factors:
1. Go to **Admin > Factor Sheet**
2. Look at any term/escalation combination
3. You should see THREE factor tables:
   - **Cost Factors**: Base factors
   - **Manager Factors**: What admin/manager uses
   - **User Factors**: What regular users use

4. Verify: `Cost Factor < Manager Factor < User Factor`

---

## What to Look For

### ✅ CORRECT Behavior:
- Admin sees lower prices than users
- Admin uses manager factors (lower than user factors)
- Admin total costs are lower than user total costs
- Manager sees same prices as admin
- Manager uses same factors as admin

### ❌ INCORRECT Behavior (Bug):
- Admin sees same prices as users
- Admin uses cost factors (lowest) instead of manager factors
- Admin total costs are too low (using cost factors)
- Manager sees different prices than admin

---

## Example Calculation

### Scenario:
- Hardware Item: "Yealink T46U"
- Quantity: 1
- Term: 36 months
- Escalation: 10%
- Finance Amount: R50,000

### Expected Prices:
```
Cost:         R2,000  (base cost - not shown to anyone)
Manager Cost: R2,500  (shown to admin/manager)
User Cost:    R3,000  (shown to regular users)
```

### Expected Factors (36 months, 10%, R50k range):
```
Cost Factor:    0.02800  (base - not used)
Manager Factor: 0.03200  (used by admin/manager) ✅
User Factor:    0.03500  (used by regular users)
```

### Expected Results:
```
ADMIN/MANAGER:
- Hardware Total: R2,500
- Factor Used: 0.03200
- Hardware Rental: R2,500 × 0.03200 = R80.00/month

USER:
- Hardware Total: R3,000
- Factor Used: 0.03500
- Hardware Rental: R3,000 × 0.03500 = R105.00/month
```

---

## Common Issues to Check

### Issue 1: Admin using cost factors
**Symptom**: Admin's factor is too low (matches cost factor)
**Cause**: Bug in `getFactorForDeal()` function
**Status**: ✅ FIXED

### Issue 2: Admin seeing user prices
**Symptom**: Admin sees high prices (same as users)
**Cause**: Bug in `getItemCost()` function
**Status**: ✅ Already correct

### Issue 3: Wrong role being used
**Symptom**: Calculations don't match expected role
**Cause**: User role not being passed correctly
**Status**: ✅ Already correct

---

## Testing Checklist

### Before Testing:
- [ ] Ensure you have admin, manager, and user accounts
- [ ] Ensure admin panel has different prices configured (cost, manager, user)
- [ ] Ensure factor sheet has different factors configured

### Test as Admin:
- [ ] Login as admin
- [ ] Create new deal
- [ ] Verify hardware prices are manager prices (not cost, not user)
- [ ] Verify factor used is manager factor (not cost, not user)
- [ ] Verify total costs use manager pricing throughout
- [ ] Save deal and verify it saves correctly

### Test as Manager:
- [ ] Login as manager
- [ ] Create new deal
- [ ] Verify hardware prices match admin prices
- [ ] Verify factor used matches admin factor
- [ ] Verify total costs match admin calculations
- [ ] Save deal and verify it saves correctly

### Test as User:
- [ ] Login as regular user
- [ ] Create new deal
- [ ] Verify hardware prices are higher than admin/manager
- [ ] Verify factor used is higher than admin/manager
- [ ] Verify total costs are higher than admin/manager
- [ ] Save deal and verify it saves correctly

### Cross-Check:
- [ ] Compare saved deals from admin vs user
- [ ] Verify admin deal has lower costs
- [ ] Verify user deal has higher costs
- [ ] Verify factors are different between roles

---

## If You Find Issues

### Report Format:
```
Role: [admin/manager/user]
Item: [hardware/connectivity/licensing/factor]
Expected: [what should happen]
Actual: [what actually happened]
Screenshot: [if possible]
```

### Where to Check:
1. Browser console (F12) - look for errors
2. Network tab - check API responses
3. localStorage - check auth-storage for user role
4. Admin panel - verify pricing is configured correctly

---

## Success Criteria

✅ **Test Passes If:**
- Admin uses manager pricing (not cost, not user)
- Manager uses manager pricing (same as admin)
- User uses user pricing (higher than admin/manager)
- All calculations are consistent with role
- Saved deals reflect correct pricing

❌ **Test Fails If:**
- Admin uses cost pricing (too low)
- Admin uses user pricing (too high)
- Manager sees different prices than admin
- Factors don't match expected role
- Calculations are inconsistent

---

**Status**: Ready for Testing
**Priority**: 🔴 CRITICAL
**Estimated Time**: 15-20 minutes

---

*Test this immediately after the fix is deployed*
*Verify all three roles work correctly*
