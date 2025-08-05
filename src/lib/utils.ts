export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const generateId = (): string => {
  // Generate a proper UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const calculateSettlement = (
  startDate: Date,
  rentalAmount: number,
  escalationRate: number,
  rentalTerm: number,
  rentalType: 'starting' | 'current' = 'starting'
): { calculations: Record<string, unknown>[]; totalSettlement: number } => {
  const currentDate = new Date();
  const escalation = escalationRate / 100;
  const term = rentalTerm;

  let currentRental = rentalAmount;
  const calculations: Record<string, unknown>[] = [];
  let totalSettlementAmount = 0;

  // If using current rental, we need to de-escalate to get the starting rental
  if (rentalType === 'current') {
    // Calculate completed years
    const completedYears = Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    for (let i = 0; i < completedYears; i++) {
      currentRental = currentRental / (1 + escalation);
    }
  }

  // Calculate year boundaries and remaining months
  for (let year = 1; year <= Math.ceil(term / 12); year++) {
    const yearStartDate = new Date(startDate);
    yearStartDate.setFullYear(startDate.getFullYear() + year - 1);
    const yearEndDate = new Date(startDate);
    yearEndDate.setFullYear(startDate.getFullYear() + year);

    if (currentDate >= yearEndDate) {
      // Year is completely in the past
      calculations.push({
        year,
        amount: 0,
        monthsRemaining: 0,
        isCompleted: true,
        startDate: yearStartDate,
        endDate: yearEndDate
      });
      currentRental *= (1 + escalation);
    } else if (currentDate < yearStartDate) {
      // Year is completely in the future
      const monthsInYear = 12;
      const yearAmount = currentRental * monthsInYear;
      totalSettlementAmount += yearAmount;

      calculations.push({
        year,
        amount: yearAmount,
        monthsRemaining: monthsInYear,
        isCompleted: false,
        startDate: yearStartDate,
        endDate: yearEndDate
      });
      currentRental *= (1 + escalation);
    } else {
      // Year is partially complete
      const monthsRemaining = Math.ceil(
        (yearEndDate.getTime() - currentDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
      );
      const yearAmount = currentRental * monthsRemaining;
      totalSettlementAmount += yearAmount;

      calculations.push({
        year,
        amount: yearAmount,
        monthsRemaining,
        isCompleted: false,
        startDate: yearStartDate,
        endDate: yearEndDate
      });
      currentRental *= (1 + escalation);
    }
  }

  return { calculations, totalSettlement: totalSettlementAmount };
};

export const getFactorForDeal = (
  factors: Record<string, unknown>,
  term: number,
  escalation: number,
  financeAmount: number
): number => {
  const termKey = `${term}_months`;
  const escalationKey = `${escalation}%`;
  
  if (!factors[termKey] || !factors[termKey][escalationKey]) {
    return 0;
  }

  const factorData = factors[termKey][escalationKey];
  const ranges = Object.keys(factorData).map(range => {
    const [min, max] = range.split('-').map(Number);
    return { min, max, factor: factorData[range] };
  });

  // Find the appropriate range for the finance amount
  const range = ranges.find(r => 
    financeAmount >= (r.min || 0) && financeAmount <= (r.max || Infinity)
  );

  return range ? range.factor : 0;
};

export const getDistanceBandCost = (
  scales: Record<string, unknown>,
  distance: number,
  userRole: 'admin' | 'manager' | 'user' = 'user'
): number => {
  // Calculate distance cost based on kilometers
  return distance * scales.additional_costs.cost_per_kilometer;
};

export const getItemCost = (
  item: Item,
  userRole: 'admin' | 'manager' | 'user' = 'user'
): number => {
  let selectedCost: number;
  let costType: string;
  
  // Admin and Manager should use managerCost
  if ((userRole === 'admin' || userRole === 'manager') && item.managerCost !== undefined && item.managerCost !== null) {
    selectedCost = item.managerCost;
    costType = 'managerCost';
  } 
  // User should use userCost
  else if (userRole === 'user' && item.userCost !== undefined && item.userCost !== null) {
    selectedCost = item.userCost;
    costType = 'userCost';
  } 
  // Fallback to regular cost if specific pricing is not available
  else {
    selectedCost = item.cost;
    costType = 'cost';
  }
  
  // Debug logging for pricing selection
  console.log(`Item: ${item.name}, Role: ${userRole}, Using: ${costType} = ${selectedCost}`);
  
  return selectedCost;
}; 