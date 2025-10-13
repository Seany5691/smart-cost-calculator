'use client';

import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export interface FormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'vertical' | 'horizontal';
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ 
    label,
    description,
    error,
    success,
    warning,
    info,
    required,
    children,
    className,
    labelClassName,
    size = 'md',
    layout = 'vertical',
    ...props 
  }, ref) => {
    const spacing = {
      sm: 'space-y-1',
      md: 'space-y-2',
      lg: 'space-y-3'
    };

    const labelSizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    };

    const messageSizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm'
    };

    const isHorizontal = layout === 'horizontal';
    const hasValidationMessage = error || success || warning || info;

    return (
      <div 
        ref={ref}
        className={cn(
          isHorizontal ? 'flex items-start space-x-4' : spacing[size],
          className
        )}
        {...props}
      >
        {label && (
          <div className={isHorizontal ? 'flex-shrink-0 w-1/3 pt-3' : ''}>
            <label className={cn(
              'block font-medium text-gray-700',
              labelSizes[size],
              labelClassName
            )}>
              {label}
              {required && (
                <span className="text-red-500 ml-1" aria-label="required">*</span>
              )}
            </label>
            {description && (
              <p className={cn(
                'text-gray-500 mt-1',
                messageSizes[size]
              )}>
                {description}
              </p>
            )}
          </div>
        )}
        
        <div className={isHorizontal ? 'flex-1' : ''}>
          <div className={cn(
            !isHorizontal && hasValidationMessage ? 'mb-1' : ''
          )}>
            {children}
          </div>
          
          {/* Validation Messages with animations */}
          {error && (
            <div className={cn(
              'flex items-start space-x-2 text-red-600 mt-1 animate-in fade-in slide-in-from-top-1 duration-200',
              messageSizes[size]
            )}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 animate-pulse" />
              <span className="font-medium">{error}</span>
            </div>
          )}
          
          {success && !error && (
            <div className={cn(
              'flex items-start space-x-2 text-green-600 mt-1 animate-in fade-in slide-in-from-top-1 duration-200',
              messageSizes[size]
            )}>
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{success}</span>
            </div>
          )}
          
          {warning && !error && !success && (
            <div className={cn(
              'flex items-start space-x-2 text-yellow-600 mt-1 animate-in fade-in slide-in-from-top-1 duration-200',
              messageSizes[size]
            )}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{warning}</span>
            </div>
          )}
          
          {info && !error && !success && !warning && (
            <div className={cn(
              'flex items-start space-x-2 text-blue-600 mt-1 animate-in fade-in slide-in-from-top-1 duration-200',
              messageSizes[size]
            )}>
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{info}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export { FormField };