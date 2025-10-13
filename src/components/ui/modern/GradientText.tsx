'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  animated?: boolean;
  gradient?: 'blue-purple' | 'purple-pink' | 'blue-pink' | 'rainbow';
}

export function GradientText({ 
  children, 
  className, 
  animated = false,
  gradient = 'blue-purple'
}: GradientTextProps) {
  const gradients = {
    'blue-purple': 'from-blue-600 via-purple-600 to-purple-600',
    'purple-pink': 'from-purple-600 via-pink-600 to-pink-600',
    'blue-pink': 'from-blue-600 via-purple-600 to-pink-600',
    'rainbow': 'from-blue-600 via-purple-600 via-pink-600 to-red-600',
  };

  return (
    <span 
      className={cn(
        'bg-gradient-to-r bg-clip-text text-transparent font-bold',
        gradients[gradient],
        animated && 'animate-gradient bg-[length:200%_200%]',
        className
      )}
    >
      {children}
    </span>
  );
}
