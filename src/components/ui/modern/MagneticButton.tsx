'use client';

import { useRef, useState, ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export function MagneticButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  glow = false,
  className,
  ...props 
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg',
    secondary: 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400 shadow-md',
    outline: 'border-2 border-blue-500 text-blue-600 hover:bg-blue-50 bg-white shadow-md',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: 'transform 0.2s ease-out',
      }}
      className={cn(
        'relative overflow-hidden group rounded-xl font-medium',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'transition-all duration-200 transform hover:scale-105 active:scale-95',
        'touch-manipulation',
        variants[variant],
        sizes[size],
        glow && 'hover:shadow-glow-lg',
        className
      )}
      {...props}
    >
      {/* Ripple effect */}
      <span className="absolute inset-0 bg-white/20 scale-0 group-active:scale-100 transition-transform duration-300 rounded-full"></span>
      
      {/* Glow effect */}
      {glow && (
        <span className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-purple-500/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
      )}
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center space-x-2">
        {children}
      </span>
    </button>
  );
}
