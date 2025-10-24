'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import ResultsTable from './ResultsTable';
import type { Business } from '@/lib/scraper/types';

interface ResultsModalProps {
  businesses: Business[];
  onExport: () => void;
}

const ResultsModal = React.memo(({ businesses, onExport }: ResultsModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary w-full"
        disabled={businesses.length === 0}
      >
        View Results ({businesses.length} businesses)
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="glass-card w-full max-w-7xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Scraping Results ({businesses.length} businesses)
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              <ResultsTable businesses={businesses} onExport={onExport} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={onExport}
                className="btn-primary"
              >
                Export All to Excel
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ResultsModal.displayName = 'ResultsModal';

export default ResultsModal;
