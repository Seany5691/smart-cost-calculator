'use client';

import { forwardRef, HTMLAttributes, memo } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'glass' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const CardComponent = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const baseClasses = 'rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-2xl';
    
    const variants = {
      default: 'bg-white shadow-xl hover:border-gray-200',
      gradient: 'bg-gradient-to-br from-white to-gray-50 shadow-xl hover:from-gray-50 hover:to-gray-100',
      glass: 'bg-white/80 backdrop-blur-md shadow-xl border-white/20 hover:bg-white/90',
      elevated: 'bg-white shadow-2xl hover:shadow-3xl'
    };
    
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    return (
      <div
        className={cn(
          baseClasses,
          variants[variant],
          paddings[padding],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardComponent.displayName = 'Card';

// Memoize the card component to prevent unnecessary re-renders
const Card = memo(CardComponent);

const CardHeaderComponent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-6', className)}
      {...props}
    />
  )
);
CardHeaderComponent.displayName = 'CardHeader';
const CardHeader = memo(CardHeaderComponent);

const CardTitleComponent = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-bold gradient-text', className)}
      {...props}
    />
  )
);
CardTitleComponent.displayName = 'CardTitle';
const CardTitle = memo(CardTitleComponent);

const CardDescriptionComponent = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-gray-600', className)}
      {...props}
    />
  )
);
CardDescriptionComponent.displayName = 'CardDescription';
const CardDescription = memo(CardDescriptionComponent);

const CardContentComponent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);
CardContentComponent.displayName = 'CardContent';
const CardContent = memo(CardContentComponent);

const CardFooterComponent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-6', className)}
      {...props}
    />
  )
);
CardFooterComponent.displayName = 'CardFooter';
const CardFooter = memo(CardFooterComponent);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };