'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Settings, Users, BarChart3, MapPin, Database, FileText, FolderOpen } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';

// Dynamic imports for admin components to reduce initial bundle size
const HardwareConfig = dynamic(() => import('@/components/admin/HardwareConfig'), {
  loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>,
  ssr: false
});

const ConnectivityConfig = dynamic(() => import('@/components/admin/ConnectivityConfig'), {
  loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>,
  ssr: false
});

const LicensingConfig = dynamic(() => import('@/components/admin/LicensingConfig'), {
  loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>,
  ssr: false
});

const FactorSheetConfig = dynamic(() => import('@/components/admin/FactorSheetConfig'), {
  loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>,
  ssr: false
});

const ScalesConfig = dynamic(() => import('@/components/admin/ScalesConfig'), {
  loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>,
  ssr: false
});

const UserManagement = dynamic(() => import('@/components/admin/UserManagement'), {
  loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>,
  ssr: false
});

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
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      {/* Enhanced Breadcrumb Navigation - Mobile Optimized */}
      <div className="mb-4 sm:mb-6">
        <Breadcrumb
          items={[
            { label: 'Admin Panel', href: '/admin' },
            ...(activeTab !== 'hardware' ? [
              { 
                label: tabs.find(tab => tab.id === activeTab)?.name || '', 
                active: true 
              }
            ] : [])
          ]}
          className="mb-2"
        />
        
        {/* Context Information - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-gray-600 text-xs sm:text-sm">
            Administrative controls and system configuration
          </p>
          <div className="flex items-center space-x-2 text-[10px] sm:text-xs text-gray-500">
            <span className="hidden sm:inline">Last login:</span>
            <span className="font-medium">{new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="mb-4 sm:mb-8 text-center animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2 animate-slide-down">Admin Panel</h1>
        <p className="text-sm sm:text-base text-gray-700 animate-slide-up">Manage system configuration and user settings</p>
      </div>

      {/* Streamlined Tab Navigation with Better UX - Mobile & Tablet Optimized */}
      <div className="mb-4 sm:mb-8 animate-slide-up">
        {/* Main Tab Container */}
        <div className="bg-white/60 backdrop-blur-xl rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Tab Headers - Scrollable on mobile */}
          <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 bg-white/40">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-3 sm:py-4 font-medium transition-all duration-200 relative group border-r border-gray-200 last:border-r-0 min-w-0 flex-shrink-0 sm:flex-1 lg:flex-none transform hover:scale-105 touch-manipulation ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 shadow-inner scale-105'
                      : 'text-gray-700 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 hover:shadow-md'
                  }`}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 flex-shrink-0 ${
                    isActive ? 'scale-110 text-blue-700' : 'group-hover:scale-110 group-hover:rotate-6'
                  }`} />
                  <span className="whitespace-nowrap text-xs sm:text-sm lg:text-base">{tab.name}</span>
                  
                  {/* Enhanced Active Indicator */}
                  {isActive && (
                    <>
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                      <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-50"></div>
                      <div className="absolute inset-0 bg-blue-100 opacity-20 animate-pulse"></div>
                    </>
                  )}
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
                </button>
              );
            })}
          </div>
          
          {/* Enhanced Tab Description with Context - Mobile Optimized */}
          <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 px-3 sm:px-6 py-3 sm:py-4 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-pulse flex-shrink-0"></div>
                <p className="text-gray-800 text-xs sm:text-sm font-medium">
                  {activeTab === 'hardware' && 'Configure hardware items, pricing, and availability'}
                  {activeTab === 'connectivity' && 'Manage connectivity options and pricing tiers'}
                  {activeTab === 'licensing' && 'Set up licensing models and subscription pricing'}
                  {activeTab === 'factors' && 'Configure pricing factors and calculation rules'}
                  {activeTab === 'scales' && 'Manage pricing scales and cost structures'}
                  {activeTab === 'users' && 'Manage user accounts, roles, and permissions'}
                  {activeTab === 'deals' && 'View and analyze all customer deals'}
                </p>
              </div>
              
              {/* Tab Counter - Hidden on mobile */}
              <div className="hidden md:flex items-center space-x-2 text-xs text-gray-500">
                <span>Tab {tabs.findIndex(t => t.id === activeTab) + 1} of {tabs.length}</span>
                <div className="flex space-x-1">
                  {tabs.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                        index === tabs.findIndex(t => t.id === activeTab)
                          ? 'bg-blue-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar - Mobile Optimized */}
      <div className="mb-4 sm:mb-6 bg-white/60 backdrop-blur-xl rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm font-medium text-gray-800">Quick Actions:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push('/admin/deals')}
                className="btn btn-outline text-xs sm:text-sm py-1.5 px-3 hover:scale-105 transition-transform duration-200 flex items-center"
              >
                <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="whitespace-nowrap">View All Deals</span>
              </button>
              <button
                onClick={() => router.push('/calculator')}
                className="btn btn-outline text-xs sm:text-sm py-1.5 px-3 hover:scale-105 transition-transform duration-200 flex items-center"
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="whitespace-nowrap">Test Calculator</span>
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
            <span className="hidden sm:inline">Last updated:</span>
            <span className="font-medium">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
} 