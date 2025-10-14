# Fixed calculateCostAnalysis Function

## The Problem
The current `calculateCostAnalysis()` function in `admin/deals/page.tsx` is recalculating everything from scratch instead of using the stored totals from the deal.

## The Solution
Use the stored `totals` object (which was calculated using the EXACT same logic as Total Costs section) and only calculate cost pricing separately.

## Fixed Function

```typescript
// Calculate comprehensive cost analysis for a deal
const calculateCostAnalysis = (deal: Deal) => {
  // STEP 1: Use stored totals as source of truth for customer pricing
  const totals = deal.totals as any || {};
  const sections = deal.sections || [];
  const scales = deal.scales as any || {};
  const factors = deal.factors as any || {};
  
  // Helper function to get item cost
  const getItemCostByRole = (item: any, role: 'cost' | 'manager' | 'user'): number => {
    if (role === 'cost') {
      return Number(item.cost) || 0;
    } else if (role === 'manager') {
      return Number(item.managerCost) || Number(item.cost) || 0;
    } else {
      return Number(item.userCost) || Number(item.cost) || 0;
    }
  };
  
  // STEP 2: Calculate COST PRICING for hardware
  let hardwareCostTotal = 0;
  let hardwareItems: any[] = [];
  
  const hardwareSection = sections.find((s: any) => s.id === 'hardware');
  if (hardwareSection?.items) {
    hardwareSection.items.forEach((item: any) => {
      if (item && item.quantity > 0) {
        const costPrice = getItemCostByRole(item, 'cost');
        const totalCost = costPrice * item.quantity;
        hardwareCostTotal += totalCost;
        
        hardwareItems.push({
          name: item.name,
          quantity: item.quantity,
          costPrice: costPrice,
          totalCost: totalCost
        });
      }
    });
  }
  
  // STEP 3: Calculate COST PRICING for installation
  const extensionCount = Number(totals.extensionCount) || 0;
  const distanceToInstall = Number(deal.distanceToInstall) || 0;
  
  // Installation sliding scale (cost pricing)
  let installationSlidingScaleCost = 0;
  if (scales?.installation?.cost) {
    const installationData = scales.installation.cost;
    
    if (typeof installationData === 'object') {
      if (extensionCount >= 0 && extensionCount <= 4 && installationData['0-4']) {
        installationSlidingScaleCost = Number(installationData['0-4']) || 0;
      } else if (extensionCount >= 5 && extensionCount <= 8 && installationData['5-8']) {
        installationSlidingScaleCost = Number(installationData['5-8']) || 0;
      } else if (extensionCount >= 9 && extensionCount <= 16 && installationData['9-16']) {
        installationSlidingScaleCost = Number(installationData['9-16']) || 0;
      } else if (extensionCount >= 17 && extensionCount <= 32 && installationData['17-32']) {
        installationSlidingScaleCost = Number(installationData['17-32']) || 0;
      } else if (extensionCount >= 33 && installationData['33+']) {
        installationSlidingScaleCost = Number(installationData['33+']) || 0;
      }
    } else {
      installationSlidingScaleCost = Number(installationData) || 0;
    }
  }
  
  // Extension and fuel costs (cost pricing)
  const extensionCostPerPoint = Number(scales?.additional_costs?.cost_per_point) || 0;
  const fuelCostPerKm = Number(scales?.additional_costs?.cost_per_kilometer) || 0;
  const extensionCostTotal = extensionCount * extensionCostPerPoint;
  const fuelCostTotal = distanceToInstall * fuelCostPerKm;
  const installationCostTotal = installationSlidingScaleCost + extensionCostTotal + fuelCostTotal;
  
  // STEP 4: Calculate COST PRICING for monthly recurring
  let connectivityCostTotal = 0;
  let connectivityItems: any[] = [];
  
  const connectivitySection = sections.find((s: any) => s.id === 'connectivity');
  if (connectivitySection?.items) {
    connectivitySection.items.forEach((item: any) => {
      if (item && item.quantity > 0) {
        const costPrice = getItemCostByRole(item, 'cost');
        const totalCost = costPrice * item.quantity;
        connectivityCostTotal += totalCost;
        
        connectivityItems.push({
          name: item.name,
          quantity: item.quantity,
          costPrice: costPrice,
          totalCost: totalCost
        });
      }
    });
  }
  
  let licensingCostTotal = 0;
  let licensingItems: any[] = [];
  
  const licensingSection = sections.find((s: any) => s.id === 'licensing');
  if (licensingSection?.items) {
    licensingSection.items.forEach((item: any) => {
      if (item && item.quantity > 0) {
        const costPrice = getItemCostByRole(item, 'cost');
        const totalCost = costPrice * item.quantity;
        licensingCostTotal += totalCost;
        
        licensingItems.push({
          name: item.name,
          quantity: item.quantity,
          costPrice: costPrice,
          totalCost: totalCost
        });
      }
    });
  }
  
  // STEP 5: Calculate hardware rental cost (using cost factor)
  // We need to calculate what the hardware rental COSTS us, not what customer pays
  const financeAmountCost = hardwareCostTotal + installationCostTotal;
  const costFactor = getFactorForDeal(factors, deal.term, deal.escalation, financeAmountCost, 'admin');
  const hardwareRentalCost = financeAmountCost * costFactor;
  
  // STEP 6: Calculate ACTUAL GP
  // Hardware Deal GP = Total Payout - Hardware Costs - Installation Costs - Settlement
  const hardwareActualGP = Number(totals.totalPayout) - hardwareCostTotal - installationCostTotal - Number(totals.settlementAmount);
  const hardwareActualGPPercentage = Number(totals.totalPayout) > 0 
    ? (hardwareActualGP / Number(totals.totalPayout)) * 100 
    : 0;
  
  // Monthly GP = Total MRC - (Connectivity Costs + Licensing Costs + Hardware Rental Cost)
  const monthlyActualGP = Number(totals.totalMRC) - (connectivityCostTotal + licensingCostTotal + hardwareRentalCost);
  const monthlyActualGPPercentage = Number(totals.totalMRC) > 0 
    ? (monthlyActualGP / Number(totals.totalMRC)) * 100 
    : 0;
  
  // STEP 7: Return comprehensive analysis
  return {
    // Hardware Deal (One-Time)
    hardware: {
      // Customer Pricing (from stored totals - SOURCE OF TRUTH)
      customerPricing: {
        hardwareTotal: Number(totals.hardwareTotal) || 0,
        installationCost: Number(totals.hardwareInstallTotal) || 0,
        grossProfit: Number(totals.totalGrossProfit) || 0,
        financeFee: Number(totals.financeFee) || 0,
        settlement: Number(totals.settlementAmount) || 0,
        totalPayout: Number(totals.totalPayout) || 0
      },
      // Cost Pricing (calculated separately)
      costPricing: {
        hardwareTotal: hardwareCostTotal,
        installationCost: installationCostTotal,
        totalCosts: hardwareCostTotal + installationCostTotal
      },
      // Actual GP
      actualGP: hardwareActualGP,
      actualGPPercentage: hardwareActualGPPercentage,
      // Items breakdown
      items: hardwareItems
    },
    
    // Monthly Recurring (Separate Business)
    monthly: {
      // Customer Pricing (from stored totals - SOURCE OF TRUTH)
      customerPricing: {
        hardwareRental: Number(totals.hardwareRental) || 0,
        connectivity: Number(totals.connectivityCost) || 0,
        licensing: Number(totals.licensingCost) || 0,
        totalMRC: Number(totals.totalMRC) || 0
      },
      // Cost Pricing (calculated separately)
      costPricing: {
        hardwareRental: hardwareRentalCost,
        connectivity: connectivityCostTotal,
        licensing: licensingCostTotal,
        totalCosts: hardwareRentalCost + connectivityCostTotal + licensingCostTotal
      },
      // Actual GP
      actualGP: monthlyActualGP,
      actualGPPercentage: monthlyActualGPPercentage,
      // Items breakdown
      connectivityItems: connectivityItems,
      licensingItems: licensingItems
    },
    
    // Deal Info
    dealInfo: {
      customerName: deal.customerName || 'Unknown Customer',
      username: deal.username || 'Unknown User',
      userRole: deal.userRole || 'user',
      term: Number(deal.term) || 0,
      escalation: Number(deal.escalation) || 0,
      settlement: Number(deal.settlement) || 0,
      extensionCount: extensionCount,
      distanceToInstall: distanceToInstall,
      factorUsed: Number(totals.factorUsed) || 0,
      costFactor: costFactor
    },
    
    // VAT Info (from stored totals)
    vat: {
      totalExVat: Number(totals.totalExVat) || 0,
      totalIncVat: Number(totals.totalIncVat) || 0,
      vatAmount: (Number(totals.totalIncVat) || 0) - (Number(totals.totalExVat) || 0)
    }
  };
};
```

## Key Changes

### 1. Use Stored Totals ✅
```typescript
const totals = deal.totals as any || {};
// Use totals.hardwareTotal, totals.totalPayout, etc.
```

### 2. Only Calculate Cost Pricing ✅
```typescript
// Calculate hardware cost using cost pricing
const costPrice = getItemCostByRole(item, 'cost');
```

### 3. Separate Hardware from Monthly ✅
```typescript
hardware: {
  customerPricing: { ... },  // From stored totals
  costPricing: { ... },       // Calculated separately
  actualGP: ...
},
monthly: {
  customerPricing: { ... },  // From stored totals
  costPricing: { ... },       // Calculated separately
  actualGP: ...
}
```

### 4. Correct GP Calculation ✅
```typescript
// Hardware GP = Payout - Costs - Settlement
const hardwareActualGP = totals.totalPayout - hardwareCostTotal - installationCostTotal - totals.settlementAmount;

// Monthly GP = MRC - Monthly Costs
const monthlyActualGP = totals.totalMRC - (connectivityCostTotal + licensingCostTotal + hardwareRentalCost);
```

## Benefits

✅ **Matches Total Costs exactly** - Uses stored totals
✅ **Accurate cost analysis** - Calculates cost pricing separately
✅ **Proper separation** - Hardware deal vs monthly costs
✅ **Correct GP** - Uses proper formula
✅ **No recalculation errors** - Trusts the source of truth

## Next Steps

1. Replace the current `calculateCostAnalysis()` function in `admin/deals/page.tsx`
2. Update the PDF generation to use this new structure
3. Test with real deals to verify accuracy
4. Validate that numbers match across all views
