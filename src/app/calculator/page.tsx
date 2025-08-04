'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useCalculatorStore } from '@/store/calculator';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DealDetailsSection from '@/components/calculator/DealDetailsSection';
import HardwareSection from '@/components/calculator/HardwareSection';
import ConnectivitySection from '@/components/calculator/ConnectivitySection';
import LicensingSection from '@/components/calculator/LicensingSection';
import SettlementSection from '@/components/calculator/SettlementSection';
import TotalCostsSection from '@/components/calculator/TotalCostsSection';

export default function CalculatorPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const { isAuthenticated } = useAuthStore();
  const { initializeStore } = useCalculatorStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    const init = async () => {
      await initializeStore();
    };
    init();
  }, [isAuthenticated, router, initializeStore]);

  if (!isAuthenticated) {
    return null;
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