'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCalculatorStore } from '@/store/calculator';
import { useAuthStore } from '@/store/auth';
import { useConfigStore } from '@/store/config';
import { formatCurrency, getFactorForDeal } from '@/lib/utils';
import { TotalCosts } from '@/lib/types';
import { ChevronLeft, Download, FileText, Printer } from 'lucide-react';
import PDFGenerator from '../pdf/PDFGenerator';

interface TotalCostsSectionProps {
  onPrev: () => void;
}

export default function TotalCostsSection({ onPrev }: TotalCostsSectionProps) {
  const { calculateTotalCosts, dealDetails, saveDeal, updateDealDetails } = useCalculatorStore();
  const { user } = useAuthStore();
  const { scales, factors } = useConfigStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editableTotalGrossProfit, setEditableTotalGrossProfit] = useState<number | null>(null);
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
  const calculateTotalsWithCustomGrossProfit = useCallback((customGrossProfit?: number | null): TotalCosts => {
    const baseTotals = calculateTotalCosts();
    
    if (customGrossProfit !== null && customGrossProfit !== undefined) {
      // Recalculate with custom gross profit
      const extensionCount = baseTotals.extensionCount;
      const hardwareTotal = baseTotals.hardwareTotal;
      const hardwareInstallTotal = baseTotals.hardwareInstallTotal;
      const settlementAmount = baseTotals.settlementAmount;
      const connectivityCost = baseTotals.connectivityCost;
      const licensingCost = baseTotals.licensingCost;
      
      // Calculate extension cost
      const extensionCost = extensionCount * (scales?.additional_costs?.cost_per_point || 0);
      
      // Calculate finance fee based on hardware + installation (for fee calculation only)
      const feeCalculationAmount = hardwareTotal + hardwareInstallTotal;
      let financeFee = 0;
      if (scales?.finance_fee) {
        for (const [range, fee] of Object.entries(scales.finance_fee)) {
          const [min, max] = range.split('-').map(Number);
          if (feeCalculationAmount >= (min || 0) && feeCalculationAmount <= (max || Infinity)) {
            financeFee = fee;
            break;
          }
        }
      }
      
      // Calculate finance amount with custom gross profit
      const financeAmount = hardwareTotal + extensionCost + hardwareInstallTotal + customGrossProfit + financeFee + settlementAmount;
      
      // Get factor for financing
      const factorUsed = factors ? 
        getFactorForDeal(factors, dealDetails.term, dealDetails.escalation, financeAmount) : 0;
      
      // Calculate final totals
      const totalPayout = financeAmount;
      const hardwareRental = financeAmount * factorUsed;
      const totalMRC = hardwareRental + connectivityCost + licensingCost;
      const totalExVat = totalMRC;
      const totalIncVat = totalExVat * 1.15; // 15% VAT

      return {
        extensionCount,
        hardwareTotal,
        hardwareInstallTotal,
        totalGrossProfit: customGrossProfit,
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
    }
    
    return baseTotals;
  }, [calculateTotalCosts, scales, factors, dealDetails]);

  // Calculate totals when component mounts or dependencies change
  useEffect(() => {
    const calculatedTotals = calculateTotalsWithCustomGrossProfit(editableTotalGrossProfit);
    setTotals(calculatedTotals);
  }, [calculateTotalsWithCustomGrossProfit, editableTotalGrossProfit, dealDetails]);

  const handleGenerateProposal = () => {
    // TODO: Implement proposal generation
    alert('Proposal generation will be implemented soon');
  };

  const handleGenerateDealPack = () => {
    // TODO: Implement deal pack generation
    alert('Deal pack generation will be implemented soon');
  };

  const handleSaveDeal = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
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
  };

  const handleGrossProfitChange = (value: number) => {
    setEditableTotalGrossProfit(value);
  };

  const handleResetGrossProfit = () => {
    setEditableTotalGrossProfit(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold gradient-text mb-2">
          Total Costs Summary
        </h2>
        <p className="text-gray-600">
          Complete cost breakdown for this deal
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hardware & Installation */}
        <div className="card">
          <div className="border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900">Hardware & Installation</h3>
          </div>
          <div className="p-4">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 text-sm text-gray-600">Number of Extensions</td>
                  <td className="py-2 text-sm text-gray-900 text-right font-medium">{totals.extensionCount}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-600">Hardware Total</td>
                  <td className="py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.hardwareTotal)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-600">Extension Cost ({totals.extensionCount} × {formatCurrency(scales?.additional_costs?.cost_per_point || 0)})</td>
                  <td className="py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.extensionCount * (scales?.additional_costs?.cost_per_point || 0))}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-600">Installation Cost</td>
                  <td className="py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.hardwareInstallTotal)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-600">Total Gross Profit</td>
                  <td className="py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.totalGrossProfit)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-600">Finance Fee</td>
                  <td className="py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.financeFee)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-600">Settlement Amount</td>
                  <td className="py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.settlementAmount)}</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-2 text-sm text-gray-900">Finance Amount</td>
                  <td className="py-2 text-sm text-gray-900 text-right">{formatCurrency(totals.financeAmount)}</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-2 text-sm text-gray-900">Total Payout</td>
                  <td className="py-2 text-sm text-gray-900 text-right">{formatCurrency(totals.totalPayout)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-600">Factor Used</td>
                  <td className="py-2 text-sm text-gray-900 text-right font-medium">{totals.factorUsed.toFixed(5)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Recurring Costs */}
        <div className="card">
          <div className="border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Recurring Costs</h3>
          </div>
          <div className="p-4">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 text-sm text-gray-600">Hardware Rental</td>
                  <td className="py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.hardwareRental)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-600">Connectivity Cost</td>
                  <td className="py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.connectivityCost)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-600">Licensing Cost</td>
                  <td className="py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.licensingCost)}</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-2 text-sm text-gray-900">Total MRC</td>
                  <td className="py-2 text-sm text-gray-900 text-right">{formatCurrency(totals.totalMRC)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-600">Total Ex VAT</td>
                  <td className="py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(totals.totalExVat)}</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-2 text-sm text-gray-900">Total Inc VAT (15%)</td>
                  <td className="py-2 text-sm text-gray-900 text-right">{formatCurrency(totals.totalIncVat)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Total Gross Profit Card */}
      <div className="card">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900">Total Gross Profit</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Adjust the total gross profit for this deal</p>
              <p className="text-xs text-gray-500">
                Default value based on scales configuration: {formatCurrency(calculateTotalCosts().totalGrossProfit)}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={editableTotalGrossProfit !== null ? editableTotalGrossProfit : totals.totalGrossProfit}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  handleGrossProfitChange(value);
                }}
                className="w-32 text-right border border-gray-300 rounded px-3 py-2 text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={formatCurrency(totals.totalGrossProfit)}
                step="0.01"
                min="0"
              />
              <button
                onClick={handleResetGrossProfit}
                className="btn btn-outline btn-sm"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Information */}
      <div className="card">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900">Deal Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="font-semibold text-gray-700 text-sm">Customer Name</p>
              <p className="text-gray-900">{dealDetails.customerName || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 text-sm">Term</p>
              <p className="text-gray-900">{dealDetails.term} months</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 text-sm">Escalation</p>
              <p className="text-gray-900">{dealDetails.escalation}%</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 text-sm">Distance to Install</p>
              <p className="text-gray-900">{dealDetails.distanceToInstall} km</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 text-sm">Settlement Amount</p>
              <p className="text-gray-900">{formatCurrency(dealDetails.settlement)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-blue-900">Pricing Applied</h4>
            <p className="text-blue-700 text-sm">
              {user?.role === 'admin' || user?.role === 'manager' ? 'Manager Pricing' : 'User Pricing'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-700 text-sm">User Role: {user?.role}</p>
            <p className="text-blue-700 text-sm">Factor: {totals.factorUsed.toFixed(5)}</p>
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg ${
          saveMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* Navigation and Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <button 
          onClick={onPrev}
          className="btn btn-outline flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back: Settlement</span>
        </button>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleSaveDeal}
            disabled={isSaving}
            className="btn btn-success flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Deal'}</span>
          </button>
          <PDFGenerator />
          <button
            onClick={handleGenerateProposal}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Proposal</span>
          </button>
          <button
            onClick={handleGenerateDealPack}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Generate Deal Pack</span>
          </button>
        </div>
      </div>
    </div>
  );
} 