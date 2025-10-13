'use client';

import { useState, useEffect } from 'react';
import { useCalculatorStore } from '@/store/calculator';
import { formatCurrency, calculateSettlement } from '@/lib/utils';
import { ToggleLeft, ToggleRight, Calculator, Calendar, TrendingUp, Clock } from 'lucide-react';
import { GlassCard } from '@/components/ui/modern/GlassCard';
import { FloatingInput } from '@/components/ui/modern/FloatingInput';
import { MagneticButton } from '@/components/ui/modern/MagneticButton';

interface SettlementSectionProps {
  onNext: () => void;
  onPrev: () => void;
}

export default function SettlementSection({ onNext, onPrev }: SettlementSectionProps) {
  const { dealDetails, updateDealDetails } = useCalculatorStore();
  const [hasSettlement, setHasSettlement] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [rentalAmount, setRentalAmount] = useState('');
  const [escalationRate, setEscalationRate] = useState('0');
  const [rentalTerm, setRentalTerm] = useState('60');
  const [rentalType, setRentalType] = useState<'starting' | 'current'>('starting');
  const [calculations, setCalculations] = useState<any[]>([]);
  const [totalSettlement, setTotalSettlement] = useState(0);
  const [manualSettlement, setManualSettlement] = useState(dealDetails.settlement?.toString() || '0');

  // Initialize settlement values from deal details
  useEffect(() => {
    if (dealDetails.settlement !== undefined) {
      setTotalSettlement(dealDetails.settlement);
      setManualSettlement(dealDetails.settlement.toString());
    }
    if (dealDetails.settlementStartDate) {
      setStartDate(dealDetails.settlementStartDate);
    }
    if (dealDetails.settlementRentalAmount) {
      setRentalAmount(dealDetails.settlementRentalAmount.toString());
    }
    if (dealDetails.settlementEscalationRate !== undefined) {
      setEscalationRate(dealDetails.settlementEscalationRate.toString());
    }
    if (dealDetails.settlementRentalType) {
      setRentalType(dealDetails.settlementRentalType);
    }
  }, [dealDetails]);

  // Calculate settlement amount
  const handleCalculateSettlement = () => {
    if (!startDate || !rentalAmount) {
      alert('Please enter valid start date and rental amount');
      return;
    }

    const start = new Date(startDate);
    const rental = parseFloat(rentalAmount);
    const escalation = parseFloat(escalationRate);
    const term = parseInt(rentalTerm);

    const { calculations: newCalculations, totalSettlement: settlementAmount } = calculateSettlement(
      start,
      rental,
      escalation,
      term,
      rentalType
    );

    setCalculations(newCalculations);
    setTotalSettlement(settlementAmount);
    updateDealDetails({ 
      settlement: settlementAmount,
      settlementStartDate: startDate,
      settlementRentalAmount: rental,
      settlementEscalationRate: escalation,
      settlementRentalType: rentalType
    });
  };

  // Toggle settlement on/off
  const toggleSettlement = () => {
    setHasSettlement(!hasSettlement);
    if (!hasSettlement) {
      // If turning settlement back on, use calculated settlement if available
      if (totalSettlement > 0) {
        updateDealDetails({ settlement: totalSettlement });
      }
    } else {
      // If turning settlement off, use manual settlement amount
      const manualAmount = parseFloat(manualSettlement) || 0;
      updateDealDetails({ settlement: manualAmount });
    }
  };

  // Handle manual settlement input change
  const handleManualSettlementChange = (value: string) => {
    // Validate numeric input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setManualSettlement(value);
      const numericValue = parseFloat(value) || 0;
      updateDealDetails({ settlement: numericValue });
    }
  };

  // Handle save and navigate to next section
  const handleSave = () => {
    if (hasSettlement) {
      // If settlement calculator is enabled, use calculated settlement
      if (totalSettlement > 0) {
        updateDealDetails({ settlement: totalSettlement });
        onNext();
      } else {
        alert('Please calculate settlement amount first');
      }
    } else {
      // If settlement calculator is disabled, use manual settlement amount
      const manualAmount = parseFloat(manualSettlement) || 0;
      updateDealDetails({ settlement: manualAmount });
      onNext();
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2 animate-slide-down">
          Settlement Calculator
        </h2>
        <p className="text-gray-700 animate-slide-up">
          Calculate settlement amounts for existing rental contracts
        </p>
      </div>

      {/* Settlement Toggle */}
      <GlassCard className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-lg font-semibold text-gray-900">Settlement Calculator</span>
            <p className="text-sm text-gray-700 mt-1">
              {hasSettlement ? 'Use settlement calculator' : 'Enter manual settlement amount'}
            </p>
          </div>
          <MagneticButton
            onClick={toggleSettlement}
            variant={hasSettlement ? "primary" : "secondary"}
            className="flex items-center space-x-3"
          >
            <span className="text-sm font-medium">
              {hasSettlement ? 'Calculator ON' : 'Calculator OFF'}
            </span>
            <div className="text-2xl">
              {hasSettlement ? <ToggleRight /> : <ToggleLeft />}
            </div>
          </MagneticButton>
        </div>
      </GlassCard>

      {/* Manual Settlement Input - shown when calculator is OFF */}
      {!hasSettlement && (
        <GlassCard className="animate-slide-up">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Manual Settlement Amount
            </h3>
          </div>
          <div className="space-y-6">
            <FloatingInput
              label="Settlement Amount (R)"
              type="text"
              value={manualSettlement}
              onChange={(e) => handleManualSettlementChange(e.target.value)}
              placeholder="0.00"
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <p className="text-sm text-gray-700">
              Enter any settlement amount including 0. Only numeric values are allowed.
            </p>
            <div className="glass-effect p-4 rounded-xl border border-gray-200 bg-white/60">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Settlement Amount:</span>
                <span className="text-2xl font-bold gradient-text">
                  {formatCurrency(parseFloat(manualSettlement) || 0)}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Settlement Form */}
      <div className={`space-y-6 ${hasSettlement ? 'opacity-100' : 'hidden'}`}>
        <GlassCard className="animate-slide-up">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Settlement Details
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
              />
            </div>

            {/* Rental Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Rental Type
              </label>
              <select
                value={rentalType}
                onChange={(e) => setRentalType(e.target.value as 'starting' | 'current')}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-blue-400"
              >
                <option value="starting">Starting Rental</option>
                <option value="current">Current Rental</option>
              </select>
            </div>

            {/* Rental Amount */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Rental Amount (R)
              </label>
              <input
                type="number"
                value={rentalAmount}
                onChange={(e) => setRentalAmount(e.target.value)}
                placeholder="Enter rental amount"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                min="0"
                step="0.01"
              />
            </div>

            {/* Escalation Rate */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Escalation Rate
              </label>
              <select
                value={escalationRate}
                onChange={(e) => setEscalationRate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-blue-400"
              >
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="10">10%</option>
                <option value="15">15%</option>
              </select>
            </div>

            {/* Rental Term */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Rental Term
              </label>
              <select
                value={rentalTerm}
                onChange={(e) => setRentalTerm(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-blue-400"
              >
                <option value="12">12 Months</option>
                <option value="24">24 Months</option>
                <option value="36">36 Months</option>
                <option value="48">48 Months</option>
                <option value="60">60 Months</option>
              </select>
            </div>

            {/* Calculate Button */}
            <div className="flex items-end">
              <MagneticButton
                onClick={handleCalculateSettlement}
                disabled={!startDate || !rentalAmount || !hasSettlement}
                variant="primary"
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Calculate Settlement
              </MagneticButton>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Settlement Breakdown */}
      {calculations.length > 0 && hasSettlement && (
        <GlassCard className="animate-slide-up">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Settlement Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Months Remaining
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {calculations.map(({ year, amount, monthsRemaining, isCompleted, startDate, endDate }) => (
                  <tr key={year} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      Year {year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(startDate)} - {formatDate(endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isCompleted 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isCompleted ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                      {monthsRemaining}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(amount)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-100">
                  <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Total Settlement
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className="text-xl gradient-text font-bold">
                      {formatCurrency(totalSettlement)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Total Settlement Display */}
      <GlassCard className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 animate-glow">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              Total Settlement Amount
            </span>
            <p className="text-sm text-gray-700 mt-1">
              {hasSettlement ? 'From calculator' : 'Manual entry'}
            </p>
          </div>
          <span className="text-3xl font-bold gradient-text">
            {formatCurrency(hasSettlement ? totalSettlement : (parseFloat(manualSettlement) || 0))}
          </span>
        </div>
      </GlassCard>
    </div>
  );
} 