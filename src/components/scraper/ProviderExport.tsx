'use client';

import React, { useState, useMemo } from 'react';
import { Download, Filter } from 'lucide-react';
import type { Business } from '@/lib/scraper/types';
import { exportService } from '@/lib/export/ExportService';
import { toast } from '@/lib/toast';

interface ProviderExportProps {
  businesses: Business[];
}

const ProviderExport = React.memo(({ businesses }: ProviderExportProps) => {
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());

  // Get provider statistics
  const providerStats = useMemo(() => {
    const stats = exportService.getProviderStats(businesses);
    return Array.from(stats.entries())
      .sort((a, b) => b[1] - a[1]); // Sort by count descending
  }, [businesses]);

  const handleToggleProvider = (provider: string) => {
    const newSet = new Set(selectedProviders);
    if (newSet.has(provider)) {
      newSet.delete(provider);
    } else {
      newSet.add(provider);
    }
    setSelectedProviders(newSet);
  };

  const handleSelectAll = () => {
    const allProviders = new Set(providerStats.map(([provider]) => provider));
    setSelectedProviders(allProviders);
  };

  const handleDeselectAll = () => {
    setSelectedProviders(new Set());
  };

  const handleExport = () => {
    if (selectedProviders.size === 0) {
      toast.warning('No Providers Selected', 'Please select at least one provider to export');
      return;
    }

    try {
      const filename = exportService.exportByProvider(
        businesses,
        Array.from(selectedProviders)
      );
      
      toast.success('Export Successful', `File saved: ${filename}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      toast.error('Export Failed', message);
    }
  };

  if (businesses.length === 0) {
    return null;
  }

  const selectedBusinessCount = businesses.filter(b => selectedProviders.has(b.provider)).length;

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg">
            <Filter className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">
              Export by Provider
            </h3>
            <p className="text-xs text-gray-600 hidden sm:block">
              Filter and export by phone provider
            </p>
          </div>
        </div>
      </div>
          {/* Selection Controls */}
          <div className="flex items-center justify-between p-2 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <button
                onClick={handleSelectAll}
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                All
              </button>
              <span className="text-gray-400">•</span>
              <button
                onClick={handleDeselectAll}
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                None
              </button>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                {selectedProviders.size}
              </span>
              <span className="text-xs sm:text-sm text-gray-600">
                provider{selectedProviders.size !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

      {/* Provider Checkboxes List */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 sm:p-4 max-h-60 sm:max-h-80 overflow-y-auto space-y-1 sm:space-y-2">
        {providerStats.map(([provider, count]) => (
          <label
            key={provider}
            className={`
              flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg cursor-pointer transition-all duration-200
              ${selectedProviders.has(provider)
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                : 'hover:bg-white/50'
              }
            `}
          >
            <input
              type="checkbox"
              checked={selectedProviders.has(provider)}
              onChange={() => handleToggleProvider(provider)}
              className="w-[14px] h-[14px] text-blue-600 rounded focus:ring-1 focus:ring-blue-500 cursor-pointer flex-shrink-0"
              style={{ minWidth: '14px', minHeight: '14px' }}
            />
            <span className={`text-xs sm:text-sm flex-1 ${
              selectedProviders.has(provider) ? 'text-white font-medium' : 'text-gray-700'
            }`}>
              {provider}
            </span>
            <span className={`
              text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full
              ${selectedProviders.has(provider)
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-500'
              }
            `}>
              {count}
            </span>
          </label>
        ))}
      </div>

      {/* Export Section */}
      <div className="flex items-center justify-between p-2 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            Ready to export
          </span>
          {selectedProviders.size > 0 && (
            <span className="text-xs text-gray-600 mt-1">
              {selectedBusinessCount} business{selectedBusinessCount !== 1 ? 'es' : ''} from all towns
            </span>
          )}
        </div>
        <button
          onClick={handleExport}
          disabled={selectedProviders.size === 0}
          className={`
            btn flex items-center gap-2 shadow-lg
            ${selectedProviders.size === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
            }
          `}
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </button>
      </div>
    </div>
  );
});

ProviderExport.displayName = 'ProviderExport';

export default ProviderExport;
