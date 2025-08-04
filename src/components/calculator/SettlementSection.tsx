'use client';

import { useState, useEffect } from 'react';
import { useCalculatorStore } from '@/store/calculator';
import { formatCurrency, calculateSettlement } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';

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
    updateDealDetails({ settlement: settlementAmount });
  };

  // Toggle settlement on/off
  const toggleSettlement = () => {
    setHasSettlement(!hasSettlement);
    if (!hasSettlement) {
      // If turning settlement back on, don't change anything
    } else {
      // If turning settlement off, set settlement to 0
      setTotalSettlement(0);
      updateDealDetails({ settlement: 0 });
    }
  };

  // Handle save and navigate to next section
  const handleSave = () => {
    if (!hasSettlement) {
      // If settlement is disabled, just set to 0 and proceed
      updateDealDetails({ settlement: 0 });
      onNext();
    } else if (totalSettlement > 0) {
      // If settlement is enabled and calculated
      updateDealDetails({ settlement: totalSettlement });
      onNext();
    } else {
      // If settlement is enabled but not calculated
      alert('Please calculate settlement amount first');
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold gradient-text mb-2">
          Settlement Calculator
        </h2>
        <p className="text-gray-600">
          Calculate settlement amounts for existing rental contracts
        </p>
      </div>

      {/* Settlement Toggle */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-lg font-medium text-gray-900">Include Settlement</span>
        <button
          onClick={toggleSettlement}
          className="flex items-center space-x-2 text-2xl text-blue-600 focus:outline-none"
        >
          {hasSettlement ? <ToggleRight /> : <ToggleLeft />}
        </button>
      </div>

      {/* Settlement Form */}
      <div className={`space-y-6 ${hasSettlement ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Date */}
          <div className="form-group">
            <label className="label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
              required
            />
          </div>

          {/* Rental Type */}
          <div className="form-group">
            <label className="label">Rental Type</label>
            <select
              value={rentalType}
              onChange={(e) => setRentalType(e.target.value as 'starting' | 'current')}
              className="input"
            >
              <option value="starting">Starting Rental</option>
              <option value="current">Current Rental</option>
            </select>
          </div>

          {/* Rental Amount */}
          <div className="form-group">
            <label className="label">Rental Amount (R)</label>
            <input
              type="number"
              value={rentalAmount}
              onChange={(e) => setRentalAmount(e.target.value)}
              className="input"
              placeholder="Enter rental amount"
              min="0"
              step="0.01"
            />
          </div>

          {/* Escalation Rate */}
          <div className="form-group">
            <label className="label">Escalation Rate</label>
            <select
              value={escalationRate}
              onChange={(e) => setEscalationRate(e.target.value)}
              className="input"
            >
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="15">15%</option>
            </select>
          </div>

          {/* Rental Term */}
          <div className="form-group">
            <label className="label">Rental Term</label>
            <select
              value={rentalTerm}
              onChange={(e) => setRentalTerm(e.target.value)}
              className="input"
            >
              <option value="12">12 Months</option>
              <option value="24">24 Months</option>
              <option value="36">36 Months</option>
              <option value="48">48 Months</option>
              <option value="60">60 Months</option>
            </select>
          </div>

          {/* Calculate Button */}
          <div className="form-group flex items-end">
            <button
              onClick={handleCalculateSettlement}
              disabled={!startDate || !rentalAmount || !hasSettlement}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Calculate Settlement
            </button>
          </div>
        </div>
      </div>

      {/* Settlement Breakdown */}
      {calculations.length > 0 && hasSettlement && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Settlement Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Months Remaining
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calculations.map(({ year, amount, monthsRemaining, isCompleted, startDate, endDate }) => (
                  <tr key={year} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Year {year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(startDate)} - {formatDate(endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {isCompleted ? 'Completed' : 'Pending'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {monthsRemaining}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(amount)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-50">
                  <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm">
                    Total Settlement
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {formatCurrency(totalSettlement)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Total Settlement Display */}
      {hasSettlement && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-orange-900">
              Total Settlement Amount:
            </span>
            <span className="text-2xl font-bold text-orange-900">
              {formatCurrency(totalSettlement)}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button 
          onClick={onPrev}
          className="btn btn-outline flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back: Licensing</span>
        </button>
        <button
          onClick={handleSave}
          disabled={hasSettlement && totalSettlement <= 0}
          className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Next: Total Costs</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
} 