'use client';

import React, { useState } from 'react';
import { Phone, Search, Loader2 } from 'lucide-react';
import { authenticatedFetch } from '@/lib/scraper/apiClient';

export default function NumberLookup() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProvider(null);

    try {
      const response = await authenticatedFetch('/api/lookup', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Lookup failed');
      }

      const data = await response.json();
      setProvider(data.provider);
    } catch (err) {
      setError('Failed to lookup provider. Please try again.');
      console.error('Lookup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup();
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-lg">
          <Phone className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Number Lookup</h3>
          <p className="text-xs text-gray-600">Check phone number provider</p>
        </div>
      </div>

      {/* Input and Button */}
      <div className="flex items-center gap-3">
        {/* Phone Input */}
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., +27 68 612 8512 or 0686128512"
          className="input flex-1"
          disabled={isLoading}
        />

        {/* Lookup Button */}
        <button
          onClick={handleLookup}
          disabled={isLoading || !phoneNumber.trim()}
          className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Looking up...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Lookup
            </>
          )}
        </button>
      </div>

      {/* Provider Result - Below input */}
      {provider && !isLoading && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Provider:</span>
            <span className="text-lg font-bold text-green-700">{provider}</span>
          </div>
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
        Enter a South African phone number. Formats like +27, 27, or 0 are supported.
      </p>
    </div>
  );
}
