'use client';

import { useState, useEffect } from 'react';
import { useCalculatorStore } from '@/store/calculator';
import { useAuthStore } from '@/store/auth';
import { useConfigStore } from '@/store/config';
import { formatCurrency } from '@/lib/utils';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';

// Type for color arrays to fix TypeScript errors
type RGBColor = [number, number, number];

interface PDFGeneratorProps {
  onGenerate?: () => void;
}

export default function PDFGenerator({ onGenerate }: PDFGeneratorProps) {
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
      
      const totals = calculateTotalCosts();
      const doc = new jsPDF();
      let yPos = 35; // Starting position for content
      const leftMargin = 25; // Consistent margins
      const rightMargin = 25;
      const pageWidth = doc.internal.pageSize.width;
      
             // Define modern color scheme
       const primaryColor: RGBColor = [99, 102, 241]; // Indigo (#6366F1)
       const secondaryColor: RGBColor = [71, 85, 105]; // Slate gray (#475569)
       const headerBgColor: RGBColor = [248, 250, 252]; // Slate 50 (#F8FAFC)
       const accentColor: RGBColor = [15, 23, 42]; // Slate 900 (#0F172A)
       const lightGray: RGBColor = [248, 250, 252]; // Slate 50 (#F8FAFC)
       const successColor: RGBColor = [34, 197, 94]; // Green (#22C55E)
       const accentBlue: RGBColor = [59, 130, 246]; // Blue (#3B82F6)
       const warmGray: RGBColor = [245, 245, 244]; // Stone 100 (#F5F5F4)

             // Function to add header to each page
       const addHeader = async () => {
         // Add modern header with gradient-like effect
         doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
         doc.rect(0, 0, pageWidth, 45, 'F');
         
         // Company branding in header
         doc.setFont('helvetica', 'bold');
         doc.setFontSize(18);
         doc.setTextColor(255, 255, 255);
         doc.text('Smart Cost Calculator', leftMargin, 25);

         // Header: Title
         doc.setFont('helvetica', 'bold');
         doc.setFontSize(16);
         doc.setTextColor(255, 255, 255);
         const title = dealDetails.customerName ? `${dealDetails.customerName} - Deal Breakdown` : "Deal Cost Calculator Breakdown";
         const fontSize = doc.getFontSize();
         const titleWidth = doc.getStringUnitWidth(title) * fontSize / doc.internal.scaleFactor;
         const titleX = (pageWidth - titleWidth) / 2; // Center title
         doc.text(title, titleX, 40);

         // Header: Date and User (white text on colored background)
         doc.setFontSize(9);
         doc.setFont('helvetica', 'normal');
         doc.setTextColor(255, 255, 255);
         const currentDate = new Date().toLocaleDateString('en-GB', {
           day: '2-digit',
           month: '2-digit',
           year: 'numeric'
         });
         doc.text(`Generated: ${currentDate}`, pageWidth - rightMargin - 45, 20);
         doc.text(`By: ${user?.name || user?.username || 'Unknown'}`, pageWidth - rightMargin - 45, 30);

         // Add subtle accent line below header
         doc.setDrawColor(accentBlue[0], accentBlue[1], accentBlue[2]);
         doc.setLineWidth(2);
         doc.line(leftMargin, 47, pageWidth - rightMargin, 47);
       };

             // Add header to the first page
       await addHeader();
       
       // Reset text color for body and adjust starting position
       doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
       yPos = 60; // Start content below the colored header
       
       // Hardware Section
       const hardwareSection = sections.find(s => s.id === 'hardware');
       if (hardwareSection) {
         // Section header with modern styling
         doc.setFillColor(warmGray[0], warmGray[1], warmGray[2]);
         doc.rect(leftMargin - 5, yPos - 8, pageWidth - leftMargin - rightMargin + 10, 12, 'F');
         
         doc.setFontSize(13);
         doc.setFont('helvetica', 'bold');
         doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
         doc.text('Hardware Costs', leftMargin, yPos);
         yPos += 15;
        
        const hardwareData = hardwareSection.items
          .filter(item => item.quantity > 0)
          .map(item => [
            item.name,
            formatCurrency(item.cost),
            item.quantity.toString(),
            formatCurrency(item.cost * item.quantity)
          ]);

                 if (hardwareData.length > 0) {
           autoTable(doc, {
             startY: yPos,
             head: [['Item', 'Unit Cost', 'Quantity', 'Total']],
             body: hardwareData,
             headStyles: {
               fillColor: primaryColor,
               textColor: [255, 255, 255],
               fontStyle: 'bold',
               halign: 'center',
               fontSize: 9,
               cellPadding: 6
             },
             bodyStyles: {
               fontSize: 8,
               cellPadding: 5,
               textColor: accentColor
             },
             alternateRowStyles: {
               fillColor: warmGray
             },
             columnStyles: {
               0: { cellWidth: 'auto' },
               1: { halign: 'right' },
               2: { halign: 'center' },
               3: { halign: 'right', fontStyle: 'bold' }
             },
             margin: { left: leftMargin, right: rightMargin },
             styles: {
               lineWidth: 0.5,
               lineColor: [226, 232, 240] // Slate 200
             }
           });
           yPos = (doc as any).lastAutoTable.finalY + 20;
                 } else {
           doc.setFontSize(8);
           doc.setFont('helvetica', 'italic');
           doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
           doc.text('No hardware items selected', leftMargin, yPos + 5);
           yPos += 20;
         }
       }

             // Connectivity Section
       const connectivitySection = sections.find(s => s.id === 'connectivity');
       if (connectivitySection) {
         // Section header with modern styling
         doc.setFillColor(warmGray[0], warmGray[1], warmGray[2]);
         doc.rect(leftMargin - 5, yPos - 8, pageWidth - leftMargin - rightMargin + 10, 12, 'F');
         
         doc.setFontSize(13);
         doc.setFont('helvetica', 'bold');
         doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
         doc.text('Connectivity Costs', leftMargin, yPos);
         yPos += 15;
        
        const connectivityData = connectivitySection.items
          .filter(item => item.quantity > 0)
          .map(item => [
            item.name,
            formatCurrency(item.cost),
            item.quantity.toString(),
            formatCurrency(item.cost * item.quantity)
          ]);

                 if (connectivityData.length > 0) {
           autoTable(doc, {
             startY: yPos,
             head: [['Item', 'Monthly Cost', 'Quantity', 'Total Monthly']],
             body: connectivityData,
             headStyles: {
               fillColor: primaryColor,
               textColor: [255, 255, 255],
               fontStyle: 'bold',
               halign: 'center',
               fontSize: 9,
               cellPadding: 6
             },
             bodyStyles: {
               fontSize: 8,
               cellPadding: 5,
               textColor: accentColor
             },
             alternateRowStyles: {
               fillColor: warmGray
             },
             columnStyles: {
               0: { cellWidth: 'auto' },
               1: { halign: 'right' },
               2: { halign: 'center' },
               3: { halign: 'right', fontStyle: 'bold' }
             },
             margin: { left: leftMargin, right: rightMargin },
             styles: {
               lineWidth: 0.5,
               lineColor: [226, 232, 240] // Slate 200
             }
           });
           yPos = (doc as any).lastAutoTable.finalY + 20;
                 } else {
           doc.setFontSize(8);
           doc.setFont('helvetica', 'italic');
           doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
           doc.text('No connectivity items selected', leftMargin, yPos + 5);
           yPos += 20;
         }
       }

             // Licensing Section
       const licensingSection = sections.find(s => s.id === 'licensing');
       if (licensingSection) {
         // Section header with modern styling
         doc.setFillColor(warmGray[0], warmGray[1], warmGray[2]);
         doc.rect(leftMargin - 5, yPos - 8, pageWidth - leftMargin - rightMargin + 10, 12, 'F');
         
         doc.setFontSize(13);
         doc.setFont('helvetica', 'bold');
         doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
         doc.text('Licensing Costs', leftMargin, yPos);
         yPos += 15;
        
        const licensingData = licensingSection.items
          .filter(item => item.quantity > 0)
          .map(item => [
            item.name,
            formatCurrency(item.cost),
            item.quantity.toString(),
            formatCurrency(item.cost * item.quantity)
          ]);

                 if (licensingData.length > 0) {
           autoTable(doc, {
             startY: yPos,
             head: [['Item', 'Monthly Cost', 'Quantity', 'Total Monthly']],
             body: licensingData,
             headStyles: {
               fillColor: primaryColor,
               textColor: [255, 255, 255],
               fontStyle: 'bold',
               halign: 'center',
               fontSize: 9,
               cellPadding: 6
             },
             bodyStyles: {
               fontSize: 8,
               cellPadding: 5,
               textColor: accentColor
             },
             alternateRowStyles: {
               fillColor: warmGray
             },
             columnStyles: {
               0: { cellWidth: 'auto' },
               1: { halign: 'right' },
               2: { halign: 'center' },
               3: { halign: 'right', fontStyle: 'bold' }
             },
             margin: { left: leftMargin, right: rightMargin },
             styles: {
               lineWidth: 0.5,
               lineColor: [226, 232, 240] // Slate 200
             }
           });
           yPos = (doc as any).lastAutoTable.finalY + 20;
                 } else {
           doc.setFontSize(8);
           doc.setFont('helvetica', 'italic');
           doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
           doc.text('No licensing items selected', leftMargin, yPos + 5);
           yPos += 20;
         }
       }

             // Check if we need a new page for remaining sections
       if (yPos > doc.internal.pageSize.height - 120) {
         doc.addPage();
         yPos = 20;
         await addHeader();
         yPos = 60;
       }

             // Deal Details Section
       // Section header with modern styling
       doc.setFillColor(warmGray[0], warmGray[1], warmGray[2]);
       doc.rect(leftMargin - 5, yPos - 8, pageWidth - leftMargin - rightMargin + 10, 12, 'F');
       
       doc.setFontSize(13);
       doc.setFont('helvetica', 'bold');
       doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
       doc.text('Deal Details', leftMargin, yPos);
       yPos += 15;
      
      const dealDetailsData = [
        ['Customer Name', dealDetails.customerName || 'Not specified'],
        ['Distance to Install', `${dealDetails.distanceToInstall} KM`],
        ['Term', `${dealDetails.term} months`],
        ['Escalation Rate', `${dealDetails.escalation}%`],
        
        ['Settlement Amount', formatCurrency(dealDetails.settlement)]
      ];

             autoTable(doc, {
         startY: yPos,
         head: [['Detail', 'Value']],
         body: dealDetailsData,
         headStyles: {
           fillColor: primaryColor,
           textColor: [255, 255, 255],
           fontStyle: 'bold',
           halign: 'center',
           fontSize: 9,
           cellPadding: 6
         },
         bodyStyles: {
           fontSize: 8,
           cellPadding: 5,
           textColor: accentColor
         },
         alternateRowStyles: {
           fillColor: warmGray
         },
         columnStyles: {
           0: { cellWidth: 'auto', fontStyle: 'bold' },
           1: { halign: 'right' }
         },
         margin: { left: leftMargin, right: rightMargin },
         styles: {
           lineWidth: 0.5,
           lineColor: [226, 232, 240] // Slate 200
         }
       });
       yPos = (doc as any).lastAutoTable.finalY + 20;

             // Always start Total Costs Summary on a new page
       doc.addPage();
       yPos = 20;
       await addHeader();
       yPos = 60;

             // Total Costs Section
       // Section header with modern styling
       doc.setFillColor(warmGray[0], warmGray[1], warmGray[2]);
       doc.rect(leftMargin - 5, yPos - 8, pageWidth - leftMargin - rightMargin + 10, 12, 'F');
       
       doc.setFontSize(13);
       doc.setFont('helvetica', 'bold');
       doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
       doc.text('Total Costs Summary', leftMargin, yPos);
       yPos += 15;
      
      // Calculate extension point cost
      const extensionPointCost = totals.extensionCount * scales.additional_costs.cost_per_point;
      
             // Organize data with proper grouping and spacing
       const totalCostsData = [
         // Hardware & Installation Group
         ['Hardware Total', formatCurrency(totals.hardwareTotal)],
         ['Extension Cost', formatCurrency(totals.extensionCount * scales.additional_costs.cost_per_point)],
         ['Installation Cost', formatCurrency(totals.hardwareInstallTotal)],
         ['Hardware & Installation Total', formatCurrency(totals.hardwareInstallTotal)],
         ['', ''], // Empty row for spacing
        
        // Monthly Recurring Costs Group
        ['Hardware Rental', formatCurrency(totals.hardwareRental)],
        ['Connectivity Cost', formatCurrency(totals.connectivityCost)],
        ['Licensing Cost', formatCurrency(totals.licensingCost)],
        ['Total Monthly Recurring Costs', formatCurrency(totals.totalMRC)],
        ['', ''], // Empty row for spacing
        
                 // Profit & Finance Group
         ['Total Gross Profit', formatCurrency(totals.totalGrossProfit)],
        ['Finance Fee', formatCurrency(totals.financeFee)],
        ['Settlement Amount', formatCurrency(totals.settlementAmount)],
        ['', ''], // Empty row for spacing
        
        // Final Totals Group
        ['Finance Amount', formatCurrency(totals.financeAmount)],
        ['Total Payout', formatCurrency(totals.totalPayout)],
        ['', ''], // Empty row for spacing
        
        // VAT Calculations
        ['Total Excluding VAT', formatCurrency(totals.totalExVat)],
        ['VAT (15%)', formatCurrency(totals.totalIncVat - totals.totalExVat)],
        ['Total Including VAT', formatCurrency(totals.totalIncVat)],
      ];

             autoTable(doc, {
         startY: yPos,
         head: [['Cost Type', 'Amount']],
         body: totalCostsData,
         headStyles: {
           fillColor: primaryColor,
           textColor: [255, 255, 255],
           fontStyle: 'bold',
           halign: 'center',
           fontSize: 9,
           cellPadding: 6
         },
         bodyStyles: {
           fontSize: 8,
           cellPadding: 5,
           textColor: accentColor,
           minCellHeight: 7
         },
         alternateRowStyles: {
           fillColor: warmGray
         },
         columnStyles: {
           0: { cellWidth: 'auto', fontStyle: 'bold' },
           1: { halign: 'right' }
         },
         margin: { left: leftMargin, right: rightMargin },
         styles: {
           lineWidth: 0.5,
           lineColor: [226, 232, 240] // Slate 200
         },
         didParseCell: function(data) {
           // Style specific rows differently
           if (data.row.index === 3 || data.row.index === 8 || data.row.index === 12 || 
               data.row.index === 16 || data.row.index === 19 || data.row.index === 22) {
             // Total rows - make them stand out
             data.cell.styles.fillColor = [239, 246, 255]; // Light blue background
             data.cell.styles.fontStyle = 'bold';
             data.cell.styles.fontSize = 9;
           } else if (data.row.index === 4 || data.row.index === 9 || data.row.index === 15 || 
                      data.row.index === 18 || data.row.index === 21) {
             // Spacing rows - no background
             data.cell.styles.fillColor = [255, 255, 255];
             data.cell.styles.fontSize = 3;
           } else {
             // Ensure all other rows have consistent font size
             data.cell.styles.fontSize = 8;
           }
         }
       });

             // Add footer with page number and note
       const pageCount = (doc as any).internal.getNumberOfPages();
       for (let i = 1; i <= pageCount; i++) {
         doc.setPage(i);
         
         // Footer background
         doc.setFillColor(warmGray[0], warmGray[1], warmGray[2]);
         doc.rect(0, doc.internal.pageSize.height - 25, pageWidth, 25, 'F');
         
         // Footer text
         doc.setFontSize(8);
         doc.setFont('helvetica', 'normal');
         doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
         doc.text('All costs exclude VAT unless stated otherwise', leftMargin, doc.internal.pageSize.height - 15);
         doc.text(`Generated by Smart Cost Calculator`, leftMargin, doc.internal.pageSize.height - 10);
         doc.text(`Page ${i} of ${pageCount}`, pageWidth - rightMargin - 25, doc.internal.pageSize.height - 10);
       }

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