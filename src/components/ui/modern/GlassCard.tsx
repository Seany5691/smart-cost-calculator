'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover3D?: boolean;
  glow?: boolean;
}

export function GlassCard({ children, className, hover3D = false, glow = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        'relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl',
        'shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
        'transition-all duration-300',
        hover3D && 'hover:scale-[1.02]',
        glow && 'md:hover:shadow-[0_0_40px_rgba(59,130,246,0.3),0_8px_32px_rgba(0,0,0,0.12)]',
        className
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl pointer-events-none"></div>
      
      {/* Glow border on hover (desktop only) */}
      {glow && (
        <div className="hidden md:block absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl"></div>
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
