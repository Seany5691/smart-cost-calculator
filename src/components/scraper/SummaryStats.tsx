'use client';

import React, { useMemo, useCallback } from 'react';
import type { SummaryStatsProps } from '@/lib/scraper/types';
import { MapPin, Building2, Clock, TrendingUp } from 'lucide-react';

const SummaryStats = React.memo(({
  totalTowns,
  totalBusinesses,
  totalDuration,
  averageBusinessesPerTown,
}: SummaryStatsProps) => {
  const formatDuration = useCallback((ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }, []);

  const stats = useMemo(() => [
    {
      label: 'Towns Scraped',
      value: totalTowns,
      icon: MapPin,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Businesses',
      value: totalBusinesses,
      icon: Building2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Total Duration',
      value: formatDuration(totalDuration),
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Avg per Town',
      value: averageBusinessesPerTown.toFixed(1),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ], [totalTowns, totalBusinesses, totalDuration, averageBusinessesPerTown, formatDuration]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Summary Statistics
          </h3>
          <p className="text-xs text-gray-600">
            Scraping session results
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-gray-50 rounded-lg border border-gray-200 p-2">
              <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{stat.label}</span>
              </div>
              <p className="text-base font-bold text-gray-800">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Time Progress Bar at Bottom */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Time Taken</span>
          <span className="font-semibold text-gray-800">{formatDuration(totalDuration)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 ease-out rounded-full"
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
});

SummaryStats.displayName = 'SummaryStats';

export default SummaryStats;
