'use client';

import { useEffect, useState } from 'react';
import { useOfflineStore } from '@/store/offline';

export default function OfflineAlert() {
  const { isOnline } = useOfflineStore();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowAlert(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShowAlert(false);
    }
  }, [isOnline]);

  if (!showAlert) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-red-500 text-white px-4 py-2 text-center animate-slide-down">
      <div className="flex items-center justify-center space-x-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span className="font-medium">You are currently offline. Some features may be limited.</span>
      </div>
    </div>
  );
} 