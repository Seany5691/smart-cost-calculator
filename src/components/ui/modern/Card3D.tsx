'use client';

import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Card3DProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

export function Card3D({ children, className, intensity = 10 }: Card3DProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / intensity;
    const rotateY = (centerX - x) / intensity;
    
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1, 1, 1)`,
        transition: 'transform 0.3s ease-out',
      }}
      className={cn(
        'relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6',
        'shadow-2xl border border-gray-200 hover:shadow-3xl',
        'transition-shadow duration-300',
        className
      )}
    >
      {/* Shine effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{
          transform: `translate(${rotation.y * 2}px, ${rotation.x * 2}px)`,
        }}
      ></div>
      
      {/* Gradient border glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"></div>
      
      {children}
    </div>
  );
}
