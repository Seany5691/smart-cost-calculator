'use client';

import { useEffect, useState } from 'react';
import { useOfflineStore } from '@/store/offline';
import { useAuthStore } from '@/store/auth';
import { useConfigStore } from '@/store/config';
import Navigation from './Navigation';
import OfflineAlert from './OfflineAlert';
import PasswordChangeModal from '../auth/PasswordChangeModal';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { setOnlineStatus } = useOfflineStore();
  const { user } = useAuthStore();
  const { loadFromAPI, refreshFromSupabase } = useConfigStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial status
    setOnlineStatus(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  // Initialize config store and users on app load
  useEffect(() => {
    const initializeApp = async () => {
      await loadFromAPI();
      const { initializeUsers } = useAuthStore.getState();
      await initializeUsers();
    };
    initializeApp();
  }, [loadFromAPI]);

  // Set up periodic sync from Supabase
  useEffect(() => {
    // Refresh from Supabase every 30 seconds to ensure cross-browser consistency
    const syncInterval = setInterval(() => {
      refreshFromSupabase();
    }, 30000);

    return () => {
      clearInterval(syncInterval);
    };
  }, [refreshFromSupabase]);

  // Show password change modal if user requires password change
  useEffect(() => {
    if (user?.requiresPasswordChange) {
      setShowPasswordModal(true);
    }
  }, [user?.requiresPasswordChange]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <OfflineAlert />
      <Navigation />
      <main className="pt-16">
        {children}
      </main>
      <PasswordChangeModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
    </div>
  );
} 