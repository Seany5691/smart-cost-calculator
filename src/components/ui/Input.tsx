'use client';

import { forwardRef, InputHTMLAttributes, useState, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error' | 'success' | 'warning';
  inputSize?: 'sm' | 'md' | 'lg';
  isInvalid?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const InputComponent = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant = 'default', 
    inputSize = 'md', 
    type, 
    isInvalid,
    leftIcon,
    rightIcon,
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

    const baseClasses = 'w-full border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-400';
    
    const variants = {
      default: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400',
      error: 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50',
      success: 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50',
      warning: 'border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500 bg-yellow-50'
    };
    
    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-sm',
      lg: 'px-4 py-4 text-base'
    };

    // Adjust padding for icons
    const iconPadding = {
      sm: leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '',
      md: leftIcon ? 'pl-12' : rightIcon ? 'pr-12' : '',
      lg: leftIcon ? 'pl-14' : rightIcon ? 'pr-14' : ''
    };

    const finalVariant = isInvalid ? 'error' : variant;

    if (leftIcon || rightIcon) {
      return (
        <div className="relative">
          {leftIcon && (
            <div 
              className={cn(
                'absolute left-0 top-0 h-full flex items-center justify-center text-gray-400 pointer-events-none',
                inputSize === 'sm' ? 'w-10' : inputSize === 'lg' ? 'w-14' : 'w-12'
              )}
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              baseClasses,
              variants[finalVariant],
              sizes[inputSize],
              iconPadding[inputSize],
              shake && 'animate-shake',
              className
            )}
            ref={ref}
            aria-invalid={isInvalid}
            {...props}
          />
          {rightIcon && (
            <div 
              className={cn(
                'absolute right-0 top-0 h-full flex items-center justify-center text-gray-400 pointer-events-none',
                inputSize === 'sm' ? 'w-10' : inputSize === 'lg' ? 'w-14' : 'w-12'
              )}
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          baseClasses,
          variants[finalVariant],
          sizes[inputSize],
          shake && 'animate-shake',
          className
        )}
        ref={ref}
        aria-invalid={isInvalid}
        {...props}
      />
    );
  }
);

InputComponent.displayName = 'Input';

// Memoize the input component to prevent unnecessary re-renders
const Input = memo(InputComponent);

export { Input };