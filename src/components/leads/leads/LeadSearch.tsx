'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Filter, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Lead, LeadSearchFilters, LeadStatus, LEAD_STATUSES } from '@/lib/leads/types';
import { useLeadsStore } from '@/store/leads/leads';
import { storage, STORAGE_KEYS } from '@/lib/leads/localStorage';

interface SavedSearch {
  id: string;
  name: string;
  filters: LeadSearchFilters;
  created_at: string;
}

interface LeadSearchProps {
  onSearchResults?: (leads: Lead[]) => void;
  showResults?: boolean;
  compact?: boolean;
}

export function LeadSearch({ onSearchResults, showResults = false, compact = false }: LeadSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<LeadSearchFilters>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchName, setSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  const { leads, searchLeads, isLoading } = useLeadsStore();

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = storage.get<SavedSearch[]>(STORAGE_KEYS.SAVED_SEARCHES) || [];
    setSavedSearches(saved);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm || Object.keys(filters).length > 0) {
        performSearch();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

  const performSearch = useCallback(async () => {
    const searchFilters: LeadSearchFilters = {
      ...filters,
      searchTerm: searchTerm || undefined
    };
    
    await searchLeads(searchFilters);
  }, [searchTerm, filters, searchLeads]);

  const filteredLeads = useMemo(() => {
    let results = [...leads];

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(lead =>
        lead.name.toLowerCase().includes(term) ||
        lead.maps_address.toLowerCase().includes(term) ||
        lead.phone?.toLowerCase().includes(term) ||
        lead.provider?.toLowerCase().includes(term) ||
        lead.type_of_business?.toLowerCase().includes(term) ||
        lead.address?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (filters.status) {
      results = results.filter(lead => lead.status === filters.status);
    }

    // Apply provider filter
    if (filters.provider) {
      results = results.filter(lead => lead.provider === filters.provider);
    }

    // Apply business type filter
    if (filters.business_type) {
      results = results.filter(lead => 
        lead.type_of_business?.toLowerCase().includes(filters.business_type!.toLowerCase())
      );
    }

    // Apply date range filter
    if (filters.date_from || filters.date_to) {
      results = results.filter(lead => {
        const leadDate = new Date(lead.created_at);
        if (filters.date_from && leadDate < new Date(filters.date_from)) return false;
        if (filters.date_to && leadDate > new Date(filters.date_to)) return false;
        return true;
      });
    }

    // Apply callback date range filter
    if (filters.callback_date_from || filters.callback_date_to) {
      results = results.filter(lead => {
        if (!lead.date_to_call_back) return false;
        const callbackDate = new Date(lead.date_to_call_back);
        if (filters.callback_date_from && callbackDate < new Date(filters.callback_date_from)) return false;
        if (filters.callback_date_to && callbackDate > new Date(filters.callback_date_to)) return false;
        return true;
      });
    }

    return results;
  }, [leads, searchTerm, filters]);

  useEffect(() => {
    if (onSearchResults) {
      onSearchResults(filteredLeads);
    }
  }, [filteredLeads, onSearchResults]);

  const handleFilterChange = (key: keyof LeadSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({});
  };

  const saveSearch = () => {
    if (!searchName.trim()) return;

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName,
      filters: { ...filters, searchTerm },
      created_at: new Date().toISOString()
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    storage.set(STORAGE_KEYS.SAVED_SEARCHES, updated);
    setSearchName('');
    setShowSaveDialog(false);
  };

  const loadSearch = (search: SavedSearch) => {
    setSearchTerm(search.filters.searchTerm || '');
    setFilters(search.filters);
  };

  const deleteSearch = (searchId: string) => {
    const updated = savedSearches.filter(s => s.id !== searchId);
    setSavedSearches(updated);
    storage.set(STORAGE_KEYS.SAVED_SEARCHES, updated);
  };

  const uniqueProviders = useMemo(() => {
    const providers = new Set(leads.map(l => l.provider).filter(Boolean));
    return Array.from(providers).sort();
  }, [leads]);

  const uniqueBusinessTypes = useMemo(() => {
    const types = new Set(leads.map(l => l.type_of_business).filter(Boolean));
    return Array.from(types).sort();
  }, [leads]);

  if (compact) {
    return (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, address, phone, provider, or business type..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-5 h-5" />
          Filters
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {(searchTerm || Object.keys(filters).length > 0) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
          >
            <X className="w-5 h-5" />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {LEAD_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select
              value={filters.provider || ''}
              onChange={(e) => handleFilterChange('provider', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Providers</option>
              {uniqueProviders.map(provider => (
                <option key={provider || 'unknown'} value={provider || ''}>
                  {provider}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
            <select
              value={filters.business_type || ''}
              onChange={(e) => handleFilterChange('business_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {uniqueBusinessTypes.map(type => (
                <option key={type || 'unknown'} value={type || ''}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created From</label>
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created To</label>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Callback From</label>
            <input
              type="date"
              value={filters.callback_date_from || ''}
              onChange={(e) => handleFilterChange('callback_date_from', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Callback To</label>
            <input
              type="date"
              value={filters.callback_date_to || ''}
              onChange={(e) => handleFilterChange('callback_date_to', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Save Search */}
      <div className="flex items-center gap-2">
        {!showSaveDialog ? (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            <Save className="w-4 h-4" />
            Save Search
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search name..."
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={saveSearch}
              disabled={!searchName.trim()}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setSearchName('');
              }}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Saved Searches</h3>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map(search => (
              <div
                key={search.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg group"
              >
                <button
                  onClick={() => loadSearch(search)}
                  className="text-sm text-gray-700 hover:text-blue-600"
                >
                  {search.name}
                </button>
                <button
                  onClick={() => deleteSearch(search.id)}
                  className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Count */}
      {showResults && (
        <div className="text-sm text-gray-600">
          {isLoading ? (
            <span>Searching...</span>
          ) : (
            <span>
              Found {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
