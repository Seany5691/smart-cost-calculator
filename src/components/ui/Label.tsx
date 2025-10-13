'use client';

import { forwardRef, LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  size?: 'sm' | 'md' | 'lg';
  required?: boolean;
  disabled?: boolean;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, size = 'md', required, disabled, children, ...props }, ref) => {
    const sizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    };

    return (
      <label
        ref={ref}
        className={cn(
          'block font-medium text-gray-700',
          sizes[size],
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">*</span>
        )}
      </label>
    );
  }
);

Label.displayName = 'Label';

export { Label };