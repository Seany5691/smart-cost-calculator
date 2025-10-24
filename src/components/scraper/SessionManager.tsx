'use client';

import React, { useState } from 'react';
import type { SessionManagerProps } from '@/lib/scraper/types';
import { X, Save, FolderOpen, Loader2, Calendar, MapPin, Building2 } from 'lucide-react';

export default function SessionManager({
  isOpen,
  mode,
  sessions,
  onClose,
  onSave,
  onLoad,
}: SessionManagerProps) {
  const [sessionName, setSessionName] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!sessionName.trim()) return;

    setIsLoading(true);
    try {
      await onSave(sessionName.trim());
      setSessionName('');
      onClose();
    } catch (error) {
      console.error('Error saving session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async () => {
    if (!selectedSessionId) return;

    setIsLoading(true);
    try {
      await onLoad(selectedSessionId);
      setSelectedSessionId(null);
      onClose();
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {mode === 'save' ? (
              <Save className="w-6 h-6 text-blue-600" />
            ) : (
              <FolderOpen className="w-6 h-6 text-blue-600" />
            )}
            <h2 className="text-xl font-semibold text-gray-800">
              {mode === 'save' ? 'Save Session' : 'Load Session'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'save' ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="session-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Session Name
                </label>
                <input
                  id="session-name"
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && sessionName.trim()) {
                      handleSave();
                    }
                  }}
                  placeholder="e.g., Johannesburg Scrape - Jan 2024"
                  className="input"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              <p className="text-sm text-gray-500">
                Give your session a descriptive name to easily identify it later.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No saved sessions found.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Complete a scraping session and save it to see it here.
                  </p>
                </div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    disabled={isLoading}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedSessionId === session.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{session.name}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(session.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{session.town_count} towns</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>{session.business_count} businesses</span>
                          </div>
                        </div>
                      </div>
                      {selectedSessionId === session.id && (
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          {mode === 'save' ? (
            <button
              onClick={handleSave}
              disabled={!sessionName.trim() || isLoading}
              className="btn btn-primary flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Session
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleLoad}
              disabled={!selectedSessionId || isLoading}
              className="btn btn-primary flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <FolderOpen className="w-4 h-4" />
                  Load Session
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
