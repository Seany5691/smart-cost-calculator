'use client';

import { useState, useEffect } from 'react';
import { useCalculatorStore } from '@/store/calculator';
import { FileText, Sparkles, Calendar, TrendingUp, MapPin, CheckCircle } from 'lucide-react';
import { GradientText, FloatingInput, GlassCard } from '@/components/ui/modern';


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
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Auto-save to store when form data changes
    updateDealDetails(newFormData);
    
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
    <div className="space-y-6 animate-fade-in-up">
      {/* Header with Icon */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg animate-float">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2">
          <GradientText animated gradient="blue-purple">
            Deal Details
          </GradientText>
        </h2>
        <p className="text-gray-600 flex items-center justify-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Enter the basic information for this deal</span>
          <Sparkles className="w-4 h-4 text-indigo-500" />
        </p>
      </div>

      {/* Form Container */}
      <GlassCard className="overflow-hidden" glow>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Customer Name */}
            <div className="relative">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <label htmlFor="customerName" className="text-sm font-medium text-gray-700">
                  Customer Name *
                </label>
              </div>
              <input
                id="customerName"
                type="text"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className={`w-full px-4 py-3 text-base border-2 rounded-xl shadow-sm focus:outline-none focus:ring-4 transition-all duration-200 bg-white ${
                  errors.customerName 
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50' 
                    : formData.customerName.trim().length > 0
                    ? 'border-green-300 focus:ring-green-500/20 focus:border-green-500 bg-green-50'
                    : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-400'
                }`}
                placeholder="Enter customer name"
              />
              {errors.customerName && (
                <p className="text-red-600 text-sm mt-1 flex items-center space-x-1 animate-slide-down">
                  <span>⚠️</span>
                  <span>{errors.customerName}</span>
                </p>
              )}
            </div>

            {/* Term */}
            <div className="relative">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <label htmlFor="term" className="text-sm font-medium text-gray-700">
                  Contract Term (months) *
                </label>
              </div>
              <select
                id="term"
                value={formData.term}
                onChange={(e) => handleInputChange('term', parseInt(e.target.value))}
                className={`w-full px-4 py-3 text-base border-2 rounded-xl shadow-sm focus:outline-none focus:ring-4 transition-all duration-200 bg-white cursor-pointer ${
                  errors.term 
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50' 
                    : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-400'
                }`}
              >
                <option value={12}>12 Months</option>
                <option value={24}>24 Months</option>
                <option value={36}>36 Months</option>
                <option value={48}>48 Months</option>
                <option value={60}>60 Months</option>
              </select>
              {errors.term && (
                <p className="text-red-600 text-sm mt-1 flex items-center space-x-1 animate-slide-down">
                  <span>⚠️</span>
                  <span>{errors.term}</span>
                </p>
              )}
            </div>

            {/* Escalation */}
            <div className="relative">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <label htmlFor="escalation" className="text-sm font-medium text-gray-700">
                  Escalation Rate (%)
                </label>
              </div>
              <select
                id="escalation"
                value={formData.escalation}
                onChange={(e) => handleInputChange('escalation', parseInt(e.target.value))}
                className={`w-full px-4 py-3 text-base border-2 rounded-xl shadow-sm focus:outline-none focus:ring-4 transition-all duration-200 bg-white cursor-pointer ${
                  errors.escalation 
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50' 
                    : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-400'
                }`}
              >
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={10}>10%</option>
                <option value={15}>15%</option>
              </select>
              {errors.escalation && (
                <p className="text-red-600 text-sm mt-1 flex items-center space-x-1 animate-slide-down">
                  <span>⚠️</span>
                  <span>{errors.escalation}</span>
                </p>
              )}
            </div>

            {/* Distance to Install */}
            <div className="relative">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-red-500" />
                <label htmlFor="distanceToInstall" className="text-sm font-medium text-gray-700">
                  Distance to Install (km)
                </label>
              </div>
              <input
                id="distanceToInstall"
                type="number"
                value={formData.distanceToInstall}
                onChange={(e) => handleInputChange('distanceToInstall', parseFloat(e.target.value) || 0)}
                className={`w-full px-4 py-3 text-base border-2 rounded-xl shadow-sm focus:outline-none focus:ring-4 transition-all duration-200 bg-white ${
                  errors.distanceToInstall 
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50' 
                    : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-400'
                }`}
                placeholder="Enter distance in km"
                min="0"
                step="0.1"
              />
              {errors.distanceToInstall && (
                <p className="text-red-600 text-sm mt-1 flex items-center space-x-1 animate-slide-down">
                  <span>⚠️</span>
                  <span>{errors.distanceToInstall}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Summary Card */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10"></div>
        <div className="relative p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="text-xl font-bold">
              <GradientText gradient="blue-purple">Deal Summary</GradientText>
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <p className="text-xs text-gray-500 mb-1">Customer</p>
              <p className="font-bold text-gray-800 truncate" title={formData.customerName || 'Not specified'}>
                {formData.customerName || 'Not specified'}
              </p>
            </div>
            <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <p className="text-xs text-gray-500 mb-1">Term</p>
              <p className="font-bold text-gray-800">{formData.term} months</p>
            </div>
            <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <p className="text-xs text-gray-500 mb-1">Escalation</p>
              <p className="font-bold text-gray-800">{formData.escalation}%</p>
            </div>
            <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
              <p className="text-xs text-gray-500 mb-1">Distance</p>
              <p className="font-bold text-gray-800">{formData.distanceToInstall} km</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
} 