'use client';

import { useState, useEffect, useRef } from 'react';
import { useCalculatorStore } from '@/store/calculator';
import { X, FileText, Download } from 'lucide-react';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { trapFocus, handleEscapeKey } from '@/lib/accessibility';

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
  const modalRef = useRef<HTMLDivElement>(null);
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

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const cleanupFocusTrap = trapFocus(modalRef.current);
    const cleanupEscapeKey = handleEscapeKey(handleClose);

    return () => {
      cleanupFocusTrap();
      cleanupEscapeKey();
    };
  }, [isOpen]);

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
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" aria-hidden="true" />
            <h2 id="proposal-modal-title" className="text-xl font-semibold text-gray-900">Generate Proposal</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <FormField
            label="Customer Name"
            required
            description="Enter the customer's full name for the proposal"
          >
            <Input
              type="text"
              id="customerName"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              placeholder="Enter customer name"
              required
            />
          </FormField>

          <FormField
            label="Current Monthly Amounts"
            required
            description="Monthly amounts excluding current hardware rental (R)"
          >
            <Input
              type="number"
              id="currentMRC"
              value={formData.currentMRC}
              onChange={(e) => handleInputChange('currentMRC', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </FormField>

          <FormField
            label="Specialist Email Address"
            required
            description="Email address for proposal correspondence"
          >
            <Input
              type="email"
              id="specialistEmail"
              value={formData.specialistEmail}
              onChange={(e) => handleInputChange('specialistEmail', e.target.value)}
              placeholder="specialist@company.com"
              required
            />
          </FormField>

          <FormField
            label="Specialist Phone Number"
            required
            description="Contact number for follow-up questions"
          >
            <Input
              type="tel"
              id="specialistPhone"
              value={formData.specialistPhone}
              onChange={(e) => handleInputChange('specialistPhone', e.target.value)}
              placeholder="+27 XX XXX XXXX"
              required
            />
          </FormField>

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