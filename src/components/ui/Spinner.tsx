'use client';

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray' | 'success' | 'danger';
  className?: string;
}

export function Spinner({ size = 'md', color = 'primary', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4'
  };

  const colorClasses = {
    primary: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
    success: 'border-green-600 border-t-transparent',
    danger: 'border-red-600 border-t-transparent'
  };

  return (
    <div
      className={cn(
        'inline-block rounded-full animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function SpinnerOverlay({ message = 'Loading...', className }: { message?: string; className?: string }) {
  return (
    <div className={cn('fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50', className)}>
      <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center space-y-4">
        <Spinner size="xl" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
}

export function SpinnerInline({ message, className }: { message?: string; className?: string }) {
  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <Spinner size="sm" />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
}
