'use client';

import { useState, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
}

export function FloatingInput({ label, error, success, className, ...props }: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          setHasValue(e.target.value !== '');
          props.onBlur?.(e);
        }}
        className={cn(
          'peer w-full px-4 pt-6 pb-2 text-base',
          'border-2 rounded-xl',
          'transition-all duration-300',
          'bg-white',
          'focus:outline-none focus:ring-4',
          error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
            : success
            ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'placeholder:text-transparent',
          className
        )}
      />
      
      <label
        className={cn(
          'absolute left-4 transition-all duration-300 pointer-events-none',
          'font-medium',
          isFocused || hasValue || props.value
            ? 'top-2 text-xs'
            : 'top-1/2 -translate-y-1/2 text-base',
          error
            ? 'text-red-600'
            : success
            ? 'text-green-600'
            : isFocused
            ? 'text-blue-600'
            : 'text-gray-500'
        )}
      >
        {label}
      </label>
      
      {/* Animated border */}
      <div className={cn(
        'absolute bottom-0 left-0 h-0.5 transition-all duration-300',
        error
          ? 'bg-gradient-to-r from-red-500 to-rose-500'
          : success
          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
          : 'bg-gradient-to-r from-blue-500 to-purple-500',
        isFocused ? 'w-full' : 'w-0'
      )}></div>
      
      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center space-x-1 animate-slide-down">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
      
      {/* Success message */}
      {success && !error && (
        <p className="mt-1 text-sm text-green-600 flex items-center space-x-1 animate-slide-down">
          <span>✓</span>
          <span>Looks good!</span>
        </p>
      )}
    </div>
  );
}
