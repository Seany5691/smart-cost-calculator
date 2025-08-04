'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Settings, Users, BarChart3, MapPin, Database, FileText, FolderOpen } from 'lucide-react';
import HardwareConfig from '@/components/admin/HardwareConfig';
import ConnectivityConfig from '@/components/admin/ConnectivityConfig';
import LicensingConfig from '@/components/admin/LicensingConfig';
import FactorSheetConfig from '@/components/admin/FactorSheetConfig';
import ScalesConfig from '@/components/admin/ScalesConfig';
import UserManagement from '@/components/admin/UserManagement';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('hardware');
  const { user, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!checkAuth() || user?.role !== 'admin') {
      router.push('/login');
    }
  }, [user, checkAuth, router]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const tabs = [
    { id: 'hardware', name: 'Hardware Config', icon: Database },
    { id: 'connectivity', name: 'Connectivity Config', icon: MapPin },
    { id: 'licensing', name: 'Licensing Config', icon: FileText },
    { id: 'factors', name: 'Factor Sheet', icon: BarChart3 },
    { id: 'scales', name: 'Scales Config', icon: Settings },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'deals', name: 'All Deals', icon: FolderOpen },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'hardware':
        return <HardwareConfig />;
      case 'connectivity':
        return <ConnectivityConfig />;
      case 'licensing':
        return <LicensingConfig />;
      case 'factors':
        return <FactorSheetConfig />;
      case 'scales':
        return <ScalesConfig />;
      case 'users':
        return <UserManagement />;
      case 'deals':
        router.push('/admin/deals');
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage system configuration and user settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
} 