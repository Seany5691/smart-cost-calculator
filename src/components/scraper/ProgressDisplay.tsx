'use client';

import React, { useMemo, useCallback } from 'react';
import type { ProgressDisplayProps } from '@/lib/scraper/types';
import { Clock, MapPin, Building2, Timer } from 'lucide-react';

const ProgressDisplay = React.memo(({
  percentage,
  townsRemaining,
  totalTowns,
  businessesScraped,
  estimatedTimeRemaining,
  elapsedTime,
}: ProgressDisplayProps) => {
  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }, []);

  const completedTowns = useMemo(() => totalTowns - townsRemaining, [totalTowns, townsRemaining]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
          <Timer className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Scraping Progress
          </h3>
          <p className="text-xs text-gray-600">
            Real-time scraping status
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Towns Progress */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-2">
          <div className="flex items-center gap-1.5 text-gray-600 mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Towns</span>
          </div>
          <p className="text-base font-bold text-gray-800">
            {completedTowns} / {totalTowns}
          </p>
        </div>

        {/* Businesses Scraped */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-2">
          <div className="flex items-center gap-1.5 text-gray-600 mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Businesses</span>
          </div>
          <p className="text-base font-bold text-gray-800">{businessesScraped}</p>
        </div>

        {/* Elapsed Time */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-2">
          <div className="flex items-center gap-1.5 text-gray-600 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Elapsed</span>
          </div>
          <p className="text-base font-bold text-gray-800">
            {formatTime(elapsedTime / 1000)}
          </p>
        </div>

        {/* Estimated Time Remaining */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-2">
          <div className="flex items-center gap-1.5 text-gray-600 mb-1">
            <Timer className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Remaining</span>
          </div>
          <p className="text-base font-bold text-gray-800">
            {estimatedTimeRemaining !== null
              ? formatTime(estimatedTimeRemaining / 1000)
              : '--'}
          </p>
        </div>
      </div>

      {/* Progress Bar at Bottom */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Overall Progress</span>
          <span className="font-semibold text-gray-800">{percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
});

ProgressDisplay.displayName = 'ProgressDisplay';

export default ProgressDisplay;
