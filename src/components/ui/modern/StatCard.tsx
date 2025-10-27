'use client';

import { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number;
  prefix?: string;
  suffix?: string;
  animated?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend,
  prefix = '',
  suffix = '',
  animated = true,
  className,
  style
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseInt(value) || 0;

  useEffect(() => {
    if (!animated || typeof value !== 'number') {
      setDisplayValue(numericValue);
      return;
    }

    let start = 0;
    const end = numericValue;
    const duration = 2000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, animated, numericValue]);

  return (
    <div 
      className={cn(
        'group relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 sm:p-4',
        'shadow-md border border-gray-200',
        'hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5',
        className
      )}
      style={style}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative flex items-center space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 inline-flex p-2 sm:p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md group-hover:scale-105 transition-transform duration-300">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        
        {/* Value and Label */}
        <div className="flex-1 min-w-0">
          <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {prefix}{typeof value === 'number' ? displayValue.toLocaleString() : value}{suffix}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 truncate">{label}</p>
        </div>
        
        {/* Trend indicator - only show on larger screens */}
        {trend !== undefined && (
          <div className={cn(
            'hidden sm:inline-flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-md flex-shrink-0',
            trend > 0 ? 'text-green-600 bg-green-50' : trend < 0 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50'
          )}>
            <span>{trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}</span>
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
