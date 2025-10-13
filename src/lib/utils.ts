import { Item } from "./types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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
  factors: any,
  term: number,
  escalation: number,
  financeAmount: number,
  userRole: 'admin' | 'manager' | 'user' = 'user'
): number => {
  const termKey = `${term}_months`;
  const escalationKey = `${escalation}%`;
  
  // Check if this is the enhanced factor structure
  if (factors.userFactors || factors.managerFactors || factors.cost) {
    // Enhanced structure - select the appropriate factor table based on user role
    let factorTable: any;
    
    // CRITICAL: Admin and Manager should BOTH use managerFactors
    if (userRole === 'admin' || userRole === 'manager') {
      factorTable = factors.managerFactors;
    } else {
      // Regular users use userFactors
      factorTable = factors.userFactors;
    }
    
    // Fallback to legacy structure if role-specific factors don't exist
    if (!factorTable || !factorTable[termKey] || !factorTable[termKey][escalationKey]) {
      // Try the old structure as fallback
      if (factors[termKey] && factors[termKey][escalationKey]) {
        factorTable = factors;
      } else {
        return 0;
      }
    }
    
    const factorData = factorTable[termKey][escalationKey];
    const ranges = Object.keys(factorData).map(range => {
      const [min, max] = range.split('-').map(Number);
      return { min, max: isNaN(max) ? Infinity : max, factor: factorData[range] };
    });

    // Find the appropriate range for the finance amount
    const range = ranges.find(r => 
      financeAmount >= (r.min || 0) && financeAmount <= (r.max || Infinity)
    );

    return range ? range.factor : 0;
  } else {
    // Legacy structure - use the old logic
    if (!factors[termKey] || !factors[termKey][escalationKey]) {
      return 0;
    }

    const factorData = factors[termKey][escalationKey];
    const ranges = Object.keys(factorData).map(range => {
      const [min, max] = range.split('-').map(Number);
      return { min, max: isNaN(max) ? Infinity : max, factor: factorData[range] };
    });

    // Find the appropriate range for the finance amount
    const range = ranges.find(r => 
      financeAmount >= (r.min || 0) && financeAmount <= (r.max || Infinity)
    );

    return range ? range.factor : 0;
  }
};

export const getDistanceBandCost = (
  scales: any,
  distance: number
): number => {
  // Calculate distance cost based on kilometers
  return distance * (scales.additional_costs?.cost_per_kilometer || 0);
};

export const getItemCost = (
  item: Item,
  userRole: 'admin' | 'manager' | 'user' = 'user'
): number => {
  let selectedCost: number;
  
  // Admin and Manager should use managerCost
  if ((userRole === 'admin' || userRole === 'manager') && item.managerCost !== undefined && item.managerCost !== null) {
    selectedCost = item.managerCost;
  } 
  // User should use userCost
  else if (userRole === 'user' && item.userCost !== undefined && item.userCost !== null) {
    selectedCost = item.userCost;
  } 
  // Fallback to regular cost if specific pricing is not available
  else {
    selectedCost = item.cost;
  }
  
  // Ensure we return a number, not a string
  const finalCost = typeof selectedCost === 'string' ? parseFloat(selectedCost) : selectedCost;
  
  if (isNaN(finalCost)) {
    console.error(`[ERROR] Invalid cost for item ${item.name}: ${selectedCost}`);
    return 0;
  }
  
  return finalCost;
}; 