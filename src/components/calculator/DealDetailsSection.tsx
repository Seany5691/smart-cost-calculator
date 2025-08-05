'use client';

import { useState, useEffect } from 'react';
import { useCalculatorStore } from '@/store/calculator';
import { formatCurrency } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface DealDetailsSectionProps {
  onNext: () => void;
}

export default function DealDetailsSection({ onNext }: DealDetailsSectionProps) {
  const { dealDetails, updateDealDetails } = useCalculatorStore();
  const [formData, setFormData] = useState({
    customerName: dealDetails.customerName,
    term: dealDetails.term,
    escalation: dealDetails.escalation,
    distanceToInstall: dealDetails.distanceToInstall,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      customerName: dealDetails.customerName,
      term: dealDetails.term,
      escalation: dealDetails.escalation,
      distanceToInstall: dealDetails.distanceToInstall,
    });
  }, [dealDetails]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (formData.term <= 0) {
      newErrors.term = 'Term must be greater than 0';
    }

    if (formData.escalation < 0) {
      newErrors.escalation = 'Escalation cannot be negative';
    }

    if (formData.distanceToInstall < 0) {
      newErrors.distanceToInstall = 'Distance cannot be negative';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    updateDealDetails(formData);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold gradient-text mb-2">
          Deal Details
        </h2>
        <p className="text-gray-600">
          Enter the basic information for this deal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Name */}
        <div className="form-group">
          <label htmlFor="customerName" className="label">
            Customer Name *
          </label>
          <input
            id="customerName"
            type="text"
            value={formData.customerName}
            onChange={(e) => handleInputChange('customerName', e.target.value)}
            className={`input ${errors.customerName ? 'border-red-500' : ''}`}
            placeholder="Enter customer name"
          />
          {errors.customerName && (
            <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
          )}
        </div>

        {/* Term */}
        <div className="form-group">
          <label htmlFor="term" className="label">
            Contract Term (months) *
          </label>
          <select
            id="term"
            value={formData.term}
            onChange={(e) => handleInputChange('term', parseInt(e.target.value))}
            className={`input ${errors.term ? 'border-red-500' : ''}`}
          >
            <option value={12}>12 Months</option>
            <option value={24}>24 Months</option>
            <option value={36}>36 Months</option>
            <option value={48}>48 Months</option>
            <option value={60}>60 Months</option>
          </select>
          {errors.term && (
            <p className="text-red-500 text-sm mt-1">{errors.term}</p>
          )}
        </div>

        {/* Escalation */}
        <div className="form-group">
          <label htmlFor="escalation" className="label">
            Escalation Rate (%)
          </label>
          <select
            id="escalation"
            value={formData.escalation}
            onChange={(e) => handleInputChange('escalation', parseInt(e.target.value))}
            className={`input ${errors.escalation ? 'border-red-500' : ''}`}
          >
            <option value={0}>0%</option>
            <option value={5}>5%</option>
            <option value={10}>10%</option>
            <option value={15}>15%</option>
          </select>
          {errors.escalation && (
            <p className="text-red-500 text-sm mt-1">{errors.escalation}</p>
          )}
        </div>

        {/* Distance to Install */}
        <div className="form-group">
          <label htmlFor="distanceToInstall" className="label">
            Distance to Install (km)
          </label>
          <input
            id="distanceToInstall"
            type="number"
            value={formData.distanceToInstall}
            onChange={(e) => handleInputChange('distanceToInstall', parseFloat(e.target.value) || 0)}
            className={`input ${errors.distanceToInstall ? 'border-red-500' : ''}`}
            placeholder="Enter distance in kilometers"
            min="0"
            step="0.1"
          />
          {errors.distanceToInstall && (
            <p className="text-red-500 text-sm mt-1">{errors.distanceToInstall}</p>
          )}
        </div>


      </div>

      {/* Summary Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Deal Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-blue-700">Customer</p>
            <p className="font-medium">{formData.customerName || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-blue-700">Term</p>
            <p className="font-medium">{formData.term} months</p>
          </div>
          <div>
            <p className="text-blue-700">Escalation</p>
            <p className="font-medium">{formData.escalation}%</p>
          </div>
          <div>
            <p className="text-blue-700">Distance</p>
            <p className="font-medium">{formData.distanceToInstall} km</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="btn btn-primary flex items-center space-x-2"
        >
          <span>Next: Hardware Selection</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
} 