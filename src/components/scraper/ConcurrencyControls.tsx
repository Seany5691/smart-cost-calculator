'use client';

import React from 'react';
import type { ConcurrencyControlsProps } from '@/lib/scraper/types';
import { Settings } from 'lucide-react';

export default function ConcurrencyControls({
  simultaneousTowns,
  simultaneousIndustries,
  simultaneousLookups,
  onTownsChange,
  onIndustriesChange,
  onLookupsChange,
  disabled,
}: ConcurrencyControlsProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Concurrency Settings
          </h3>
          <p className="text-xs text-gray-600">
            Adjust performance and speed
          </p>
        </div>
      </div>

      {/* Simultaneous Towns */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="towns-slider" className="text-sm text-gray-600">
            Simultaneous Towns: {simultaneousTowns}
          </label>
          <span className="text-xs text-gray-500">1-5</span>
        </div>
        <input
          id="towns-slider"
          type="range"
          min="1"
          max="5"
          value={simultaneousTowns}
          onChange={(e) => onTownsChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Simultaneous Industries */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="industries-slider" className="text-sm text-gray-600">
            Simultaneous Industries: {simultaneousIndustries}
          </label>
          <span className="text-xs text-gray-500">1-10</span>
        </div>
        <input
          id="industries-slider"
          type="range"
          min="1"
          max="10"
          value={simultaneousIndustries}
          onChange={(e) => onIndustriesChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Simultaneous Lookups */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="lookups-slider" className="text-sm text-gray-600">
            Simultaneous Lookups: {simultaneousLookups}
          </label>
          <span className="text-xs text-gray-500">1-20</span>
        </div>
        <input
          id="lookups-slider"
          type="range"
          min="1"
          max="20"
          value={simultaneousLookups}
          onChange={(e) => onLookupsChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Higher values = faster scraping but more resource usage. Adjust based on your system capabilities.
      </p>
    </div>
  );
}
