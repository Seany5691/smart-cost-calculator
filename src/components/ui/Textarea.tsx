'use client';

import { forwardRef, TextareaHTMLAttributes, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'error' | 'success' | 'warning';
  inputSize?: 'sm' | 'md' | 'lg';
  isInvalid?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant = 'default', 
    inputSize = 'md', 
    isInvalid,
    resize = 'vertical',
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
      sm: 'px-3 py-2 text-sm min-h-[80px]',
      md: 'px-4 py-3 text-sm min-h-[100px]',
      lg: 'px-4 py-4 text-base min-h-[120px]'
    };

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    };

    const finalVariant = isInvalid ? 'error' : variant;

    return (
      <textarea
        ref={ref}
        className={cn(
          baseClasses,
          variants[finalVariant],
          sizes[inputSize],
          resizeClasses[resize],
          shake && 'animate-shake',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };