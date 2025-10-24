'use client';

import React from 'react';
import type { ControlPanelProps } from '@/lib/scraper/types';
import {
  Play,
  Square,
  Pause,
  Save,
  FolderOpen,
  Trash2,
  Download,
  Loader2,
  Gamepad2,
} from 'lucide-react';

export default function ControlPanel({
  status,
  onStart,
  onStop,
  onPause,
  onResume,
  onSave,
  onLoad,
  onClear,
  onExport,
  hasData,
  isSaving,
  isLoading,
  isExporting,
}: ControlPanelProps & {
  isSaving?: boolean;
  isLoading?: boolean;
  isExporting?: boolean;
}) {
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';
  const isStopped = status === 'stopped';
  const isCompleted = status === 'completed';
  const isActive = isRunning || isPaused;

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg">
          <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            Controls
          </h3>
          <p className="text-xs text-gray-600 hidden sm:block">
            Start, stop, and manage scraping
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Start Button */}
        <button
          type="button"
          onClick={onStart}
          disabled={isActive}
          className="btn btn-success flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Start scraping"
        >
          {isRunning ? (
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <Play className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
          <span>Start</span>
        </button>

        {/* Stop Button */}
        <button
          type="button"
          onClick={onStop}
          disabled={!isActive}
          className="btn btn-danger flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Stop scraping"
        >
          <Square className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Stop</span>
        </button>

        {/* Pause/Resume Button - Disabled for serverless architecture */}
        {/* Serverless processes towns sequentially and cannot be paused mid-town */}
        {/* <button
          type="button"
          onClick={isPaused ? onResume : onPause}
          disabled={!isActive}
          className="btn btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={isPaused ? 'Resume scraping' : 'Pause scraping'}
        >
          <Pause className="w-4 h-4" />
          <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
        </button> */}

        {/* Export Button */}
        <button
          type="button"
          onClick={onExport}
          disabled={!hasData || isActive || isExporting}
          className="btn btn-primary flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export to Excel"
        >
          {isExporting ? (
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
          <span>{isExporting ? 'Export...' : 'Export'}</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Save Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={!hasData || isActive || isSaving}
          className="btn btn-secondary flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save session"
        >
          {isSaving ? (
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <Save className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
          <span>{isSaving ? 'Save...' : 'Save'}</span>
        </button>

        {/* Load Button */}
        <button
          type="button"
          onClick={onLoad}
          disabled={isActive || isLoading}
          className="btn btn-secondary flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Load session"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
          <span>{isLoading ? 'Load...' : 'Load'}</span>
        </button>

        {/* Clear Button */}
        <button
          type="button"
          onClick={onClear}
          disabled={!hasData || isActive}
          className="btn btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed col-span-2 sm:col-span-1"
          title="Clear all data"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear All</span>
        </button>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
        <div
          className={`w-3 h-3 rounded-full ${
            isRunning
              ? 'bg-green-500 animate-pulse'
              : isPaused
              ? 'bg-yellow-500'
              : isCompleted
              ? 'bg-blue-500'
              : isStopped
              ? 'bg-red-500'
              : 'bg-gray-400'
          }`}
        />
        <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
      </div>
    </div>
  );
}
