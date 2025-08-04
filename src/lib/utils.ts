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
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
  item: Record<string, unknown>,
  userRole: 'admin' | 'manager' | 'user' = 'user'
): number => {
  if (userRole === 'manager' && item.managerCost !== undefined) {
    return item.managerCost;
  } else if (userRole === 'user' && item.userCost !== undefined) {
    return item.userCost;
  } else {
    return item.cost;
  }
}; 