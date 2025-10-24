'use client';

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import type { LogViewerProps } from '@/lib/scraper/types';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const LogViewer = React.memo(({ logs, autoScroll = true }: LogViewerProps) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Limit to last 15 entries
  const displayedLogs = useMemo(() => {
    return logs.slice(-15);
  }, [logs]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [displayedLogs, autoScroll]);

  const getLogIcon = useCallback((level: 'info' | 'error' | 'success') => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  }, []);

  const getLogColor = useCallback((level: 'info' | 'error' | 'success') => {
    switch (level) {
      case 'error':
        return 'text-red-700 bg-red-50';
      case 'success':
        return 'text-green-700 bg-green-50';
      default:
        return 'text-gray-700 bg-white';
    }
  }, []);

  const formatTimestamp = useCallback((timestamp: string) => {
    try {
      const date = new Date(timestamp);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '00:00:00';
      }
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return '00:00:00';
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg shadow-lg">
            <Info className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Activity Log
            </h3>
            <p className="text-xs text-gray-600">
              {displayedLogs.length} {displayedLogs.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        </div>
      </div>

      <div
        ref={logContainerRef}
        className="bg-gray-50 rounded-lg border border-gray-200 p-3 h-80 overflow-y-auto space-y-1"
      >
        {displayedLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-sm">No activity yet. Start scraping to see logs.</p>
          </div>
        ) : (
          displayedLogs.map((log, index) => (
            <div
              key={`${log.timestamp}-${index}`}
              className={`flex items-start gap-2 p-1.5 rounded text-xs ${getLogColor(log.level)}`}
            >
              <div className="flex-shrink-0 mt-0.5">{getLogIcon(log.level)}</div>
              <div className="flex-1 min-w-0">
                <span className="text-gray-500 mr-1.5 font-medium">[{formatTimestamp(log.timestamp)}]</span>
                <span className="break-words">{log.message}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

LogViewer.displayName = 'LogViewer';

export default LogViewer;
