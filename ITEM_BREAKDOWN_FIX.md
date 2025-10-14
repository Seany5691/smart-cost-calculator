# ✅ Item Breakdown Fix - User/Manager Pricing

## Problem

The item breakdown tables were showing R0.00 for user/manager prices, even though the admin cost prices were displaying correctly. This meant the profit per item couldn't be calculated.

**Example of the issue**:
```
Item Breakdown:
Hardware Item 1:
- Qty: 5
- Admin Cost: R1,200 ✅
- User/Manager Price: R0.00 ❌
- Profit: R0.00 ❌
```

---

## Root Cause

When building the item breakdown arrays, we were only capturing the `costPrice` but not the `userManagerPrice` for each item:

```typescript
// BEFORE (Wrong)
const itemBreakdown = {
  name: item.name,
  quantity: itemQuantity,
  costPrice: itemCost,           // ✅ Admin cost
  totalCostPrice: costPrice      // ✅ Total admin cost
  // ❌ Missing userManagerPrice!
  // ❌ Missing totalUserManagerPrice!
};
```

---

## Solution

Added logic to extract the user/manager price for each item based on the deal's user role:

```typescript
// AFTER (Correct)
// Get user/manager price for this item
let itemUserManagerPrice = itemCost; // Default fallback
if (deal.userRole === 'manager' || deal.userRole === 'admin') {
  itemUserManagerPrice = Number(item.managerCost) || Number(item.cost) || 0;
} else {
  itemUserManagerPrice = Number(item.userCost) || Number(item.cost) || 0;
}
const userManagerPrice = itemUserManagerPrice * itemQuantity;

const itemBreakdown = {
  name: item.name || 'Unknown Item',
  quantity: itemQuantity,
  costPrice: itemCost,                      // ✅ Admin cost per unit
  userManagerPrice: itemUserManagerPrice,   // ✅ User/Manager price per unit
  totalCostPrice: costPrice,                // ✅ Total admin cost
  totalUserManagerPrice: userManagerPrice   // ✅ Total user/manager price
};
```

---

## How It Works

### 1. Determine User Role
```typescript
const userRole = deal.userRole || 'user';
```

### 2. Get Appropriate Pricing
For each item, we check the user role and get the corresponding price:

**For Manager/Admin**:
```typescript
itemUserManagerPrice = item.managerCost || item.cost
```

**For User**:
```typescript
itemUserManagerPrice = item.userCost || item.cost
```

### 3. Calculate Totals
```typescript
totalUserManagerPrice = itemUserManagerPrice × quantity
totalCostPrice = itemCost × quantity
```

### 4. Calculate Profit
```typescript
profit = totalUserManagerPrice - totalCostPrice
```

---

## Expected Results

### Hardware Breakdown
```
Yealink T54W:
- Qty: 5
- Admin Cost: R1,200.00 ✅
- Manager Price: R1,500.00 ✅
- Total Cost: R6,000.00 ✅
- Total Price: R7,500.00 ✅
- Profit: R1,500.00 ✅
```

### Connectivity Breakdown
```
SIP Trunk:
- Qty: 10
- Admin Cost: R120.00 ✅
- Manager Price: R200.00 ✅
- Total Cost: R1,200.00 ✅
- Total Price: R2,000.00 ✅
- Profit: R800.00 ✅
```

### Licensing Breakdown
```
3CX Standard:
- Qty: 10
- Admin Cost: R80.00 ✅
- Manager Price: R150.00 ✅
- Total Cost: R800.00 ✅
- Total Price: R1,500.00 ✅
- Profit: R700.00 ✅
```

---

## Data Structure

Each item in the breakdown now has:

```typescript
{
  name: string,              // Item name
  quantity: number,          // Quantity
  costPrice: number,         // Admin cost per unit
  userManagerPrice: number,  // User/Manager price per unit
  totalCostPrice: number,    // Total admin cost (costPrice × quantity)
  totalUserManagerPrice: number  // Total user/manager price (userManagerPrice × quantity)
}
```

---

## Display in UI

The breakdown tables can now show:

```jsx
<tr>
  <td>{item.name}</td>
  <td>{item.quantity}</td>
  <td>{formatCurrency(item.costPrice)}</td>
  <td>{formatCurrency(item.userManagerPrice)}</td>
  <td>{formatCurrency(item.totalCostPrice)}</td>
  <td>{formatCurrency(item.totalUserManagerPrice)}</td>
  <td className={profit >= 0 ? 'text-green' : 'text-red'}>
    {formatCurrency(item.totalUserManagerPrice - item.totalCostPrice)}
  </td>
</tr>
```

---

## Verification

To verify the fix is working:

1. **Create a deal** with hardware, connectivity, and licensing items
2. **Save the deal**
3. **Open in Admin Deals** → View Analysis
4. **Check Item Breakdown tables**:
   - ✅ Admin Cost shows correct values
   - ✅ User/Manager Price shows correct values (not R0.00)
   - ✅ Profit per item is calculated correctly
   - ✅ Section totals match

---

## Files Modified

**File**: `src/app/admin/deals/page.tsx`

**Section**: Item breakdown calculation (lines ~190-230)

**Changes**:
- Added logic to extract user/manager price based on role
- Added `userManagerPrice` to item breakdown object
- Added `totalUserManagerPrice` to item breakdown object

---

## Impact

This fix ensures that:
- ✅ All pricing levels are visible in the breakdown
- ✅ Profit per item can be calculated
- ✅ Section totals are accurate
- ✅ GP analysis is complete and transparent

---

**Status**: ✅ FIXED
**Date**: 2025-10-14
**Impact**: High - Affects item-level profitability analysis
**Testing**: Ready for verification
