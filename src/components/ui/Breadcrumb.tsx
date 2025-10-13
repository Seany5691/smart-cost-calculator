'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <Link 
        href="/" 
        className="flex items-center text-gray-500 hover:text-blue-600 transition-colors duration-200 group"
      >
        <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
        <span className="sr-only">Home</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {item.href && !item.active ? (
            <Link
              href={item.href}
              className="text-gray-500 hover:text-blue-600 transition-colors duration-200 hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className={`${item.active ? 'text-blue-600 font-medium' : 'text-gray-900'}`}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}