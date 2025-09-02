'use client';

import { useState, useEffect } from 'react';
import { useCalculatorStore } from '@/store/calculator';
import { useAuthStore } from '@/store/auth';
import { useConfigStore } from '@/store/config';
import { formatCurrency, getItemCost } from '@/lib/utils';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { TotalCosts } from '@/lib/types';

// Type for color arrays to fix TypeScript errors
type RGBColor = [number, number, number];

interface PDFGeneratorProps {
  onGenerate?: () => void;
  customTotals?: TotalCosts;
}

export default function PDFGenerator({ onGenerate, customTotals }: PDFGeneratorProps) {
  const { sections, dealDetails, calculateTotalCosts } = useCalculatorStore();
  const { user } = useAuthStore();
  const { scales } = useConfigStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' }>({ 
    show: false, 
    title: '', 
    message: '', 
    type: 'success' 
  });
  
  // Auto-hide toast after specified duration
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      
      // Dynamically import the PDF generation code
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      // Use custom totals if provided, otherwise fall back to calculated totals
      const totals = customTotals || calculateTotalCosts();
      const doc = new jsPDF();
      
             // Define modern color scheme
       const primaryColor: RGBColor = [99, 102, 241]; // Indigo (#6366F1)
       const secondaryColor: RGBColor = [71, 85, 105]; // Slate gray (#475569)
       const accentColor: RGBColor = [15, 23, 42]; // Slate 900 (#0F172A)
       const lightGray: RGBColor = [248, 250, 252]; // Slate 50 (#F8FAFC)
       const successColor: RGBColor = [34, 197, 94]; // Green (#22C55E)
       const warmGray: RGBColor = [245, 245, 244]; // Stone 100 (#F5F5F4)
      const borderColor: RGBColor = [226, 232, 240]; // Slate 200

      // Page dimensions
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15; // Reduced margin for more space
      const contentWidth = pageWidth - (margin * 2);
      
      let yPos = margin;

      // Header Section - More compact
         doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
         doc.setFont('helvetica', 'bold');
         doc.setFontSize(16);
         doc.setTextColor(255, 255, 255);
      doc.text('Smart Cost Calculator', margin, 18);
      
      doc.setFontSize(12);
         const title = dealDetails.customerName ? `${dealDetails.customerName} - Deal Breakdown` : "Deal Cost Calculator Breakdown";
      doc.text(title, margin, 26);

      // Date and user info - smaller and more compact
      doc.setFontSize(8);
         doc.setFont('helvetica', 'normal');
         const currentDate = new Date().toLocaleDateString('en-GB', {
           day: '2-digit',
           month: '2-digit',
           year: 'numeric'
         });
      doc.text(`Generated: ${currentDate}`, pageWidth - margin - 50, 18);
      doc.text(`By: ${user?.name || user?.username || 'Unknown'}`, pageWidth - margin - 50, 26);

      yPos = 35;

      // Deal Information Section - More compact
      doc.setFillColor(warmGray[0], warmGray[1], warmGray[2]);
      doc.rect(margin - 3, yPos - 3, contentWidth + 6, 20, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Deal Information', margin, yPos + 3);
      
      yPos += 12;
      
      const dealInfoData = [
        ['Customer Name', dealDetails.customerName || 'Not specified'],
        ['Term', `${dealDetails.term} months`],
        ['Escalation Rate', `${dealDetails.escalation}%`],
        ['Distance to Install', `${dealDetails.distanceToInstall} km`],
        ['Settlement Amount', formatCurrency(dealDetails.settlement)]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Detail', 'Value']],
        body: dealInfoData,
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8
        },
        bodyStyles: {
          fontSize: 7,
          textColor: accentColor
        },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'right' }
        },
        margin: { left: margin, right: margin },
        styles: {
          lineWidth: 0.5,
          lineColor: borderColor
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
       
       // Hardware Section
       const hardwareSection = sections.find(s => s.id === 'hardware');
       if (hardwareSection) {
         doc.setFillColor(warmGray[0], warmGray[1], warmGray[2]);
        doc.rect(margin - 3, yPos - 3, contentWidth + 6, 20, 'F');
         
        doc.setFontSize(10);
         doc.setFont('helvetica', 'bold');
         doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Hardware Items', margin, yPos + 3);
        
        yPos += 12;
        
        const hardwareData = hardwareSection.items
          .filter(item => item.quantity > 0)
          .map(item => {
            const itemCost = getItemCost(item, user?.role || 'user');
            return [
            item.name,
              formatCurrency(itemCost),
            item.quantity.toString(),
              formatCurrency(itemCost * item.quantity)
            ];
          });

                 if (hardwareData.length > 0) {
           autoTable(doc, {
             startY: yPos,
            head: [['Item', 'Unit Cost', 'Qty', 'Total']],
             body: hardwareData,
             headStyles: {
               fillColor: primaryColor,
               textColor: [255, 255, 255],
               fontStyle: 'bold',
              fontSize: 8
             },
             bodyStyles: {
              fontSize: 7,
               textColor: accentColor
             },
             columnStyles: {
               1: { halign: 'right' },
               2: { halign: 'center' },
               3: { halign: 'right', fontStyle: 'bold' }
             },
            margin: { left: margin, right: margin },
             styles: {
               lineWidth: 0.5,
              lineColor: borderColor
             }
           });
          yPos = (doc as any).lastAutoTable.finalY + 8;
                 } else {
          doc.setFontSize(7);
           doc.setFont('helvetica', 'italic');
           doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.text('No hardware items selected', margin, yPos + 3);
          yPos += 12;
         }
       }

             // Connectivity Section
       const connectivitySection = sections.find(s => s.id === 'connectivity');
       if (connectivitySection) {
         doc.setFillColor(warmGray[0], warmGray[1], warmGray[2]);
        doc.rect(margin - 3, yPos - 3, contentWidth + 6, 20, 'F');
         
        doc.setFontSize(10);
         doc.setFont('helvetica', 'bold');
         doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Connectivity Services', margin, yPos + 3);
        
        yPos += 12;
        
        const connectivityData = connectivitySection.items
          .filter(item => item.quantity > 0)
          .map(item => {
            const itemCost = getItemCost(item, user?.role || 'user');
            return [
            item.name,
              formatCurrency(itemCost),
            item.quantity.toString(),
              formatCurrency(itemCost * item.quantity)
            ];
          });

                 if (connectivityData.length > 0) {
           autoTable(doc, {
             startY: yPos,
            head: [['Service', 'Monthly Cost', 'Qty', 'Total Monthly']],
             body: connectivityData,
             headStyles: {
               fillColor: primaryColor,
               textColor: [255, 255, 255],
               fontStyle: 'bold',
              fontSize: 8
             },
             bodyStyles: {
              fontSize: 7,
               textColor: accentColor
             },
             columnStyles: {
               1: { halign: 'right' },
               2: { halign: 'center' },
               3: { halign: 'right', fontStyle: 'bold' }
             },
            margin: { left: margin, right: margin },
             styles: {
               lineWidth: 0.5,
              lineColor: borderColor
             }
           });
          yPos = (doc as any).lastAutoTable.finalY + 8;
                 } else {
          doc.setFontSize(7);
           doc.setFont('helvetica', 'italic');
           doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.text('No connectivity services selected', margin, yPos + 3);
          yPos += 12;
         }
       }

             // Licensing Section
       const licensingSection = sections.find(s => s.id === 'licensing');
       if (licensingSection) {
         doc.setFillColor(warmGray[0], warmGray[1], warmGray[2]);
        doc.rect(margin - 3, yPos - 3, contentWidth + 6, 20, 'F');
         
        doc.setFontSize(10);
         doc.setFont('helvetica', 'bold');
         doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Licensing Services', margin, yPos + 3);
        
        yPos += 12;
        
        const licensingData = licensingSection.items
          .filter(item => item.quantity > 0)
          .map(item => {
            const itemCost = getItemCost(item, user?.role || 'user');
            return [
            item.name,
              formatCurrency(itemCost),
            item.quantity.toString(),
              formatCurrency(itemCost * item.quantity)
            ];
          });

                 if (licensingData.length > 0) {
           autoTable(doc, {
             startY: yPos,
            head: [['Service', 'Monthly Cost', 'Qty', 'Total Monthly']],
             body: licensingData,
             headStyles: {
               fillColor: primaryColor,
               textColor: [255, 255, 255],
               fontStyle: 'bold',
              fontSize: 8
             },
             bodyStyles: {
              fontSize: 7,
               textColor: accentColor
             },
             columnStyles: {
               1: { halign: 'right' },
               2: { halign: 'center' },
               3: { halign: 'right', fontStyle: 'bold' }
             },
            margin: { left: margin, right: margin },
             styles: {
               lineWidth: 0.5,
              lineColor: borderColor
             }
           });
          yPos = (doc as any).lastAutoTable.finalY + 8;
                 } else {
          doc.setFontSize(7);
           doc.setFont('helvetica', 'italic');
           doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.text('No licensing services selected', margin, yPos + 3);
          yPos += 12;
        }
      }

      // Cost Summary Section - More compact and professional
       doc.setFillColor(warmGray[0], warmGray[1], warmGray[2]);
      doc.rect(margin - 3, yPos - 3, contentWidth + 6, 20, 'F');
       
      doc.setFontSize(10);
       doc.setFont('helvetica', 'bold');
       doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Total Costs', margin, yPos + 3);
      
      yPos += 12;
      
      // Calculate extension point cost
      const extensionPointCost = totals.extensionCount * (scales?.additional_costs?.cost_per_point || 0);
      
      const summaryData = [
         // Hardware & Installation Group
         ['Hardware Total', formatCurrency(totals.hardwareTotal)],
        ['Extension Cost', formatCurrency(extensionPointCost)],
         ['Installation Cost', formatCurrency(totals.hardwareInstallTotal)],
        ['', ''], // Spacing row
        
                 // Profit & Finance Group
         ['Total Gross Profit', formatCurrency(totals.totalGrossProfit)],
        ['Finance Fee', formatCurrency(totals.financeFee)],
        ['Settlement Amount', formatCurrency(totals.settlementAmount)],
        ['', ''], // Spacing row
        
        // Final Totals Group
        ['Finance Amount', formatCurrency(totals.financeAmount)],
        ['Total Payout', formatCurrency(totals.totalPayout)],
        ['', ''], // Spacing row
        
        // Monthly Recurring Costs Group
        ['Hardware Rental', formatCurrency(totals.hardwareRental)],
        ['Connectivity Cost', formatCurrency(totals.connectivityCost)],
        ['Licensing Cost', formatCurrency(totals.licensingCost)],
        ['Total MRC', formatCurrency(totals.totalMRC)],
        ['', ''], // Spacing row
        
        // VAT Calculations
        ['Total Excluding VAT', formatCurrency(totals.totalExVat)],
        ['VAT (15%)', formatCurrency(totals.totalIncVat - totals.totalExVat)],
        ['Total Including VAT', formatCurrency(totals.totalIncVat)]
      ];

             autoTable(doc, {
         startY: yPos,
         head: [['Cost Type', 'Amount']],
        body: summaryData,
         headStyles: {
           fillColor: primaryColor,
           textColor: [255, 255, 255],
           fontStyle: 'bold',
          fontSize: 8
         },
         bodyStyles: {
          fontSize: 7,
          textColor: accentColor
         },
         columnStyles: {
          0: { fontStyle: 'bold' },
           1: { halign: 'right' }
         },
        margin: { left: margin, right: margin },
         styles: {
           lineWidth: 0.5,
          lineColor: borderColor
         },
         didParseCell: function(data) {
           // Style specific rows differently
          if (data.row.index === 4 || data.row.index === 8 || data.row.index === 11 || 
              data.row.index === 14 || data.row.index === 18) {
            // Total rows - make them stand out with larger font and bold
             data.cell.styles.fillColor = [239, 246, 255]; // Light blue background
             data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 8; // Larger font for totals
          } else if (data.row.index === 3 || data.row.index === 7 || data.row.index === 10 || 
                     data.row.index === 15) {
             // Spacing rows - no background
             data.cell.styles.fillColor = [255, 255, 255];
             data.cell.styles.fontSize = 3;
           }
         }
       });

      // Footer - More compact
      const footerY = pageHeight - 15;
         doc.setFillColor(warmGray[0], warmGray[1], warmGray[2]);
      doc.rect(0, footerY, pageWidth, 15, 'F');
         
      doc.setFontSize(7);
         doc.setFont('helvetica', 'normal');
         doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('All costs exclude VAT unless stated otherwise', margin, footerY + 8);
      doc.text(`Generated by Smart Cost Calculator | Factor Used: ${totals.factorUsed.toFixed(5)}`, margin, footerY + 12);
      doc.text(`Page 1 of 1`, pageWidth - margin - 20, footerY + 12);

      // Save the PDF
      const fileName = dealDetails.customerName 
        ? `${dealDetails.customerName.trim().replace(/[^a-zA-Z0-9]/g, '_')}_Deal_Breakdown.pdf`
        : 'Deal_Cost_Calculator_Report.pdf';
      doc.save(fileName);

      setToast({
        show: true,
        title: 'PDF Generated Successfully',
        message: 'Your deal breakdown PDF has been downloaded',
        type: 'success'
      });

      if (onGenerate) {
        onGenerate();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setToast({
        show: true,
        title: 'PDF Generation Failed',
        message: 'Failed to generate PDF. Please try again.',
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
      
      <button
        className="btn btn-primary flex items-center space-x-2"
        onClick={generatePDF}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Generating PDF...</span>
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            <span>Generate PDF</span>
          </>
        )}
      </button>
    </>
  );
} 