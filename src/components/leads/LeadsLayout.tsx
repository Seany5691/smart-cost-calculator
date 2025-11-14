'use client';

import { useEffect, useState } from 'react';
import Navigation from './Navigation';
import SkipNavigation from './SkipNavigation';
import { ToastProvider } from '@/components/ui/Toast';
import { Wifi, WifiOff } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  // Initialize any app-level functionality here
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineNotice(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineNotice(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Skip Navigation Links */}
        <SkipNavigation />
        
        {/* Offline Notice */}
        {showOfflineNotice && (
          <div
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-down"
            role="alert"
            aria-live="assertive"
          >
            <WifiOff className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">You are currently offline. Some features may be limited.</span>
            <button
              onClick={() => setShowOfflineNotice(false)}
              className="ml-4 text-white hover:text-yellow-100 transition-colors"
              aria-label="Dismiss offline notice"
            >
              ×
            </button>
          </div>
        )}

        {/* Online Status Indicator (Screen Reader Only) */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {isOnline ? 'You are online' : 'You are offline'}
        </div>

        {/* Navigation component kept as placeholder - can be removed if not needed */}
        {/* <Navigation /> */}
        
        <main 
          id="main-content" 
          tabIndex={-1}
          role="main"
          aria-label="Main content"
        >
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}