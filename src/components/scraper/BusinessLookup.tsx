'use client';

import React, { useState } from 'react';
import { Building2, Search, Loader2, Phone } from 'lucide-react';
import { authenticatedFetch } from '@/lib/scraper/apiClient';

interface BusinessResult {
  name: string;
  phone: string;
  provider: string;
}

export default function BusinessLookup() {
  const [businessQuery, setBusinessQuery] = useState('');
  const [results, setResults] = useState<BusinessResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!businessQuery.trim()) {
      setError('Please enter a business name and location');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await authenticatedFetch('/api/business-lookup', {
        method: 'POST',
        body: JSON.stringify({ businessQuery }),
      });

      if (!response.ok) {
        throw new Error('Lookup failed');
      }

      const data = await response.json();
      setResults(data.results || []);
      
      if (data.results.length === 0) {
        setError('No businesses found. Try a different search.');
      }
    } catch (err) {
      setError('Failed to lookup businesses. Please try again.');
      console.error('Business lookup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup();
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Business Lookup</h3>
          <p className="text-xs text-gray-600">Find top 3 businesses on Google Maps</p>
        </div>
      </div>

      {/* Input and Button */}
      <div className="flex items-center gap-3">
        {/* Business Query Input */}
        <input
          type="text"
          value={businessQuery}
          onChange={(e) => setBusinessQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Shoprite, Stilfontein"
          className="input flex-1"
          disabled={isLoading}
        />

        {/* Lookup Button */}
        <button
          onClick={handleLookup}
          disabled={isLoading || !businessQuery.trim()}
          className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Search
            </>
          )}
        </button>
      </div>

      {/* Results - Below input */}
      {results.length > 0 && !isLoading && (
        <div className="space-y-2">
          {results.map((business, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">
                    {index + 1}. {business.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-600">{business.phone}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-200 text-green-700 border border-green-300">
                    {business.provider}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </p>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Enter business name and location (e.g., "Shoprite, Stilfontein")
      </p>
    </div>
  );
}
