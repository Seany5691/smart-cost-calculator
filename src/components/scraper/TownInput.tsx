'use client';

import React from 'react';
import type { TownInputProps } from '@/lib/scraper/types';
import { MapPin } from 'lucide-react';

export default function TownInput({ value, onChange, disabled }: TownInputProps) {
  const townCount = value.split('\n').filter(t => t.trim()).length;
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Towns to Scrape
          </h3>
          <p className="text-xs text-gray-600">
            {townCount} town{townCount !== 1 ? 's' : ''} • One per line
          </p>
        </div>
      </div>

      {/* Input - Fixed height to match Industry Categories */}
      <textarea
        id="town-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="e.g.&#10;Johannesburg, Gauteng&#10;Cape Town, Western Cape&#10;Durban, KwaZulu-Natal"
        className="input resize-none w-full h-80 p-4"
      />
      
      {/* Help text - Bigger and more visible */}
      <p className="text-sm text-gray-600 font-medium">
        💡 Enter each town on a new line. Include province for better accuracy.
      </p>
    </div>
  );
}
