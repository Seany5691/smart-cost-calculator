'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover3D?: boolean;
  glow?: boolean;
}

export function GlassCard({ children, className, hover3D = false, glow = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        'relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-glass',
        'transition-all duration-300',
        hover3D && 'hover:scale-[1.02] hover:shadow-2xl',
        glow && 'hover:shadow-glow-lg',
        className
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl pointer-events-none"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
