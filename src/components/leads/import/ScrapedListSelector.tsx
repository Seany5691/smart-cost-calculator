'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Database, Calendar, MapPin, Building2, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useImportStore } from '@/store/leads/import';
import { useLeadsStore } from '@/store/leads/leads';
import { validateScraperData, transformScraperData } from '@/lib/leads/importUtils';

interface ScraperSession {
  id: string;
  name: string;
  created_at: string;
  total_results: number;
  location?: string;
  business_type?: string;
  status: 'completed' | 'processing' | 'failed';
}

interface ScrapedListSelectorProps {
  onImportComplete?: () => void;
  onCancel?: () => void;
}

export default function ScrapedListSelector({ onImportComplete, onCancel }: ScrapedListSelectorProps) {
  const [sessions, setSessions] = useState<ScraperSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ScraperSession | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [listName, setListName] = useState<string>('');
  const [listMode, setListMode] = useState<'new' | 'existing'>('new');
  const [existingLists, setExistingLists] = useState<string[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [step, setStep] = useState<'select' | 'preview' | 'importing'>('select');
  
  const { importFromScraper, isImporting, importProgress, error } = useImportStore();
  const { getUniqueListNames } = useLeadsStore();

  // Load existing lists on mount
  useEffect(() => {
    const lists = getUniqueListNames();
    setExistingLists(lists);
  }, [getUniqueListNames]);

  // Fetch scraper sessions
  const fetchScraperSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    setValidationErrors([]);
    
    try {
      const response = await fetch('/api/import/scraper-data');
      
      if (!response.ok) {
        throw new Error('Failed to fetch scraper sessions');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setSessions(data.data);
      } else {
        setValidationErrors(['No scraper sessions available']);
      }
    } catch (err: any) {
      setValidationErrors([err.message || 'Failed to load scraper sessions']);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // Load sessions on mount
  useEffect(() => {
    fetchScraperSessions();
  }, [fetchScraperSessions]);

  // Handle session selection
  const handleSessionSelect = useCallback(async (session: ScraperSession) => {
    setSelectedSession(session);
    setIsLoadingPreview(true);
    setValidationErrors([]);
    
    // Auto-fill list name from session name or location
    const autoName = session.location || session.name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    setListName(autoName);
    
    try {
      // Fetch session data for preview
      const response = await fetch(`/api/import/scraper-data?sessionId=${session.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch session data');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Invalid session data');
      }
      
      // Validate scraper data
      const validation = validateScraperData(data.data);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }
      
      // Transform and show preview (first 5 items)
      const transformedData = transformScraperData(data.data);
      setPreviewData(transformedData.slice(0, 5));
      setStep('preview');
    } catch (err: any) {
      setValidationErrors([err.message || 'Failed to load session preview']);
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  // Handle import
  const handleImport = useCallback(async () => {
    if (!selectedSession) return;
    
    // Validate list name
    if (!listName || listName.trim() === '') {
      setValidationErrors(['Please enter a list name']);
      return;
    }
    
    setStep('importing');
    
    try {
      await importFromScraper(selectedSession.id, listName.trim());
      onImportComplete?.();
    } catch (err: any) {
      setValidationErrors([err.message || 'Import failed']);
      setStep('preview');
    }
  }, [selectedSession, listName, importFromScraper, onImportComplete]);

  // Reset to selection step
  const handleReset = useCallback(() => {
    setSelectedSession(null);
    setPreviewData([]);
    setListName('');
    setListMode('new');
    setValidationErrors([]);
    setStep('select');
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render session selection step
  if (step === 'select') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Import from Scraper</h3>
            <p className="text-gray-400 text-sm">
              Select a scraped list from Smart Cost Calculator to import
            </p>
          </div>
          <button
            onClick={fetchScraperSessions}
            disabled={isLoadingSessions}
            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh sessions"
          >
            <RefreshCw className={`w-5 h-5 ${isLoadingSessions ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Loading state */}
        {isLoadingSessions && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        )}

        {/* Sessions list */}
        {!isLoadingSessions && sessions.length > 0 && (
          <div className="space-y-3">
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => handleSessionSelect(session)}
                disabled={session.status !== 'completed'}
                className={`
                  w-full text-left p-4 rounded-xl border transition-all
                  ${session.status === 'completed'
                    ? 'bg-gray-800/50 border-gray-700 hover:border-blue-500 hover:bg-gray-800'
                    : 'bg-gray-800/30 border-gray-800 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`
                      p-2 rounded-lg
                      ${session.status === 'completed' ? 'bg-green-500/20' : 'bg-gray-700/50'}
                    `}>
                      <Database className={`
                        w-5 h-5
                        ${session.status === 'completed' ? 'text-green-400' : 'text-gray-400'}
                      `} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium mb-1">{session.name}</h4>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(session.created_at)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-4 h-4" />
                          <span>{session.total_results} results</span>
                        </div>
                        
                        {session.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{session.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {session.business_type && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                            {session.business_type}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-3">
                    {session.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    {session.status === 'processing' && (
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    )}
                    {session.status === 'failed' && (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoadingSessions && sessions.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
              <Database className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-white font-medium mb-2">No Scraper Sessions Found</h4>
            <p className="text-gray-400 text-sm mb-4">
              No scraped lists are available from Smart Cost Calculator
            </p>
            <button
              onClick={fetchScraperSessions}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 font-medium mb-1">Error</p>
                <ul className="text-sm text-red-300 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Cancel button */}
        {onCancel && (
          <div className="flex justify-end pt-4 border-t border-gray-700">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render preview step
  if (step === 'preview') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Preview Scraped Data</h3>
          <p className="text-gray-400 text-sm">
            Review the data before importing
          </p>
        </div>

        {/* Session info */}
        {selectedSession && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Database className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium mb-1">{selectedSession.name}</h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                  <span>{selectedSession.total_results} leads</span>
                  <span>•</span>
                  <span>{formatDate(selectedSession.created_at)}</span>
                  {selectedSession.location && (
                    <>
                      <span>•</span>
                      <span>{selectedSession.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List Selection */}
        <div className="space-y-4">
          <label className="text-gray-900 font-medium">
            List Assignment <span className="text-red-600">*</span>
          </label>
          
          {/* Radio buttons for new/existing */}
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                value="new"
                checked={listMode === 'new'}
                onChange={(e) => setListMode(e.target.value as 'new')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-900">Create New List</span>
            </label>
            
            {existingLists.length > 0 && (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="existing"
                  checked={listMode === 'existing'}
                  onChange={(e) => setListMode(e.target.value as 'existing')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-900">Add to Existing List</span>
              </label>
            )}
          </div>

          {/* List name input or dropdown */}
          {listMode === 'new' ? (
            <div className="space-y-2">
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g., Potchefstroom, Klerksdorp, Rustenburg..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600">
                Auto-filled from scraper session. Edit to change the list name.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <select
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a list --</option>
                {existingLists.map(list => (
                  <option key={list} value={list}>{list}</option>
                ))}
              </select>
              <p className="text-sm text-gray-600">
                These leads will be added to the selected list.
              </p>
            </div>
          )}
        </div>

        {/* Loading preview */}
        {isLoadingPreview && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        )}

        {/* Preview data */}
        {!isLoadingPreview && previewData.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-white font-medium">Data Preview (First 5 leads)</h4>
            
            <div className="space-y-3">
              {previewData.map((lead, index) => (
                <div key={index} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white ml-2">{lead.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-white ml-2">{lead.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Provider:</span>
                      <span className="text-white ml-2">{lead.provider || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Business Type:</span>
                      <span className="text-white ml-2">{lead.type_of_business || 'N/A'}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-400">Address:</span>
                      <span className="text-white ml-2">{lead.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 font-medium mb-1">Validation Errors</p>
                <ul className="text-sm text-red-300 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Choose Different Session
          </button>
          
          <div className="flex space-x-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleImport}
              disabled={validationErrors.length > 0 || isLoadingPreview}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Import Leads
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render importing step
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Importing Leads</h3>
        <p className="text-gray-400 text-sm">
          Please wait while we import your leads from the scraper...
        </p>
      </div>

      {/* Progress indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className="text-white font-medium">{importProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${importProgress}%` }}
            />
          </div>
        </div>
        
        {selectedSession && (
          <div className="text-center text-sm text-gray-400">
            Importing {selectedSession.total_results} leads from {selectedSession.name}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium mb-1">Import Error</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
