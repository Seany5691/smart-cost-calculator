'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useCalculatorStore } from '@/store/calculator';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DealDetailsSection from '@/components/calculator/DealDetailsSection';
import HardwareSection from '@/components/calculator/HardwareSection';
import ConnectivitySection from '@/components/calculator/ConnectivitySection';
import LicensingSection from '@/components/calculator/LicensingSection';
import SettlementSection from '@/components/calculator/SettlementSection';
import TotalCostsSection from '@/components/calculator/TotalCostsSection';

function CalculatorPageContent() {
  const [tabIndex, setTabIndex] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isLoadingDeal, setIsLoadingDeal] = useState(false);
  const [dealContext, setDealContext] = useState<{ originalUserRole: string; originalUsername: string } | null>(null);
  const { isAuthenticated } = useAuthStore();
  const { initializeStore, loadDeal, resetDeal } = useCalculatorStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    const init = async () => {
      setIsInitializing(true);
      setInitError(null);
      
      try {
        // Try to initialize with retries
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            await initializeStore();
            
            // Verify config store is properly loaded
            const { useConfigStore } = await import('@/store/config');
            const configStore = useConfigStore.getState();
            
            if (configStore.scales?.additional_costs?.cost_per_kilometer && 
                configStore.scales?.additional_costs?.cost_per_point) {
              console.log('Calculator initialized successfully');
              setIsInitializing(false);
              
              // Check if we need to load a specific deal
              const dealId = searchParams.get('dealId');
              const viewAsAdmin = searchParams.get('viewAsAdmin') === 'true';
              
              if (dealId) {
                setIsLoadingDeal(true);
                try {
                  const deal = await loadDeal(dealId);
                  if (deal && viewAsAdmin) {
                    setDealContext({
                      originalUserRole: deal.userRole,
                      originalUsername: deal.username
                    });
                  }
                } catch (error) {
                  console.error('Error loading deal:', error);
                  setInitError('Failed to load the selected deal.');
                } finally {
                  setIsLoadingDeal(false);
                }
              } else {
                // Reset deal details for new deal
                resetDeal();
                setDealContext(null);
              }
              
              return;
            } else {
              console.log(`Retry ${retries + 1}: Config store not ready, retrying...`);
              retries++;
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            }
          } catch (error) {
            console.error(`Retry ${retries + 1} failed:`, error);
            retries++;
            if (retries >= maxRetries) {
              throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        throw new Error('Failed to initialize calculator after multiple retries');
      } catch (error) {
        console.error('Failed to initialize calculator:', error);
        setInitError('Failed to initialize calculator. Please refresh the page.');
        setIsInitializing(false);
      }
    };
    
    init();
  }, [isAuthenticated, router, initializeStore, searchParams, loadDeal]);

  if (!isAuthenticated) {
    return null;
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Initializing Calculator...</h2>
          <p className="text-gray-500">Please wait while we load the configuration data.</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Initialization Error</h2>
          <p className="text-gray-500 mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { name: 'Deal Details', icon: '📋' },
    { name: 'Hardware', icon: '💻' },
    { name: 'Connectivity', icon: '🌐' },
    { name: 'Licensing', icon: '🔑' },
    { name: 'Settlement', icon: '💰' },
    { name: 'Total Costs', icon: '📊' },
  ];

  const handleTabChange = (index: number) => {
    setTabIndex(index);
  };

  const handleNextTab = () => {
    if (tabIndex < tabs.length - 1) {
      setTabIndex(tabIndex + 1);
    }
  };

  const handlePrevTab = () => {
    if (tabIndex > 0) {
      setTabIndex(tabIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Deal Cost Calculator
            </h1>
            <p className="text-gray-600">
              Calculate comprehensive deal costs step by step
            </p>
            {dealContext && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Viewing as Admin:</strong> This deal was created by {dealContext.originalUsername} ({dealContext.originalUserRole} pricing)
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => router.push('/')}
            className="btn btn-outline flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Calculator Container */}
        <div className="card-gradient">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex overflow-x-auto">
              {tabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => handleTabChange(index)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                    tabIndex === index
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {tabIndex === 0 && (
              <DealDetailsSection onNext={handleNextTab} />
            )}
            {tabIndex === 1 && (
              <HardwareSection onNext={handleNextTab} onPrev={handlePrevTab} />
            )}
            {tabIndex === 2 && (
              <ConnectivitySection onNext={handleNextTab} onPrev={handlePrevTab} />
            )}
            {tabIndex === 3 && (
              <LicensingSection onNext={handleNextTab} onPrev={handlePrevTab} />
            )}
            {tabIndex === 4 && (
              <SettlementSection onNext={handleNextTab} onPrev={handlePrevTab} />
            )}
            {tabIndex === 5 && (
              <TotalCostsSection onPrev={handlePrevTab} />
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Step {tabIndex + 1} of {tabs.length}</span>
            <div className="flex space-x-1">
              {tabs.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index <= tabIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Calculator...</h2>
          <p className="text-gray-500">Please wait while we load the calculator.</p>
        </div>
      </div>
    }>
      <CalculatorPageContent />
    </Suspense>
  );
}