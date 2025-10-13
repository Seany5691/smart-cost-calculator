'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Check, Minus } from 'lucide-react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  variant?: 'default' | 'error' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  isInvalid?: boolean;
  indeterminate?: boolean;
  label?: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    isInvalid,
    indeterminate,
    label,
    description,
    checked,
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'border-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      default: 'border-gray-300 focus:ring-blue-500 checked:bg-blue-600 checked:border-blue-600',
      error: 'border-red-300 focus:ring-red-500 checked:bg-red-600 checked:border-red-600',
      success: 'border-green-300 focus:ring-green-500 checked:bg-green-600 checked:border-green-600',
      warning: 'border-yellow-300 focus:ring-yellow-500 checked:bg-yellow-600 checked:border-yellow-600'
    };
    
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    const finalVariant = isInvalid ? 'error' : variant;

    if (label || description) {
      return (
        <div className="flex items-start space-x-3">
          <div className="relative flex items-center justify-center">
            <input
              ref={ref}
              type="checkbox"
              className={cn(
                baseClasses,
                variants[finalVariant],
                sizes[size],
                'appearance-none',
                className
              )}
              checked={checked}
              disabled={disabled}
              aria-invalid={isInvalid}
              aria-checked={indeterminate ? 'mixed' : checked}
              {...props}
            />
            {(checked || indeterminate) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                {indeterminate ? (
                  <Minus className={cn('text-white', iconSizes[size])} />
                ) : (
                  <Check className={cn('text-white', iconSizes[size])} />
                )}
              </div>
            )}
          </div>
          <div className="flex-1">
            {label && (
              <label className={cn(
                'block font-medium text-gray-700 cursor-pointer',
                size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-sm',
                disabled && 'opacity-50 cursor-not-allowed'
              )}>
                {label}
              </label>
            )}
            {description && (
              <p className={cn(
                'text-gray-500 mt-1',
                size === 'sm' ? 'text-xs' : 'text-sm'
              )} id={props.id ? `${props.id}-description` : undefined}>
                {description}
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="relative inline-flex items-center justify-center">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            baseClasses,
            variants[finalVariant],
            sizes[size],
            'appearance-none',
            className
          )}
          checked={checked}
          disabled={disabled}
          aria-invalid={isInvalid}
          aria-checked={indeterminate ? 'mixed' : checked}
          {...props}
        />
        {(checked || indeterminate) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
            {indeterminate ? (
              <Minus className={cn('text-white', iconSizes[size])} />
            ) : (
              <Check className={cn('text-white', iconSizes[size])} />
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };