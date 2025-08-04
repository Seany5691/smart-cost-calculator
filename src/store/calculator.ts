import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CalculatorState, Section, Item, DealDetails, TotalCosts } from '@/lib/types';
import { getFactorForDeal, getItemCost } from '@/lib/utils';
import { useConfigStore } from './config';

const DEFAULT_DEAL_DETAILS: DealDetails = {
  customerName: '',
  term: 36,
  escalation: 0,
  distanceToInstall: 0,
  additionalGrossProfit: 0,
  settlement: 0
};

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      sections: [],
      dealDetails: DEFAULT_DEAL_DETAILS,

      initializeStore: async () => {
        const configStore = useConfigStore.getState();
        const sections = [
          { id: 'hardware', name: 'Hardware', items: configStore.hardware },
          { id: 'connectivity', name: 'Connectivity', items: configStore.connectivity },
          { id: 'licensing', name: 'Licensing', items: configStore.licensing }
        ];
        set({ sections });
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

      saveDeal: async () => {
        try {
          const { sections, dealDetails } = get();
          const configStore = useConfigStore.getState();
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
            factors: configStore.factors,
            scales: configStore.scales,
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
        const { sections, dealDetails } = get();
        const configStore = useConfigStore.getState();
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
        for (const [band, cost] of Object.entries(configStore.scales.installation)) {
          const [min, max] = band.split('-').map(Number);
          if (extensionCount >= (min || 0) && extensionCount <= (max || Infinity)) {
            installationCost = cost;
            break;
          }
        }

        // Get gross profit based on extension count
        let baseGrossProfit = 0;
        for (const [band, profit] of Object.entries(configStore.scales.gross_profit)) {
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
        const distanceCost = dealDetails.distanceToInstall * configStore.scales.additional_costs.cost_per_kilometer;
        const pointCost = extensionCount * configStore.scales.additional_costs.cost_per_point;
        const additionalCosts = distanceCost + pointCost;

        // Calculate totals
        const additionalProfit = dealDetails.additionalGrossProfit;
        const totalGrossProfit = baseGrossProfit + additionalProfit;
        const settlementAmount = dealDetails.settlement;
        const extensionCost = extensionCount * configStore.scales.additional_costs.cost_per_point;
        
        // Calculate finance fee based on hardware + installation (for fee calculation only)
        const feeCalculationAmount = hardwareTotal + installationCost;
        let financeFee = 0;
        for (const [range, fee] of Object.entries(configStore.scales.finance_fee)) {
          const [min, max] = range.split('-').map(Number);
          if (feeCalculationAmount >= (min || 0) && feeCalculationAmount <= (max || Infinity)) {
            financeFee = fee;
            break;
          }
        }
        
        // Calculate finance amount and total payout the same way
        const financeAmount = hardwareTotal + extensionCost + installationCost + totalGrossProfit + financeFee + settlementAmount;
        
        // Get factor for financing (using the new finance amount)
        const factorUsed = getFactorForDeal(configStore.factors, dealDetails.term, dealDetails.escalation, financeAmount);
        
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
      }),
    }
  )
); 