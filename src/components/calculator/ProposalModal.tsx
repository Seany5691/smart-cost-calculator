'use client';

import { useState, useEffect } from 'react';
import { useCalculatorStore } from '@/store/calculator';
import { X, FileText, Download } from 'lucide-react';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: ProposalData) => void;
}

export interface ProposalData {
  customerName: string;
  currentMRC: number;
  specialistEmail: string;
  specialistPhone: string;
}

export default function ProposalModal({ isOpen, onClose, onGenerate }: ProposalModalProps) {
  const { dealDetails } = useCalculatorStore();
  const [formData, setFormData] = useState<ProposalData>({
    customerName: dealDetails.customerName || '',
    currentMRC: 0,
    specialistEmail: '',
    specialistPhone: ''
  });

  // Update customer name when deal details change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      customerName: dealDetails.customerName || ''
    }));
  }, [dealDetails.customerName]);

  const handleInputChange = (field: keyof ProposalData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  const handleClose = () => {
    setFormData({
      customerName: dealDetails.customerName || '',
      currentMRC: 0,
      specialistEmail: '',
      specialistPhone: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Generate Proposal</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name *
            </label>
            <input
              type="text"
              id="customerName"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="currentMRC" className="block text-sm font-medium text-gray-700 mb-2">
              Currently Monthly Amounts Excluding Current Hardware Rental *
            </label>
            <input
              type="number"
              id="currentMRC"
              value={formData.currentMRC}
              onChange={(e) => handleInputChange('currentMRC', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label htmlFor="specialistEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Specialist Email Address *
            </label>
            <input
              type="email"
              id="specialistEmail"
              value={formData.specialistEmail}
              onChange={(e) => handleInputChange('specialistEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="specialistPhone" className="block text-sm font-medium text-gray-700 mb-2">
              Specialist Phone Number *
            </label>
            <input
              type="tel"
              id="specialistPhone"
              value={formData.specialistPhone}
              onChange={(e) => handleInputChange('specialistPhone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Generate Proposal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 