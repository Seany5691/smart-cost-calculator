'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { ResultsTableProps, Business } from '@/lib/scraper/types';
import { ChevronUp, ChevronDown, Search, ExternalLink } from 'lucide-react';

type SortField = keyof Business;
type SortDirection = 'asc' | 'desc';

const ResultsTable = React.memo(({ businesses, onExport }: ResultsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter businesses based on search term
  const filteredBusinesses = useMemo(() => {
    if (!searchTerm) return businesses;

    const term = searchTerm.toLowerCase();
    return businesses.filter(
      (business) =>
        business.name.toLowerCase().includes(term) ||
        business.town.toLowerCase().includes(term) ||
        business.type_of_business.toLowerCase().includes(term) ||
        business.phone.toLowerCase().includes(term) ||
        business.provider.toLowerCase().includes(term) ||
        business.address.toLowerCase().includes(term)
    );
  }, [businesses, searchTerm]);

  // Sort businesses (memoized for performance)
  const sortedBusinesses = useMemo(() => {
    const sorted = [...filteredBusinesses];
    sorted.sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredBusinesses, sortField, sortDirection]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };



  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-medium text-gray-700">
          Results ({sortedBusinesses.length} businesses)
        </h3>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search businesses..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Virtualized Table */}
      <div className="glass-card overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-7 gap-4 px-4 py-3 text-sm font-medium text-gray-700">
            <div
              onClick={() => handleSort('name')}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors px-2 py-1 rounded"
            >
              Name
              <SortIcon field="name" />
            </div>
            <div
              onClick={() => handleSort('phone')}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors px-2 py-1 rounded"
            >
              Phone
              <SortIcon field="phone" />
            </div>
            <div
              onClick={() => handleSort('provider')}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors px-2 py-1 rounded"
            >
              Provider
              <SortIcon field="provider" />
            </div>
            <div
              onClick={() => handleSort('type_of_business')}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors px-2 py-1 rounded"
            >
              Industry
              <SortIcon field="type_of_business" />
            </div>
            <div
              onClick={() => handleSort('town')}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors px-2 py-1 rounded"
            >
              Town
              <SortIcon field="town" />
            </div>
            <div className="px-2 py-1">Address</div>
            <div className="px-2 py-1">Map</div>
          </div>
        </div>

        {/* Table Body */}
        {sortedBusinesses.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            {businesses.length === 0
              ? 'No businesses scraped yet. Start scraping to see results.'
              : 'No businesses match your search.'}
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {sortedBusinesses.map((business, index) => (
              <div
                key={`${business.name}-${index}`}
                className="flex items-center border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 grid grid-cols-7 gap-4 px-4 py-3 text-sm">
                  <div className="font-medium text-gray-900 truncate">{business.name}</div>
                  <div className="text-gray-700 truncate">{business.phone || '-'}</div>
                  <div className="text-gray-700 truncate">{business.provider || '-'}</div>
                  <div className="text-gray-700 truncate">{business.type_of_business}</div>
                  <div className="text-gray-700 truncate">{business.town}</div>
                  <div className="text-gray-700 truncate">{business.address || '-'}</div>
                  <div className="text-gray-700">
                    {business.maps_address ? (
                      <a
                        href={business.maps_address}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer with count */}
        {sortedBusinesses.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-700">
              Showing {sortedBusinesses.length} result{sortedBusinesses.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ResultsTable.displayName = 'ResultsTable';

export default ResultsTable;
