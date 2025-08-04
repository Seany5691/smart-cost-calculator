import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CalculatorState, Section, Item, DealDetails, FactorData, Scales, TotalCosts } from '@/lib/types';
import { getFactorForDeal, getDistanceBandCost, getItemCost } from '@/lib/utils';

// Default data (fallback)
const DEFAULT_HARDWARE: Item[] = [
  { id: "hw1", name: "Desk Phone B&W", cost: 1054, quantity: 0, isExtension: true },
  { id: "hw2", name: "Desk Phone Colour", cost: 1378, quantity: 0, isExtension: true },
  { id: "hw3", name: "Switchboard Colour", cost: 2207, quantity: 0, isExtension: true },
  { id: "hw4", name: "Cordless Phone", cost: 2420, quantity: 0, isExtension: true },
  { id: "hw5", name: "Bluetooth Headset Mono", cost: 1996, quantity: 0, isExtension: false },
  { id: "hw6", name: "Bluetooth Headset Dual", cost: 2340, quantity: 0, isExtension: false },
  { id: "hw7", name: "Corded Headset Dual", cost: 1467, quantity: 0, isExtension: false },
  { id: "hw8", name: "Cellphone", cost: 7500, quantity: 0, isExtension: false },
  { id: "hw9", name: "4 Port PoE", cost: 644, quantity: 0, isExtension: false },
  { id: "hw10", name: "8 Port PoE", cost: 813, quantity: 0, isExtension: false },
  { id: "hw11", name: "16 Port PoE", cost: 2282, quantity: 0, isExtension: false },
  { id: "hw12", name: "8 Port Managed PoE", cost: 1657, quantity: 0, isExtension: false },
  { id: "hw13", name: "16 Port Managed PoE", cost: 2994, quantity: 0, isExtension: false },
  { id: "hw14", name: "Access Point Gigabit", cost: 1350, quantity: 0, isExtension: false },
  { id: "hw15", name: "Cloud Router WAN2", cost: 1613, quantity: 0, isExtension: false },
  { id: "hw16", name: "5G/LTE Router", cost: 1800, quantity: 0, isExtension: false },
  { id: "hw17", name: "PC", cost: 9000, quantity: 0, isExtension: false },
  { id: "hw18", name: "A4 Copier", cost: 17000, quantity: 0, isExtension: false },
  { id: "hw19", name: "Server Cabinet", cost: 1466.25, quantity: 0, isExtension: false },
  { id: "hw20", name: "Additional Mobile App", cost: 0, quantity: 0, isExtension: false },
  { id: "hw21", name: "Additional App on Own Device", cost: 0, quantity: 0, isExtension: false },
  { id: "hw22", name: "Number Porting Per Number", cost: 200, quantity: 0, isExtension: false }
];

const DEFAULT_CONNECTIVITY: Item[] = [
  { id: "conn1", name: "LTE", cost: 599, quantity: 0 },
  { id: "conn2", name: "Fibre", cost: 599, quantity: 0 },
  { id: "conn3", name: "Melon Sim Card", cost: 350, quantity: 0 }
];

const DEFAULT_LICENSING: Item[] = [
  { id: "lic1", name: "Premium License", cost: 90, quantity: 0 },
  { id: "lic2", name: "Service Level Agreement (0 - 5 users)", cost: 299, quantity: 0 },
  { id: "lic3", name: "Service Level Agreement (6 - 10 users)", cost: 399, quantity: 0 },
  { id: "lic4", name: "Service Level Agreement (11 users or more)", cost: 499, quantity: 0 }
];

const DEFAULT_SECTIONS: Section[] = [
  {
    id: 'hardware',
    name: 'Hardware',
    items: DEFAULT_HARDWARE
  },
  {
    id: 'connectivity',
    name: 'Connectivity',
    items: DEFAULT_CONNECTIVITY
  },
  {
    id: 'licensing',
    name: 'Licensing',
    items: DEFAULT_LICENSING
  }
];

const DEFAULT_DEAL_DETAILS: DealDetails = {
  customerName: '',
  term: 36,
  escalation: 0,
  distanceToInstall: 0,
  additionalGrossProfit: 0,
  settlement: 0
};

const DEFAULT_FACTORS: FactorData = {
  "36_months": {
    "0%": {
      "0-20000": 0.03814,
      "20001-50000": 0.03814,
      "50001-100000": 0.03755,
      "100000+": 0.03707
    },
    "10%": {
      "0-20000": 0.03511,
      "20001-50000": 0.03511,
      "50001-100000": 0.03454,
      "100000+": 0.03409
    },
    "15%": {
      "0-20000": 0.04133,
      "20001-50000": 0.04003,
      "50001-100000": 0.03883,
      "100000+": 0.03803
    }
  },
  "48_months": {
    "0%": {
      "0-20000": 0.03155,
      "20001-50000": 0.03155,
      "50001-100000": 0.03093,
      "100000+": 0.03043
    },
    "10%": {
      "0-20000": 0.02805,
      "20001-50000": 0.02805,
      "50001-100000": 0.02741,
      "100000+": 0.02694
    },
    "15%": {
      "0-20000": 0.03375,
      "20001-50000": 0.03245,
      "50001-100000": 0.03125,
      "100000+": 0.03045
    }
  },
  "60_months": {
    "0%": {
      "0-20000": 0.02772,
      "20001-50000": 0.02772,
      "50001-100000": 0.02705,
      "100000+": 0.02658
    },
    "10%": {
      "0-20000": 0.02327,
      "20001-50000": 0.02327,
      "50001-100000": 0.02315,
      "100000+": 0.02267
    },
    "15%": {
      "0-20000": 0.02937,
      "20001-50000": 0.02807,
      "50001-100000": 0.02687,
      "100000+": 0.02607
    }
  }
};

const DEFAULT_SCALES: Scales = {
  installation: {
    "0-4": 3500,
    "5-8": 3500,
    "9-16": 7000,
    "17-32": 10500,
    "33+": 15000
  },
  finance_fee: {
    "0-20000": 1800,
    "20001-50000": 1800,
    "50001-100000": 2800,
    "100001+": 3800
  },
  gross_profit: {
    "0-4": 10000,
    "5-8": 150000,
    "9-16": 20000,
    "17-32": 25000,
    "33+": 30000
  },
  additional_costs: {
    cost_per_kilometer: 1.5,
    cost_per_point: 750
  }
};

// Helper function to load data from JSON files
const loadConfigData = async () => {
  try {
    const [hardwareRes, connectivityRes, licensingRes, factorsRes, scalesRes] = await Promise.all([
      fetch('/api/config/hardware'),
      fetch('/api/config/connectivity'),
      fetch('/api/config/licensing'),
      fetch('/api/config/factors'),
      fetch('/api/config/scales')
    ]);

    const hardware = hardwareRes.ok ? await hardwareRes.json() : DEFAULT_HARDWARE;
    const connectivity = connectivityRes.ok ? await connectivityRes.json() : DEFAULT_CONNECTIVITY;
    const licensing = licensingRes.ok ? await licensingRes.json() : DEFAULT_LICENSING;
    const factors = factorsRes.ok ? await factorsRes.json() : DEFAULT_FACTORS;
    const scales = scalesRes.ok ? await scalesRes.json() : DEFAULT_SCALES;

    return {
      sections: [
        { id: 'hardware', name: 'Hardware', items: hardware },
        { id: 'connectivity', name: 'Connectivity', items: connectivity },
        { id: 'licensing', name: 'Licensing', items: licensing }
      ],
      factors,
      scales
    };
  } catch (error) {
    console.error('Error loading config data:', error);
    return {
      sections: DEFAULT_SECTIONS,
      factors: DEFAULT_FACTORS,
      scales: DEFAULT_SCALES
    };
  }
};

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      sections: DEFAULT_SECTIONS,
      dealDetails: DEFAULT_DEAL_DETAILS,
      factors: DEFAULT_FACTORS,
      scales: DEFAULT_SCALES,

      initializeStore: async () => {
        const configData = await loadConfigData();
        set({
          sections: configData.sections,
          dealDetails: DEFAULT_DEAL_DETAILS,
          factors: configData.factors,
          scales: configData.scales
        });
      },

      updateSectionItem: (sectionId: string, itemId: string, updates: Partial<Item>) => {
        set((state) => ({
          sections: state.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  items: section.items.map((item) =>
                    item.id === itemId ? { ...item, ...updates } : item
                  ),
                }
              : section
          ),
        }));
      },

      addTemporaryItem: (sectionId: string, item: Item) => {
        set((state) => ({
          sections: state.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  items: [...section.items, item],
                }
              : section
          ),
        }));
      },

      updateDealDetails: (updates: Partial<DealDetails>) => {
        set((state) => ({
          dealDetails: { ...state.dealDetails, ...updates },
        }));
      },

      updateFactors: async (factors: FactorData) => {
        try {
          const response = await fetch('/api/config/factors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(factors)
          });
          
          if (response.ok) {
            set({ factors });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error updating factors:', error);
          return false;
        }
      },

      updateScales: async (scales: Scales) => {
        try {
          const response = await fetch('/api/config/scales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scales)
          });
          
          if (response.ok) {
            set({ scales });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error updating scales:', error);
          return false;
        }
      },

      updateHardware: async (items: Item[]) => {
        try {
          const response = await fetch('/api/config/hardware', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
          });
          
          if (response.ok) {
            set((state) => ({
              sections: state.sections.map((section) =>
                section.id === 'hardware'
                  ? { ...section, items }
                  : section
              ),
            }));
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error updating hardware:', error);
          return false;
        }
      },

      updateLicensing: async (items: Item[]) => {
        try {
          const response = await fetch('/api/config/licensing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
          });
          
          if (response.ok) {
            set((state) => ({
              sections: state.sections.map((section) =>
                section.id === 'licensing'
                  ? { ...section, items }
                  : section
              ),
            }));
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error updating licensing:', error);
          return false;
        }
      },

      updateConnectivity: async (items: Item[]) => {
        try {
          const response = await fetch('/api/config/connectivity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
          });
          
          if (response.ok) {
            set((state) => ({
              sections: state.sections.map((section) =>
                section.id === 'connectivity'
                  ? { ...section, items }
                  : section
              ),
            }));
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error updating connectivity:', error);
          return false;
        }
      },

      saveDeal: async () => {
        try {
          const { sections, dealDetails, factors, scales } = get();
          const { useAuthStore } = await import('@/store/auth');
          const { user } = useAuthStore.getState();
          
          if (!user) {
            return false;
          }

          const totals = get().calculateTotalCosts();
          
          const deal = {
            id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            username: user.username,
            userRole: user.role,
            customerName: dealDetails.customerName,
            term: dealDetails.term,
            escalation: dealDetails.escalation,
            distanceToInstall: dealDetails.distanceToInstall,
            additionalGrossProfit: dealDetails.additionalGrossProfit,
            settlement: dealDetails.settlement,
            sections,
            factors,
            scales,
            totals,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const response = await fetch('/api/deals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deal)
          });

          return response.ok;
        } catch (error) {
          console.error('Error saving deal:', error);
          return false;
        }
      },

      calculateTotalCosts: (): TotalCosts => {
        const { sections, dealDetails, factors, scales } = get();
        // Get user from auth store without require
        const user = typeof window !== 'undefined' ? 
          JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.user : null;

        // Get hardware section
        const hardwareSection = sections.find(s => s.id === 'hardware');
        const connectivitySection = sections.find(s => s.id === 'connectivity');
        const licensingSection = sections.find(s => s.id === 'licensing');

        if (!hardwareSection || !connectivitySection || !licensingSection) {
          return {
            extensionCount: 0,
            hardwareTotal: 0,
            hardwareInstallTotal: 0,
            baseGrossProfit: 0,
            additionalProfit: 0,
            totalGrossProfit: 0,
            financeFee: 0,
            settlementAmount: 0,
            financeAmount: 0,
            totalPayout: 0,
            hardwareRental: 0,
            connectivityCost: 0,
            licensingCost: 0,
            totalMRC: 0,
            totalExVat: 0,
            totalIncVat: 0,
            factorUsed: 0
          };
        }

        // Calculate extension count
        const extensionCount = hardwareSection.items
          .filter(item => item.isExtension)
          .reduce((sum, item) => sum + item.quantity, 0);

        // Calculate hardware total
        const hardwareTotal = hardwareSection.items
          .reduce((sum, item) => sum + (getItemCost(item, user?.role || 'user') * item.quantity), 0);

        // Get installation cost based on extension count
        let installationCost = 0;
        for (const [band, cost] of Object.entries(scales.installation)) {
          const [min, max] = band.split('-').map(Number);
          if (extensionCount >= (min || 0) && extensionCount <= (max || Infinity)) {
            installationCost = cost;
            break;
          }
        }

        // Get gross profit based on extension count
        let baseGrossProfit = 0;
        for (const [band, profit] of Object.entries(scales.gross_profit)) {
          const [min, max] = band.split('-').map(Number);
          if (extensionCount >= (min || 0) && extensionCount <= (max || Infinity)) {
            baseGrossProfit = profit;
            break;
          }
        }

        // Calculate connectivity cost
        const connectivityCost = connectivitySection.items
          .reduce((sum, item) => sum + (getItemCost(item, user?.role || 'user') * item.quantity), 0);

        // Calculate licensing cost
        const licensingCost = licensingSection.items
          .reduce((sum, item) => sum + (getItemCost(item, user?.role || 'user') * item.quantity), 0);

        // Calculate additional costs
        const distanceCost = dealDetails.distanceToInstall * scales.additional_costs.cost_per_kilometer;
        const pointCost = extensionCount * scales.additional_costs.cost_per_point;
        const additionalCosts = distanceCost + pointCost;

        // Calculate totals
        const additionalProfit = dealDetails.additionalGrossProfit;
        const totalGrossProfit = baseGrossProfit + additionalProfit;
        const settlementAmount = dealDetails.settlement;
        const extensionCost = extensionCount * scales.additional_costs.cost_per_point;
        
        // Calculate finance fee based on hardware + installation (for fee calculation only)
        const feeCalculationAmount = hardwareTotal + installationCost;
        let financeFee = 0;
        for (const [range, fee] of Object.entries(scales.finance_fee)) {
          const [min, max] = range.split('-').map(Number);
          if (feeCalculationAmount >= (min || 0) && feeCalculationAmount <= (max || Infinity)) {
            financeFee = fee;
            break;
          }
        }
        
        // Calculate finance amount and total payout the same way
        const financeAmount = hardwareTotal + extensionCost + installationCost + totalGrossProfit + financeFee + settlementAmount;
        
        // Get factor for financing (using the new finance amount)
        const factorUsed = getFactorForDeal(factors, dealDetails.term, dealDetails.escalation, financeAmount);
        
        // Total payout equals finance amount
        const totalPayout = financeAmount;
        const hardwareRental = financeAmount * factorUsed;
        const totalMRC = hardwareRental + connectivityCost + licensingCost;
        const totalExVat = totalMRC;
        const totalIncVat = totalExVat * 1.15; // 15% VAT

        return {
          extensionCount,
          hardwareTotal,
          hardwareInstallTotal: installationCost,
          baseGrossProfit,
          additionalProfit,
          totalGrossProfit,
          financeFee,
          settlementAmount,
          financeAmount,
          totalPayout,
          hardwareRental,
          connectivityCost,
          licensingCost,
          totalMRC,
          totalExVat,
          totalIncVat,
          factorUsed
        };
      },
    }),
    {
      name: 'calculator-storage',
      partialize: (state) => ({
        sections: state.sections,
        dealDetails: state.dealDetails,
        factors: state.factors,
        scales: state.scales,
      }),
    }
  )
); 