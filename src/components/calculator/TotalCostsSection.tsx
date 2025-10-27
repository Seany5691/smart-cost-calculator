'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useCalculatorDealDetails, useCalculateTotalCosts, useSaveDeal, useCalculatorStore } from '@/store/calculator';
import { useAuthUser } from '@/store/auth';
import { useConfigScales, useConfigFactors } from '@/store/config';
import { formatCurrency, getFactorForDeal } from '@/lib/utils';
import { TotalCosts } from '@/lib/types';
import { Download, FileText, DollarSign, TrendingUp, Package, Zap, Calculator, Info } from 'lucide-react';
import PDFGenerator from '../pdf/PDFGenerator';
import ProposalModal, { ProposalData } from './ProposalModal';
import ProposalGenerator, { ProposalGeneratorRef } from './ProposalGenerator';
import { GlassCard } from '@/components/ui/modern/GlassCard';
import { MagneticButton } from '@/components/ui/modern/MagneticButton';

interface TotalCostsSectionProps {
  onPrev: () => void;
}

const TotalCostsSection = memo(function TotalCostsSection({ onPrev }: TotalCostsSectionProps) {
  const calculateTotalCosts = useCalculateTotalCosts();
  const saveDeal = useSaveDeal();
  const dealDetails = useCalculatorDealDetails();
  const user = useAuthUser();
  const scales = useConfigScales();
  const factors = useConfigFactors();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editableTotalGrossProfit, setEditableTotalGrossProfit] = useState<number | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const proposalGeneratorRef = useRef<ProposalGeneratorRef>(null);
  const [totals, setTotals] = useState<TotalCosts>({
    extensionCount: 0,
    hardwareTotal: 0,
    hardwareInstallTotal: 0,
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
    factorUsed: 0,
  });

  // Memoized calculation function that handles custom gross profit
  // Helper function to get cost from scales data based on user role (same as in calculator store)
  const getScaleCost = useCallback((scaleData: any, userRole: 'admin' | 'manager' | 'user' = 'user', fieldSuffix?: string): any => {
    if (!scaleData || typeof scaleData !== 'object') return 0;
    
    // For additional_costs, we need to handle different field names
    if (fieldSuffix) {
      const managerField = `manager_${fieldSuffix}`;
      const userField = `user_${fieldSuffix}`;
      const baseField = fieldSuffix;
      
      // Admin and Manager should use manager_* fields
      if ((userRole === 'admin' || userRole === 'manager') && scaleData[managerField] !== undefined && scaleData[managerField] !== null) {
        return typeof scaleData[managerField] === 'string' ? parseFloat(scaleData[managerField]) : scaleData[managerField];
      } 
      // User should use user_* fields
      else if (userRole === 'user' && scaleData[userField] !== undefined && scaleData[userField] !== null) {
        return typeof scaleData[userField] === 'string' ? parseFloat(scaleData[userField]) : scaleData[userField];
      } 
      // Fallback to base field
      else if (scaleData[baseField] !== undefined && scaleData[baseField] !== null) {
        return typeof scaleData[baseField] === 'string' ? parseFloat(scaleData[baseField]) : scaleData[baseField];
      }
    } else {
      // Standard cost structure - return the appropriate role-based data (could be object or number)
      // Admin and Manager should use managerCost
      if ((userRole === 'admin' || userRole === 'manager') && scaleData.managerCost !== undefined && scaleData.managerCost !== null) {
        return scaleData.managerCost;
      } 
      // User should use userCost
      else if (userRole === 'user' && scaleData.userCost !== undefined && scaleData.userCost !== null) {
        return scaleData.userCost;
      } 
      // Fallback to regular cost if specific pricing is not available
      else if (scaleData.cost !== undefined && scaleData.cost !== null) {
        return scaleData.cost;
      }
    }
    
    return 0;
  }, []);

  const calculateTotalsWithCustomGrossProfit = useCallback((customGrossProfit?: number | null): TotalCosts => {
    const baseTotals = calculateTotalCosts();
    
    if (customGrossProfit !== null && customGrossProfit !== undefined) {
      // Recalculate with custom gross profit
      const extensionCount = baseTotals.extensionCount;
      const hardwareTotal = baseTotals.hardwareTotal;
      const settlementAmount = baseTotals.settlementAmount;
      const connectivityCost = baseTotals.connectivityCost;
      const licensingCost = baseTotals.licensingCost;
      
      // Get user role for pricing
      const userRole = user?.role || 'user';
      
      // Calculate proper installation cost with sliding scale
      let installationSlidingScale = 0;
      if (scales?.installation) {
        const installationData = getScaleCost(scales.installation, userRole);
        
        if (typeof installationData === 'object' && installationData !== null) {
          if (extensionCount >= 0 && extensionCount <= 4 && installationData['0-4']) {
            installationSlidingScale = typeof installationData['0-4'] === 'string' ? parseFloat(installationData['0-4']) : installationData['0-4'];
          } else if (extensionCount >= 5 && extensionCount <= 8 && installationData['5-8']) {
            installationSlidingScale = typeof installationData['5-8'] === 'string' ? parseFloat(installationData['5-8']) : installationData['5-8'];
          } else if (extensionCount >= 9 && extensionCount <= 16 && installationData['9-16']) {
            installationSlidingScale = typeof installationData['9-16'] === 'string' ? parseFloat(installationData['9-16']) : installationData['9-16'];
          } else if (extensionCount >= 17 && extensionCount <= 32 && installationData['17-32']) {
            installationSlidingScale = typeof installationData['17-32'] === 'string' ? parseFloat(installationData['17-32']) : installationData['17-32'];
          } else if (extensionCount >= 33 && installationData['33+']) {
            installationSlidingScale = typeof installationData['33+'] === 'string' ? parseFloat(installationData['33+']) : installationData['33+'];
          }
        } else if (typeof installationData === 'number') {
          installationSlidingScale = installationData;
        }
      }
      
      // Calculate extension and fuel costs
      const costPerPoint = scales?.additional_costs ? getScaleCost(scales.additional_costs, userRole, 'cost_per_point') : 0;
      const costPerKilometer = scales?.additional_costs ? getScaleCost(scales.additional_costs, userRole, 'cost_per_kilometer') : 0;
      const extensionCost = extensionCount * (typeof costPerPoint === 'number' ? costPerPoint : 0);
      const fuelCost = dealDetails.distanceToInstall * (typeof costPerKilometer === 'number' ? costPerKilometer : 0);
      const totalInstallationCost = installationSlidingScale + extensionCost + fuelCost;
      
      // Calculate base total payout (without finance fee initially)
      let baseTotalPayout = hardwareTotal + totalInstallationCost + customGrossProfit + settlementAmount;
      
      // Iteratively calculate finance fee until it stabilizes
      let financeFee = 0;
      let previousFinanceFee = -1;
      let iterations = 0;
      const maxIterations = 10; // Prevent infinite loops
      
      while (financeFee !== previousFinanceFee && iterations < maxIterations) {
        previousFinanceFee = financeFee;
        const totalPayoutForFeeCalculation = baseTotalPayout + financeFee;
        
        // Calculate finance fee based on current total payout
        if (scales?.finance_fee) {
          const financeFeeBands = getScaleCost(scales.finance_fee, userRole);
          
          if (typeof financeFeeBands === 'object' && financeFeeBands !== null) {
            // Reset finance fee before checking
            financeFee = 0;
            
            // Use explicit range checking for finance fee bands
            if (totalPayoutForFeeCalculation >= 0 && totalPayoutForFeeCalculation <= 20000) {
              if (financeFeeBands['0-20000']) {
                financeFee = typeof financeFeeBands['0-20000'] === 'string' ? parseFloat(financeFeeBands['0-20000']) : financeFeeBands['0-20000'];
              }
            } else if (totalPayoutForFeeCalculation >= 20001 && totalPayoutForFeeCalculation <= 50000) {
              if (financeFeeBands['20001-50000']) {
                financeFee = typeof financeFeeBands['20001-50000'] === 'string' ? parseFloat(financeFeeBands['20001-50000']) : financeFeeBands['20001-50000'];
              }
            } else if (totalPayoutForFeeCalculation >= 50001 && totalPayoutForFeeCalculation <= 100000) {
              if (financeFeeBands['50001-100000']) {
                financeFee = typeof financeFeeBands['50001-100000'] === 'string' ? parseFloat(financeFeeBands['50001-100000']) : financeFeeBands['50001-100000'];
              }
            } else if (totalPayoutForFeeCalculation >= 100001) {
              if (financeFeeBands['100001+']) {
                financeFee = typeof financeFeeBands['100001+'] === 'string' ? parseFloat(financeFeeBands['100001+']) : financeFeeBands['100001+'];
              }
            }
          } else if (typeof financeFeeBands === 'number') {
            financeFee = financeFeeBands;
          }
        }
        
        iterations++;
      }
      
      // Calculate final totals with stabilized finance fee
      const safeFinanceFee = typeof financeFee === 'number' ? financeFee : 0;
      const financeAmount = baseTotalPayout + safeFinanceFee;
      
      // Get factor for financing
      const factorUsed = factors ? 
        getFactorForDeal(factors, dealDetails.term, dealDetails.escalation, financeAmount, userRole) : 0;
      
      // Calculate final totals
      const totalPayout = financeAmount;
      const hardwareRental = financeAmount * factorUsed;
      const totalMRC = hardwareRental + connectivityCost + licensingCost;
      const totalExVat = totalMRC;
      const totalIncVat = totalExVat * 1.15; // 15% VAT

      return {
        extensionCount,
        hardwareTotal,
        hardwareInstallTotal: totalInstallationCost,
        totalGrossProfit: customGrossProfit,
        financeFee: safeFinanceFee,
        settlementAmount,
        financeAmount: typeof financeAmount === 'number' ? financeAmount : 0,
        totalPayout: typeof totalPayout === 'number' ? totalPayout : 0,
        hardwareRental: typeof hardwareRental === 'number' ? hardwareRental : 0,
        connectivityCost,
        licensingCost,
        totalMRC: typeof totalMRC === 'number' ? totalMRC : 0,
        totalExVat: typeof totalExVat === 'number' ? totalExVat : 0,
        totalIncVat: typeof totalIncVat === 'number' ? totalIncVat : 0,
        factorUsed: typeof factorUsed === 'number' ? factorUsed : 0
      };
    }
    
    return baseTotals;
  }, [calculateTotalCosts, scales, factors, dealDetails, user?.role, getScaleCost]);

  // Initialize editable gross profit from deal details when component mounts or deal changes
  useEffect(() => {
    // Set the editable gross profit from deal details (could be null/undefined for default)
    setEditableTotalGrossProfit(dealDetails.customGrossProfit ?? null);
  }, [dealDetails.customGrossProfit]);

  // Calculate totals when component mounts or dependencies change
  useEffect(() => {
    const calculatedTotals = calculateTotalsWithCustomGrossProfit(editableTotalGrossProfit);
    setTotals(calculatedTotals);
  }, [calculateTotalsWithCustomGrossProfit, editableTotalGrossProfit, dealDetails]);

  const handleGenerateProposal = useCallback(async () => {
    // Auto-save the deal before generating proposal
    try {
      // Save the custom gross profit to deal details before saving
      const updateDealDetails = useCalculatorStore.getState().updateDealDetails;
      updateDealDetails({ customGrossProfit: editableTotalGrossProfit });
      
      await saveDeal();
    } catch (error) {
      console.error('Error auto-saving deal:', error);
    }
    
    setIsProposalModalOpen(true);
  }, [saveDeal, editableTotalGrossProfit]);

  const handleProposalGenerate = useCallback((proposalData: ProposalData) => {
    setIsProposalModalOpen(false);
    // Call the generateProposal function from ProposalGenerator with custom totals
    if (proposalGeneratorRef.current) {
      proposalGeneratorRef.current.generateProposal(proposalData, totals);
    }
  }, [totals]);

  const handleGenerateDealPack = useCallback(() => {
    alert('Deal pack generation will be implemented soon');
  }, []);

  const handleSaveDeal = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Save the custom gross profit to deal details before saving
      const updateDealDetails = useCalculatorStore.getState().updateDealDetails;
      updateDealDetails({ customGrossProfit: editableTotalGrossProfit });
      
      const success = await saveDeal();
      if (success) {
        setSaveMessage({ type: 'success', text: 'Deal saved successfully!' });
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save deal.' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setIsSaving(false);
    }
  }, [saveDeal, editableTotalGrossProfit]);

  const handleGrossProfitChange = useCallback((value: number) => {
    // Ensure the value is a valid number
    const safeValue = isNaN(value) ? 0 : value;
    setEditableTotalGrossProfit(safeValue);
  }, []);

  const handleResetGrossProfit = useCallback(() => {
    setEditableTotalGrossProfit(null);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold gradient-text mb-2 animate-slide-down">
          Total Costs Summary
        </h2>
        <p className="text-gray-700 animate-slide-up">
          Complete cost breakdown for this deal
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hardware & Installation */}
        <GlassCard className="animate-slide-up">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Hardware & Installation
            </h3>
          </div>
          <div>
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-100 bg-white">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-sm text-gray-700">Number of Extensions</td>
                  <td className="py-3 text-sm text-gray-900 text-right font-medium">{totals.extensionCount}</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-sm text-gray-700">Hardware Total</td>
                  <td className="py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.hardwareTotal)}</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-sm text-gray-700">Installation Cost</td>
                  <td className="py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency((() => {
                    // Get the correct installation sliding scale based on extension count
                    let slidingScaleCost = 0;
                    if (scales?.installation) {
                      const installationData = getScaleCost(scales.installation, user?.role || 'user');
                      
                      if (typeof installationData === 'object' && installationData !== null) {
                        // Parse the sliding scale bands with explicit range checking
                        const extensionCount = totals.extensionCount;
                        
                        // Define the ranges explicitly to ensure correct matching
                        if (extensionCount >= 0 && extensionCount <= 4 && installationData['0-4']) {
                          slidingScaleCost = typeof installationData['0-4'] === 'string' ? parseFloat(installationData['0-4']) : installationData['0-4'];
                        } else if (extensionCount >= 5 && extensionCount <= 8 && installationData['5-8']) {
                          slidingScaleCost = typeof installationData['5-8'] === 'string' ? parseFloat(installationData['5-8']) : installationData['5-8'];
                        } else if (extensionCount >= 9 && extensionCount <= 16 && installationData['9-16']) {
                          slidingScaleCost = typeof installationData['9-16'] === 'string' ? parseFloat(installationData['9-16']) : installationData['9-16'];
                        } else if (extensionCount >= 17 && extensionCount <= 32 && installationData['17-32']) {
                          slidingScaleCost = typeof installationData['17-32'] === 'string' ? parseFloat(installationData['17-32']) : installationData['17-32'];
                        } else if (extensionCount >= 33 && installationData['33+']) {
                          slidingScaleCost = typeof installationData['33+'] === 'string' ? parseFloat(installationData['33+']) : installationData['33+'];
                        }
                      } else if (typeof installationData === 'number') {
                        slidingScaleCost = installationData;
                      }
                    }
                    
                    // Calculate extension costs
                    const extensionCosts = totals.extensionCount * (scales?.additional_costs ? getScaleCost(scales.additional_costs, user?.role || 'user', 'cost_per_point') : 0);
                    
                    // Calculate fuel costs
                    const fuelCosts = dealDetails.distanceToInstall * (scales?.additional_costs ? getScaleCost(scales.additional_costs, user?.role || 'user', 'cost_per_kilometer') : 0);
                    
                    return slidingScaleCost + extensionCosts + fuelCosts;
                  })())}</td>
                </tr>
                <tr className="border-t-2 border-blue-200 bg-blue-50">
                  <td className="py-3 text-sm font-semibold text-blue-900">Subtotal (Hardware + Installation)</td>
                  <td className="py-3 text-sm text-blue-900 text-right font-semibold">{formatCurrency((() => {
                    // Get the correct installation sliding scale based on extension count
                    let slidingScaleCost = 0;
                    if (scales?.installation) {
                      const installationData = getScaleCost(scales.installation, user?.role || 'user');
                      
                      if (typeof installationData === 'object' && installationData !== null) {
                        // Parse the sliding scale bands with explicit range checking
                        const extensionCount = totals.extensionCount;
                        
                        // Define the ranges explicitly to ensure correct matching
                        if (extensionCount >= 0 && extensionCount <= 4 && installationData['0-4']) {
                          slidingScaleCost = typeof installationData['0-4'] === 'string' ? parseFloat(installationData['0-4']) : installationData['0-4'];
                        } else if (extensionCount >= 5 && extensionCount <= 8 && installationData['5-8']) {
                          slidingScaleCost = typeof installationData['5-8'] === 'string' ? parseFloat(installationData['5-8']) : installationData['5-8'];
                        } else if (extensionCount >= 9 && extensionCount <= 16 && installationData['9-16']) {
                          slidingScaleCost = typeof installationData['9-16'] === 'string' ? parseFloat(installationData['9-16']) : installationData['9-16'];
                        } else if (extensionCount >= 17 && extensionCount <= 32 && installationData['17-32']) {
                          slidingScaleCost = typeof installationData['17-32'] === 'string' ? parseFloat(installationData['17-32']) : installationData['17-32'];
                        } else if (extensionCount >= 33 && installationData['33+']) {
                          slidingScaleCost = typeof installationData['33+'] === 'string' ? parseFloat(installationData['33+']) : installationData['33+'];
                        }
                      } else if (typeof installationData === 'number') {
                        slidingScaleCost = installationData;
                      }
                    }
                    
                    // Calculate extension costs
                    const extensionCosts = totals.extensionCount * (scales?.additional_costs ? getScaleCost(scales.additional_costs, user?.role || 'user', 'cost_per_point') : 0);
                    
                    // Calculate fuel costs
                    const fuelCosts = dealDetails.distanceToInstall * (scales?.additional_costs ? getScaleCost(scales.additional_costs, user?.role || 'user', 'cost_per_kilometer') : 0);
                    
                    const totalInstallationCost = slidingScaleCost + extensionCosts + fuelCosts;
                    
                    return totals.hardwareTotal + totalInstallationCost;
                  })())}</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-sm text-gray-700">Total Gross Profit</td>
                  <td className="py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.totalGrossProfit)}</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-sm text-gray-700">Finance Fee</td>
                  <td className="py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.financeFee)}</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-sm text-gray-700">Settlement Amount</td>
                  <td className="py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.settlementAmount)}</td>
                </tr>
                <tr className="font-bold border-t-2 border-green-200 bg-green-50">
                  <td className="py-3 text-sm text-green-900">Total Payout</td>
                  <td className="py-3 text-sm text-green-900 text-right font-bold">{formatCurrency(totals.totalPayout)}</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-sm text-gray-700">Factor Used</td>
                  <td className="py-3 text-sm text-gray-900 text-right font-medium">{totals.factorUsed.toFixed(5)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Monthly Recurring Costs */}
        <GlassCard className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Monthly Recurring Costs
            </h3>
          </div>
          <div>
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-100 bg-white">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-sm text-gray-700">Hardware Rental</td>
                  <td className="py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.hardwareRental)}</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-sm text-gray-700">Connectivity Cost</td>
                  <td className="py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.connectivityCost)}</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-sm text-gray-700">Licensing Cost</td>
                  <td className="py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.licensingCost)}</td>
                </tr>
                <tr className="font-bold border-t-2 border-blue-200 bg-blue-50">
                  <td className="py-3 text-sm text-blue-900">Total MRC</td>
                  <td className="py-3 text-sm text-blue-900 text-right font-semibold">{formatCurrency(totals.totalMRC)}</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-sm text-gray-700">Total Ex VAT</td>
                  <td className="py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.totalExVat)}</td>
                </tr>
                <tr className="font-bold border-t-2 border-green-200 bg-green-50">
                  <td className="py-3 text-sm text-green-900">Total Inc VAT (15%)</td>
                  <td className="py-3 text-sm text-green-900 text-right font-bold">{formatCurrency(totals.totalIncVat)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Total Gross Profit Card */}
      <GlassCard className="animate-slide-up bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200" style={{ animationDelay: '0.2s' }}>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            Total Gross Profit
          </h3>
        </div>
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-700 mb-2">Adjust the total gross profit for this deal</p>
              <p className="text-xs text-gray-600">
                Default value based on scales configuration: {formatCurrency(typeof calculateTotalCosts().totalGrossProfit === 'number' ? calculateTotalCosts().totalGrossProfit : 0)}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={editableTotalGrossProfit !== null ? editableTotalGrossProfit : (typeof totals.totalGrossProfit === 'number' ? totals.totalGrossProfit : 0)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  handleGrossProfitChange(value);
                }}
                className="w-40 text-right bg-white border border-gray-300 rounded-xl px-4 py-3 text-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder={formatCurrency(typeof totals.totalGrossProfit === 'number' ? totals.totalGrossProfit : 0)}
                step="0.01"
                min="0"
              />
              <MagneticButton
                onClick={handleResetGrossProfit}
                variant="secondary"
                className="whitespace-nowrap"
              >
                Reset to Default
              </MagneticButton>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Deal Information */}
      <GlassCard className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-cyan-600" />
            Deal Information
          </h3>
        </div>
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-effect p-4 rounded-xl border border-gray-200 bg-white/60">
              <p className="font-semibold text-gray-600 text-xs uppercase tracking-wider mb-1">Customer Name</p>
              <p className="text-gray-900 text-lg font-medium">{dealDetails.customerName || 'N/A'}</p>
            </div>
            <div className="glass-effect p-4 rounded-xl border border-gray-200 bg-white/60">
              <p className="font-semibold text-gray-600 text-xs uppercase tracking-wider mb-1">Term</p>
              <p className="text-gray-900 text-lg font-medium">{dealDetails.term} months</p>
            </div>
            <div className="glass-effect p-4 rounded-xl border border-gray-200 bg-white/60">
              <p className="font-semibold text-gray-600 text-xs uppercase tracking-wider mb-1">Escalation</p>
              <p className="text-gray-900 text-lg font-medium">{dealDetails.escalation}%</p>
            </div>
            <div className="glass-effect p-4 rounded-xl border border-gray-200 bg-white/60">
              <p className="font-semibold text-gray-600 text-xs uppercase tracking-wider mb-1">Distance to Install</p>
              <p className="text-gray-900 text-lg font-medium">{dealDetails.distanceToInstall} km</p>
            </div>
            <div className="glass-effect p-4 rounded-xl border border-gray-200 bg-white/60">
              <p className="font-semibold text-gray-600 text-xs uppercase tracking-wider mb-1">Settlement Amount</p>
              <p className="text-gray-900 text-lg font-medium">{formatCurrency(dealDetails.settlement)}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Pricing Information */}
      <GlassCard className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 animate-glow" style={{ animationDelay: '0.4s' }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Pricing Applied
            </h4>
            <p className="text-blue-700 text-sm mt-1">
              {user?.role === 'admin' || user?.role === 'manager' ? 'Manager Pricing' : 'User Pricing'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-700 text-sm">User Role: <span className="text-gray-900 font-medium">{user?.role}</span></p>
            <p className="text-gray-700 text-sm">Factor: <span className="text-gray-900 font-medium">{totals.factorUsed.toFixed(5)}</span></p>
          </div>
        </div>
      </GlassCard>

      {/* Save Message */}
      {saveMessage && (
        <GlassCard className={`animate-slide-up ${
          saveMessage.type === 'success' 
            ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300' 
            : 'bg-gradient-to-r from-red-100 to-rose-100 border-red-300'
        }`}>
          <p className={saveMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {saveMessage.text}
          </p>
        </GlassCard>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <MagneticButton
            onClick={handleSaveDeal}
            disabled={isSaving}
            variant="success"
            className="flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>{isSaving ? 'Saving...' : 'Save Deal'}</span>
          </MagneticButton>
          {/* PDF Generator - pass custom totals */}
          <PDFGenerator customTotals={totals} />
          <MagneticButton
            onClick={handleGenerateProposal}
            variant="primary"
            className="flex items-center space-x-2"
          >
            <FileText className="w-5 h-5" />
            <span>Generate Proposal</span>
          </MagneticButton>
          <MagneticButton
            onClick={handleGenerateDealPack}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Generate Deal Pack</span>
          </MagneticButton>
      </div>

      {/* Proposal Modal */}
      <ProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        onGenerate={handleProposalGenerate}
      />

      {/* Proposal Generator */}
      <ProposalGenerator ref={proposalGeneratorRef} />
    </div>
  );
});

export default TotalCostsSection; 