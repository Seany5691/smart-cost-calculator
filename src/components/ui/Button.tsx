'use client';

import { forwardRef, ButtonHTMLAttributes, memo } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const ButtonComponent = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden';
    
    const variants = {
      primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-lg',
      secondary: 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400 focus:ring-gray-500 shadow-md',
      success: 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 focus:ring-green-500 shadow-lg',
      danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500 shadow-lg',
      outline: 'border-2 border-blue-500 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 bg-white shadow-md',
      ghost: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-500'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-sm rounded-lg',
      lg: 'px-6 py-3 text-base rounded-lg'
    };

    const spinnerSizes = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          loading && 'cursor-wait',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        aria-live={loading ? 'polite' : undefined}
        {...props}
      >
        {loading && (
          <>
            <div 
              className={cn('animate-spin rounded-full border-b-2 border-current mr-2', spinnerSizes[size])} 
              role="status"
              aria-label="Loading"
            />
            <span className="opacity-75">{children}</span>
          </>
        )}
        {!loading && children}
      </button>
    );
  }
);

ButtonComponent.displayName = 'Button';

// Memoize the button component to prevent unnecessary re-renders
const Button = memo(ButtonComponent);

export { Button };