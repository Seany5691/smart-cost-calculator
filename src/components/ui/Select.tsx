'use client';

import { forwardRef, SelectHTMLAttributes, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'error' | 'success' | 'warning';
  inputSize?: 'sm' | 'md' | 'lg';
  isInvalid?: boolean;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    variant = 'default', 
    inputSize = 'md', 
    isInvalid,
    placeholder,
    children,
    ...props 
  }, ref) => {
    const [shake, setShake] = useState(false);
    
    // Trigger shake animation when isInvalid changes to true
    useEffect(() => {
      if (isInvalid) {
        setShake(true);
        const timer = setTimeout(() => setShake(false), 500);
        return () => clearTimeout(timer);
      }
    }, [isInvalid]);

    const baseClasses = 'w-full border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer';
    
    const variants = {
      default: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400',
      error: 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50',
      success: 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50',
      warning: 'border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500 bg-yellow-50'
    };
    
    const sizes = {
      sm: 'px-3 py-2 pr-8 text-sm',
      md: 'px-4 py-3 pr-10 text-sm',
      lg: 'px-4 py-4 pr-12 text-base'
    };

    const iconSizes = {
      sm: 'w-4 h-4 right-2',
      md: 'w-5 h-5 right-3',
      lg: 'w-6 h-6 right-3'
    };

    const finalVariant = isInvalid ? 'error' : variant;

    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            baseClasses,
            variants[finalVariant],
            sizes[inputSize],
            shake && 'animate-shake',
            className
          )}
          aria-invalid={isInvalid}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown 
          className={cn(
            'absolute top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none',
            iconSizes[inputSize]
          )} 
          aria-hidden="true"
        />
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };