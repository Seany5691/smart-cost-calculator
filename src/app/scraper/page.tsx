'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useScraperStore } from '@/store/scraper';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { toast } from '@/lib/toast';
import TownInput from '@/components/scraper/TownInput';
import IndustrySelector from '@/components/scraper/IndustrySelector';
import ConcurrencyControls from '@/components/scraper/ConcurrencyControls';
import ControlPanel from '@/components/scraper/ControlPanel';
import ProgressDisplay from '@/components/scraper/ProgressDisplay';
import LogViewer from '@/components/scraper/LogViewer';
import ProviderExport from '@/components/scraper/ProviderExport';
import ViewAllResults from '@/components/scraper/ViewAllResults';
import NumberLookup from '@/components/scraper/NumberLookup';
import BusinessLookup from '@/components/scraper/BusinessLookup';
import SessionManager from '@/components/scraper/SessionManager';
import SummaryStats from '@/components/scraper/SummaryStats';
import { exportService } from '@/lib/export/ExportService';
import { useAutoExport } from '@/hooks/useAutoExport';

function ScraperPageContent() {
  const router = useRouter();
  const { user, checkAuth } = useAuthStore();
  const [isVercel, setIsVercel] = useState(false);

  // Check if running on Vercel
  useEffect(() => {
    setIsVercel(window.location.hostname.includes('vercel.app') || process.env.NEXT_PUBLIC_VERCEL_ENV !== undefined);
  }, []);

  // Role-based access control
  useEffect(() => {
    if (!checkAuth()) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'admin' && user?.role !== 'manager') {
      toast.error('Access Denied', 'You do not have permission to access this feature');
      router.push('/');
    }
  }, [user, checkAuth, router]);

  // Zustand store
  const {
    status,
    config,
    towns,
    industries,
    progress,
    businesses,
    logs,
    summary,
    setConfig,
    setTowns,
    setIndustries,
    startScraping,
    stopScraping,
    pauseScraping,
    resumeScraping,
    clearAll,
  } = useScraperStore();

  // Local state
  const [townInput, setTownInput] = useState('');
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [sessionManagerOpen, setSessionManagerOpen] = useState(false);
  const [sessionManagerMode, setSessionManagerMode] = useState<'save' | 'load'>('save');
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Loading states for async operations
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Auto-export when scraping completes (1 file per town)
  useAutoExport(status, businesses, true);

  // Load industries from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('smart-scrape-industries');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAvailableIndustries(parsed);
      } catch (error) {
        console.error('Error loading industries:', error);
        setAvailableIndustries(getDefaultIndustries());
      }
    } else {
      setAvailableIndustries(getDefaultIndustries());
    }

    // Load selected industries from localStorage
    const storedSelected = localStorage.getItem('smart-scrape-selected-industries');
    if (storedSelected) {
      try {
        const parsed = JSON.parse(storedSelected);
        setSelectedIndustries(parsed);
        setIndustries(parsed);
      } catch (error) {
        console.error('Error loading selected industries:', error);
      }
    }
  }, []);

  // Sync towns from store to input (only when loading, not during typing)
  // Removed to prevent interference with user typing

  // Sync industries from store
  useEffect(() => {
    if (industries.length > 0) {
      setSelectedIndustries(industries);
    }
  }, [industries]);

  // Update elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'running' && progress.startTime > 0) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - progress.startTime);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, progress.startTime]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (progress.totalTowns === 0) return 0;
    return (progress.completedTowns / progress.totalTowns) * 100;
  }, [progress.completedTowns, progress.totalTowns]);

  // Calculate estimated time remaining
  const estimatedTimeRemaining = useMemo(() => {
    if (progress.completedTowns === 0 || progress.townCompletionTimes.length === 0) {
      return null;
    }
    const avgTime =
      progress.townCompletionTimes.reduce((a, b) => a + b, 0) /
      progress.townCompletionTimes.length;
    const remaining = progress.totalTowns - progress.completedTowns;
    return avgTime * remaining;
  }, [progress.completedTowns, progress.totalTowns, progress.townCompletionTimes]);

  // Handlers
  const handleTownInputChange = (value: string) => {
    setTownInput(value);
    const townList = value
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    setTowns(townList);
  };

  const handleIndustrySelectionChange = (selected: string[]) => {
    setSelectedIndustries(selected);
    setIndustries(selected);
    // Persist selected industries to localStorage
    localStorage.setItem('smart-scrape-selected-industries', JSON.stringify(selected));
  };

  const handleAddIndustry = (industry: string) => {
    const updated = [...availableIndustries, industry];
    setAvailableIndustries(updated);
    localStorage.setItem('smart-scrape-industries', JSON.stringify(updated));
  };

  const handleRemoveIndustry = (industry: string) => {
    const updated = availableIndustries.filter((i) => i !== industry);
    const updatedSelected = selectedIndustries.filter((i) => i !== industry);
    setAvailableIndustries(updated);
    setSelectedIndustries(updatedSelected);
    localStorage.setItem('smart-scrape-industries', JSON.stringify(updated));
    localStorage.setItem('smart-scrape-selected-industries', JSON.stringify(updatedSelected));
  };

  const handleStart = () => {
    startScraping();
  };

  const handleStop = () => {
    stopScraping();
  };

  const handlePause = () => {
    pauseScraping();
  };

  const handleResume = () => {
    resumeScraping();
  };

  const handleSave = () => {
    setSessionManagerMode('save');
    setSessionManagerOpen(true);
  };

  const handleLoad = () => {
    setSessionManagerMode('load');
    setSessionManagerOpen(true);
  };

  const handleClear = () => {
    // Show a warning toast and require user confirmation
    const confirmed = window.confirm('Are you sure you want to clear all data? This cannot be undone.');
    if (confirmed) {
      clearAll();
      setTownInput('');
      toast.info('Data Cleared', 'All scraping data has been cleared');
      // Don't clear selected industries - they should persist
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `businesses_${timestamp}.xlsx`;

      // Get auth headers
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (user) {
        authHeaders['x-user-data'] = JSON.stringify({
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          email: user.email
        });
      }

      const response = await fetch('/api/export/excel', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          businesses,
          filename,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Export Successful', `Exported ${businesses.length} businesses to ${filename}`);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Export Failed', error instanceof Error ? error.message : 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveSession = async (name: string) => {
    setIsSaving(true);
    try {
      // For now, save to localStorage
      const session = {
        id: Date.now().toString(),
        name,
        data: businesses,
        fullLog: logs.map((l) => l.message),
        summary: [],
        towns: towns.join(', '),
        currentTowns: towns,
        currentIndustries: industries,
        exportPaths: [],
        industries,
        outputFolder: config.outputFolder,
        createdAt: new Date().toISOString(),
      };

      const stored = localStorage.getItem('smart-scrape-sessions');
      const sessions = stored ? JSON.parse(stored) : [];
      sessions.push(session);
      localStorage.setItem('smart-scrape-sessions', JSON.stringify(sessions));
      
      toast.success('Session Saved', `Session "${name}" has been saved successfully`);
      setSessionManagerOpen(false);
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Save Failed', error instanceof Error ? error.message : 'Failed to save session. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem('smart-scrape-sessions');
      if (!stored) {
        throw new Error('No saved sessions found');
      }

      const sessions = JSON.parse(stored);
      const session = sessions.find((s: any) => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Load session data into store
      setTowns(session.currentTowns);
      setIndustries(session.currentIndustries);
      // Note: We'd need to add actions to load businesses and logs
      // For now, this is a placeholder
      
      toast.success('Session Loaded', `Session "${session.name}" has been loaded successfully`);
      setSessionManagerOpen(false);
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Load Failed', error instanceof Error ? error.message : 'Failed to load session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isActive = status === 'running' || status === 'paused';
  const hasData = businesses.length > 0;

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    return {
      totalTowns: progress.completedTowns,
      totalBusinesses: businesses.length,
      totalDuration: elapsedTime,
      averageBusinessesPerTown:
        progress.completedTowns > 0 ? businesses.length / progress.completedTowns : 0,
    };
  }, [progress.completedTowns, businesses.length, elapsedTime]);

  // Don't render content if not authorized
  if (!checkAuth() || (user?.role !== 'admin' && user?.role !== 'manager')) {
    return null;
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-card p-6">
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
            Smart Scrape
          </h1>
          <p className="text-gray-600">
            Scrape business data from Google Maps for multiple towns and industries
          </p>
        </div>

        {/* Vercel Warning Banner */}
        {isVercel && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-900 mb-1">
                  Scraper Not Available on Vercel
                </h3>
                <p className="text-sm text-yellow-800 mb-2">
                  The Smart Scraper requires a long-running server environment and cannot function on Vercel's serverless platform. 
                  The scraping functionality will not work in this deployment.
                </p>
                <p className="text-sm text-yellow-800 font-medium">
                  ✅ Lookup tools (Number Lookup & Business Lookup) will work<br />
                  ❌ Town/Industry scraping will not work<br />
                  💡 For full scraper functionality, deploy to a VPS or run locally
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lookup Tools - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Number Lookup */}
          <div className="glass-card p-4">
            <NumberLookup />
          </div>

          {/* Business Lookup */}
          <div className="glass-card p-4">
            <BusinessLookup />
          </div>
        </div>

        {/* Progress & Summary Stats (Top Section) */}
        {(isActive || status === 'completed' || status === 'stopped' || hasData) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Display */}
            {(isActive || status === 'completed' || status === 'stopped') && (
              <div className="glass-card p-4">
                <ProgressDisplay
                  percentage={progressPercentage}
                  townsRemaining={progress.totalTowns - progress.completedTowns}
                  totalTowns={progress.totalTowns}
                  businessesScraped={businesses.length}
                  estimatedTimeRemaining={estimatedTimeRemaining}
                  elapsedTime={elapsedTime}
                />
              </div>
            )}

            {/* Summary Stats */}
            {(status === 'completed' || status === 'stopped') && hasData && (
              <div className="glass-card p-4">
                <SummaryStats {...summaryStats} />
              </div>
            )}
          </div>
        )}

        {/* Configuration Section - Paired Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Row 1: Towns & Industries */}
          <div className="glass-card p-6 h-full">
            <TownInput
              value={townInput}
              onChange={handleTownInputChange}
              disabled={isActive}
            />
          </div>

          <div className="glass-card p-6 h-full">
            <IndustrySelector
              industries={availableIndustries}
              selectedIndustries={selectedIndustries}
              onSelectionChange={handleIndustrySelectionChange}
              onAddIndustry={handleAddIndustry}
              onRemoveIndustry={handleRemoveIndustry}
              disabled={isActive}
            />
          </div>

          {/* Row 2: Controls & Concurrency */}
          <div className="glass-card p-6 h-full">
            {isVercel ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg shadow-lg opacity-50">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-500">Controls</h3>
                    <p className="text-xs text-gray-400">Disabled on Vercel</p>
                  </div>
                </div>
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Scraping controls are disabled on serverless platforms.</p>
                  <p className="text-xs mt-2">Deploy to a VPS or run locally for full functionality.</p>
                </div>
              </div>
            ) : (
              <ControlPanel
                status={status}
                onStart={handleStart}
                onStop={handleStop}
                onPause={handlePause}
                onResume={handleResume}
                onSave={handleSave}
                onLoad={handleLoad}
                onClear={handleClear}
                onExport={handleExport}
                hasData={hasData}
                isSaving={isSaving}
                isLoading={isLoading}
                isExporting={isExporting}
              />
            )}
          </div>

          <div className="glass-card p-6 h-full">
            <ConcurrencyControls
              simultaneousTowns={config.simultaneousTowns}
              simultaneousIndustries={config.simultaneousIndustries}
              simultaneousLookups={config.simultaneousLookups}
              onTownsChange={(value) => setConfig({ simultaneousTowns: value })}
              onIndustriesChange={(value) => setConfig({ simultaneousIndustries: value })}
              onLookupsChange={(value) => setConfig({ simultaneousLookups: value })}
              disabled={isActive}
            />
          </div>

          {/* Row 3: Activity Log & Provider Export */}
          <div className="glass-card p-6 h-full">
            <LogViewer logs={logs} autoScroll={true} />
          </div>

          {hasData ? (
            <div className="glass-card p-6 h-full">
              <ProviderExport businesses={businesses} />
            </div>
          ) : (
            <div className="glass-card p-6 h-full flex items-center justify-center">
              <p className="text-gray-400 text-center">
                Provider export will appear here after scraping
              </p>
            </div>
          )}
        </div>

        {/* View All Results (Dropdown) */}
        {hasData && (
          <div className="glass-card p-6">
            <ViewAllResults businesses={businesses} />
          </div>
        )}

        {/* Session Manager Modal */}
        <SessionManager
          isOpen={sessionManagerOpen}
          mode={sessionManagerMode}
          sessions={[]} // TODO: Load from localStorage
          onClose={() => setSessionManagerOpen(false)}
          onSave={handleSaveSession}
          onLoad={handleLoadSession}
        />
      </div>
    </main>
  );
}

export default function ScraperPage() {
  return (
    <ErrorBoundary>
      <ScraperPageContent />
    </ErrorBoundary>
  );
}

function getDefaultIndustries(): string[] {
  return [
    'Engineering Firms',
    'Pharmacies',
    'Medical Practices',
    'Dental Clinics',
    'Auto Repair Shops',
    'Law Firms',
    'Accounting Firms',
    'Financial Services',
    'Real Estate Agencies',
    'Manufacturing',
    'Construction Companies',
    'Logistics and Transportation',
    'Advertising Agencies',
    'Architecture Firms',
    'Insurance Agencies',
    'Property Management',
    'Funeral Parlours',
    'Optometrists',
    'Supermarkets',
    'Veterinary Clinics',
    'Restaurants and Cafes',
    'Hotels',
    'Fitness Centers',
    'Hair Salons and Barbershops',
    'Clothing Stores',
    'Electronics Retail Stores',
    'Educational Institutions',
    'Plumbing Companies',
    'Electrical Contractors',
    'Landscaping Services',
    'Catering Companies',
    'Travel Agencies',
    'Car Dealerships',
    'Printing and Copy Shops',
    'Wholesale Distributors',
    'Agricultural Farms and Suppliers',
    'Chiropractors',
    'Orthodontic Practices',
    'Tire Shops',
    'Tax Preparation Services',
    'Real Estate Firms',
    'Freight Companies',
    'Marketing Firms',
    'Interior Design Firms',
    'Security Services',
  ];
}
