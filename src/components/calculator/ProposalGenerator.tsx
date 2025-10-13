'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { useCalculatorStore } from '@/store/calculator';
import { useConfigStore } from '@/store/config';
import { formatCurrency } from '@/lib/utils';
import { ProposalData } from './ProposalModal';
import { TotalCosts } from '@/lib/types';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ProposalGeneratorProps {
  onGenerate?: () => void;
}

export interface ProposalGeneratorRef {
  generateProposal: (data: ProposalData, customTotals?: TotalCosts) => Promise<void>;
}

const ProposalGenerator = forwardRef<ProposalGeneratorRef, ProposalGeneratorProps>(({ onGenerate }, ref) => {
  const { sections, dealDetails, calculateTotalCosts } = useCalculatorStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' }>({ 
    show: false, 
    title: '', 
    message: '', 
    type: 'success' 
  });

  useImperativeHandle(ref, () => ({
    generateProposal: async (proposalData: ProposalData, customTotals?: TotalCosts) => {
      try {
        setIsGenerating(true);
        
        // Dynamically import PDF-lib for form filling
        const { PDFDocument } = await import('pdf-lib');
        
        const response = await fetch('/Proposal.pdf');
        if (!response.ok) {
          throw new Error('Failed to fetch PDF template');
        }
        
        const pdfBytes = await response.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();

        // Use custom totals if provided, otherwise fall back to calculated totals
        const totals = customTotals || calculateTotalCosts();
        const currentYear = new Date().getFullYear();

        // Calculate current hardware rental from settlement details
        let currentHardwareRental = 0;
        if (dealDetails.settlement > 0 && dealDetails.settlementRentalAmount && dealDetails.settlementRentalType) {
          if (dealDetails.settlementRentalType === 'current') {
            // If current rental is selected, use the rental amount directly
            currentHardwareRental = dealDetails.settlementRentalAmount;
          } else if (dealDetails.settlementRentalType === 'starting' && dealDetails.settlementStartDate && dealDetails.settlementEscalationRate) {
            // If starting rental is selected, calculate the current rental based on escalation
            const startDate = new Date(dealDetails.settlementStartDate);
            const currentDate = new Date();
            const escalation = dealDetails.settlementEscalationRate / 100;
            
            // Calculate years elapsed since start date
            const yearsElapsed = Math.floor(
              (currentDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
            );
            
            // Apply escalation for each year
            currentHardwareRental = dealDetails.settlementRentalAmount * Math.pow(1 + escalation, yearsElapsed);
          }
        }

        // Calculate projections
        const currentEscalation = (dealDetails.settlementEscalationRate || 0) / 100; // Use settlement escalation rate for current projections
        const newEscalation = dealDetails.escalation / 100; // Use new deal escalation rate for new projections
        const contractYears = Math.ceil(dealDetails.term / 12);

        // Current projections (current rental + current MRC + escalation)
        const projectionCurrent1 = currentHardwareRental + proposalData.currentMRC;
        const projectionCurrent2 = projectionCurrent1 * (1 + currentEscalation);
        const projectionCurrent3 = projectionCurrent2 * (1 + currentEscalation);
        const projectionCurrent4 = projectionCurrent3 * (1 + currentEscalation);
        const projectionCurrent5 = projectionCurrent4 * (1 + currentEscalation);

        // Calculate hardware rentals based on contract term
        const hardwareRentals = [];
        let currentRental = totals.hardwareRental;
        
        for (let year = 1; year <= 5; year++) {
          if (year <= contractYears) {
            // Hardware rental applies for contract duration
            hardwareRentals.push(currentRental);
            currentRental = currentRental * (1 + newEscalation);
          } else {
            // No hardware rental after contract ends
            hardwareRentals.push(0);
          }
        }

        // New projections (hardware rental + licensing + connectivity)
        const projectionNew1 = hardwareRentals[0] + totals.connectivityCost + totals.licensingCost;
        const projectionNew2 = hardwareRentals[1] + totals.connectivityCost + totals.licensingCost;
        const projectionNew3 = hardwareRentals[2] + totals.connectivityCost + totals.licensingCost;
        const projectionNew4 = hardwareRentals[3] + totals.connectivityCost + totals.licensingCost;
        const projectionNew5 = hardwareRentals[4] + totals.connectivityCost + totals.licensingCost;

        // Get hardware items (only locked items that are selected by user)
        const hardwareSection = sections.find(s => s.id === 'hardware');
        const hardwareItems = hardwareSection?.items.filter(item => 
          item.locked && item.quantity > 0
        ).slice(0, 9) || [];

        // Get connectivity and licensing items
        const connectivitySection = sections.find(s => s.id === 'connectivity');
        const licensingSection = sections.find(s => s.id === 'licensing');
        
        const connectivityItems = connectivitySection?.items.filter(item => item.quantity > 0) || [];
        const licensingItems = licensingSection?.items.filter(item => item.quantity > 0) || [];

        // Format monthly service items
        const formatServiceItems = (items: any[]) => {
          return items.map(item => `${item.quantity} x ${item.name}`).join(', ');
        };

        const monthlyServiceItem1 = formatServiceItems(licensingItems);
        const monthlyServiceItem2 = formatServiceItems(connectivityItems);
        const monthlyServiceItem3 = 'All Calls at a blended fixed rate of 59c per minute, on a per second billing basis.';

        // Helper function to format currency with R prefix and proper spacing
        const formatCurrencyWithR = (amount: number): string => {
          const formatted = formatCurrency(amount).replace('R', '').trim();
          return `R ${formatted}`;
        };

        // Calculate totals
        const proposedCurrentTotalCost = currentHardwareRental + proposalData.currentMRC;
        const proposedNewTotalCost = totals.hardwareRental + totals.licensingCost + totals.connectivityCost;
        const projectionCurrentTotal = (projectionCurrent1 * 12) + (projectionCurrent2 * 12) + (projectionCurrent3 * 12) + (projectionCurrent4 * 12) + (projectionCurrent5 * 12);
        const projectionTotal = (projectionNew1 * 12) + (projectionNew2 * 12) + (projectionNew3 * 12) + (projectionNew4 * 12) + (projectionNew5 * 12);
        const monthlyServiceTotal = totals.licensingCost + totals.connectivityCost;

        // Fill form fields
        const fields: Record<string, string> = {
          'Customer Name': proposalData.customerName,
          'Current Hardware': formatCurrencyWithR(currentHardwareRental),
          'Current MRC': formatCurrencyWithR(proposalData.currentMRC),
          'Proposed New Cost 1': formatCurrencyWithR(totals.hardwareRental),
          'Proposed New Cost 2': formatCurrencyWithR(totals.connectivityCost + totals.licensingCost),
          
          'Proposed Current Total Cost': formatCurrencyWithR(proposedCurrentTotalCost),
          'Proposed New Total Cost': formatCurrencyWithR(proposedNewTotalCost),
          
          'Projection Current 1': formatCurrencyWithR(projectionCurrent1),
          'Projection Current 2': formatCurrencyWithR(projectionCurrent2),
          'Projection Current 3': formatCurrencyWithR(projectionCurrent3),
          'Projection Current 4': formatCurrencyWithR(projectionCurrent4),
          'Projection Current 5': formatCurrencyWithR(projectionCurrent5),
          'Projection Current Total': formatCurrencyWithR(projectionCurrentTotal),
          
          'Projection Year 1': currentYear.toString(),
          'Projection Year 2': (currentYear + 1).toString(),
          'Projection Year 3': (currentYear + 2).toString(),
          'Projection Year 4': (currentYear + 3).toString(),
          'Projection Year 5': (currentYear + 4).toString(),
          
          'Projection New 1': formatCurrencyWithR(projectionNew1),
          'Projection New 2': formatCurrencyWithR(projectionNew2),
          'Projection New 3': formatCurrencyWithR(projectionNew3),
          'Projection New 4': formatCurrencyWithR(projectionNew4),
          'Projection New 5': formatCurrencyWithR(projectionNew5),
          'Projection Total': formatCurrencyWithR(projectionTotal),
          
          'Total Hardware Cost': formatCurrencyWithR(totals.hardwareRental),
          'Total Hardware Term': `${dealDetails.term} Months`,
          'Total Hardware Escalation': `${dealDetails.escalation}% Escalation`,
          
          'Monthly Service Item 1': monthlyServiceItem1,
          'Monthly Service Item 2': monthlyServiceItem2,
          'Monthly Service Item 3': monthlyServiceItem3,
          'Monthly Service Cost 1': formatCurrencyWithR(totals.licensingCost),
          'Monthly Service Cost 2': formatCurrencyWithR(totals.connectivityCost),
          'Monthly Service Total': formatCurrencyWithR(monthlyServiceTotal),
          'Monthly Service Term 1': 'Month-To-Month',
          'Monthly Service Term 2': 'Month-To-Month',
          'Total Monthly Service Term': 'Month-To-Month',
          
          'Specialist Email Address': proposalData.specialistEmail,
          'Specialist Phone Number': proposalData.specialistPhone,
        };

        // Fill hardware items (only consecutive items, no gaps)
        for (let i = 0; i < 9; i++) {
          const item = hardwareItems[i];
          if (item) {
            fields[`Hardware Qty ${i + 1}`] = item.quantity.toString();
            fields[`Hardware Item ${i + 1}`] = item.name;
          } else {
            fields[`Hardware Qty ${i + 1}`] = '';
            fields[`Hardware Item ${i + 1}`] = '';
          }
        }

        // Fill all form fields
        for (const [fieldName, value] of Object.entries(fields)) {
          try {
            const field = form.getTextField(fieldName);
            if (field) {
              field.setText(value);
            }
          } catch (error) {
            console.warn(`Field "${fieldName}" not found in PDF form`);
          }
        }

        // Save the filled PDF
        const filledPdfBytes = await pdfDoc.save();
        
        // Create download link
        const blob = new Blob([filledPdfBytes as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `${proposalData.customerName.replace(/[^a-zA-Z0-9]/g, '_')} - Proposal${timestamp}.pdf`;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setToast({
          show: true,
          title: 'Proposal Generated Successfully',
          message: 'Your proposal PDF has been downloaded',
          type: 'success'
        });

        if (onGenerate) {
          onGenerate();
        }
      } catch (error) {
        console.error('Error generating proposal:', error);
        setToast({
          show: true,
          title: 'Proposal Generation Failed',
          message: 'Failed to generate proposal. Please try again.',
          type: 'error'
        });
      } finally {
        setIsGenerating(false);
      }
    }
  }), [sections, dealDetails, calculateTotalCosts, onGenerate]);

  // Auto-hide toast after specified duration
  const hideToast = () => {
    if (toast.show) {
      setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 3000);
    }
  };

  if (toast.show) {
    hideToast();
  }

  return (
    <>
      {/* Toast notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
          toast.type === 'error' 
            ? 'bg-red-50 border border-red-200 text-red-800' 
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          <div className="flex items-start space-x-3">
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-semibold">{toast.title}</div>
              <div className="text-sm mt-1">{toast.message}</div>
            </div>
          </div>
        </div>
      )}
      
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Generating Proposal...</span>
          </div>
        </div>
      )}
    </>
  );
});

export default ProposalGenerator; 