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

  const [dealContext, setDealContext] = useState<{ originalUserRole: string; originalUsername: string } | null>(null);
  const [showMainNav, setShowMainNav] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { initializeStore, loadDeal, resetDeal } = useCalculatorStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Enhanced keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard navigation if not typing in an input or select
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLSelectElement) {
        return;
      }
      
      // Prevent navigation if user is in a modal or dropdown
      if (document.querySelector('[role="dialog"]') || document.querySelector('.dropdown-open')) {
        return;
      }
      
      if (event.key === 'ArrowLeft' && tabIndex > 0) {
        event.preventDefault();
        handlePrevTab();
        // Show visual feedback
        showNavigationFeedback('Previous step');
      } else if (event.key === 'ArrowRight' && tabIndex < tabs.length - 1) {
        event.preventDefault();
        handleNextTab();
      } else if (event.key >= '1' && event.key <= '6') {
        event.preventDefault();
        const targetIndex = parseInt(event.key) - 1;
        if (targetIndex >= 0 && targetIndex < tabs.length && targetIndex <= tabIndex) {
          setTabIndex(targetIndex);
          showNavigationFeedback(`Jumped to ${tabs[targetIndex]?.name}`);
        } else if (targetIndex > tabIndex) {
          showNavigationFeedback('Complete previous steps first', 'warning');
        }
      } else if (event.key === 'Escape') {
        // Quick exit to dashboard
        event.preventDefault();
        if (confirm('Are you sure you want to return to the dashboard? Any unsaved changes may be lost.')) {
          router.push('/');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabIndex, router]);

  // Navigation feedback function
  const showNavigationFeedback = (message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' :
                   type === 'warning' ? 'bg-yellow-100 border-yellow-400 text-yellow-700' :
                   'bg-blue-100 border-blue-400 text-blue-700';
    
    notification.className = `fixed bottom-20 left-1/2 transform -translate-x-1/2 ${bgColor} px-4 py-2 rounded-lg shadow-lg z-[9999] animate-slide-up`;
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium">${message}</span>
      </div>
    `;
    document.body.appendChild(notification);
    
    // Remove notification after 2 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        notification.style.transform = 'translate(-50%, 20px)';
        notification.style.transition = 'all 0.3s ease-in';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    }, 2000);
  };

  // Swipe navigation removed - was causing accidental tab changes on mobile

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
              setIsInitializing(false);
              
              // Check if we need to load a specific deal
              const dealId = searchParams.get('dealId');
              const viewAsAdmin = searchParams.get('viewAsAdmin') === 'true';
              
              if (dealId) {
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
                }
              } else {
                // Reset deal details for new deal
                resetDeal();
                setDealContext(null);
              }
              
              return;
            } else {
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

  // Handle scroll behavior for main navigation
  useEffect(() => {
    let lastScrollY = 0;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Show navigation when at the very top (within 10px)
          if (currentScrollY <= 10) {
            setShowMainNav(true);
          } 
          // Hide navigation when scrolling down from top
          else if (currentScrollY > lastScrollY && currentScrollY > 10) {
            setShowMainNav(false);
          }
          
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    // Navigation is now always visible - removed hiding logic
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"></div>
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <div className="text-center relative z-10 bg-white/60 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/40 animate-fade-in-up">
          <div className="relative inline-block mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Initializing Calculator...
          </h2>
          <p className="text-gray-600">Please wait while we load the configuration data.</p>
          <div className="mt-6 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50"></div>
          <div className="absolute top-0 -left-4 w-96 h-96 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="text-center max-w-md mx-auto p-8 relative z-10 bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 animate-shake">
          <div className="inline-flex p-4 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl mb-4">
            <div className="text-red-500 text-5xl animate-pulse">⚠️</div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-3">
            Initialization Error
          </h2>
          <p className="text-gray-600 mb-6">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl px-6 py-3 shadow-lg hover:shadow-glow-lg transform hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span className="relative z-10">Refresh Page</span>
            <div className="absolute inset-0 bg-white/20 scale-0 group-active:scale-100 transition-transform duration-300 rounded-xl"></div>
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
    // Validate current section before proceeding
    let canProceed = true;
    let validationMessage = '';
    
    if (tabIndex === 0) {
      // Deal Details validation - check if required fields are filled
      const { dealDetails } = useCalculatorStore.getState();
      
      if (!dealDetails.customerName.trim()) {
        validationMessage = 'Please enter a customer name before proceeding.';
        canProceed = false;
      } else if (dealDetails.term <= 0) {
        validationMessage = 'Please enter a valid contract term (greater than 0 months).';
        canProceed = false;
      } else if (dealDetails.escalation < 0) {
        validationMessage = 'Please enter a valid escalation percentage (0% or higher).';
        canProceed = false;
      }
    } else if (tabIndex === 4) {
      // Settlement validation - check if settlement is calculated or manual amount is set
      const { dealDetails } = useCalculatorStore.getState();
      if (dealDetails.settlement === undefined || dealDetails.settlement < 0) {
        validationMessage = 'Please set a valid settlement amount before proceeding to the final summary.';
        canProceed = false;
      }
    }
    
    if (!canProceed) {
      // Create a more user-friendly notification instead of alert
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-[9999] animate-slide-up max-w-md';
      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <span class="text-lg">⚠️</span>
          <span class="font-medium">${validationMessage}</span>
        </div>
      `;
      document.body.appendChild(notification);
      
      // Remove notification after 4 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.opacity = '0';
          notification.style.transform = 'translate(-50%, 20px)';
          notification.style.transition = 'all 0.3s ease-in';
          setTimeout(() => {
            notification.remove();
          }, 300);
        }
      }, 4000);
      
      return;
    }
    
    if (tabIndex < tabs.length - 1) {
      setTabIndex(tabIndex + 1);
      
      // Show success feedback for progression
      const successNotification = document.createElement('div');
      successNotification.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-[9999] animate-slide-up';
      successNotification.innerHTML = `
        <div class="flex items-center space-x-2">
          <span class="text-lg">✅</span>
          <span class="font-medium">Moved to ${tabs[tabIndex + 1]?.name}</span>
        </div>
      `;
      document.body.appendChild(successNotification);
      
      // Remove notification after 2 seconds
      setTimeout(() => {
        if (successNotification.parentNode) {
          successNotification.style.opacity = '0';
          successNotification.style.transform = 'translate(-50%, 20px)';
          successNotification.style.transition = 'all 0.3s ease-in';
          setTimeout(() => {
            successNotification.remove();
          }, 300);
        }
      }, 2000);
    }
  };

  const handlePrevTab = () => {
    if (tabIndex > 0) {
      setTabIndex(tabIndex - 1);
    }
  };

  return (
    <div className="h-screen flex flex-col relative pt-0 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"></div>
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{ animationDelay: '4s' }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent"></div>
      </div>

      {/* Admin Context Message (if exists) */}
      {dealContext && (
        <div className="flex-shrink-0 bg-blue-500/10 backdrop-blur-md border-b border-blue-200/50 animate-slide-down">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-sm text-blue-800 flex items-center space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              <strong>Viewing as Admin:</strong> 
              <span>This deal was created by {dealContext.originalUsername} ({dealContext.originalUserRole} pricing)</span>
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Fixed Tabs and Navigation Container - Glassmorphism */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl shadow-2xl border-b border-white/20 z-40 relative">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
        {/* Futuristic Tabs with Glassmorphism - Mobile Responsive */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative">
          <div className="flex items-center justify-between border-b border-white/20">
            <div className="flex overflow-x-auto overflow-y-visible scrollbar-hide flex-1">
              {tabs.map((tab, index) => {
                const isCompleted = index < tabIndex;
                const isCurrent = index === tabIndex;
                const isFuture = index > tabIndex;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleTabChange(index)}
                    className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-5 py-3 sm:py-3.5 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-500 border-b-3 relative group cursor-pointer touch-manipulation flex-shrink-0 ${
                      isCurrent
                        ? 'text-blue-600 border-blue-600 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm shadow-lg sm:transform sm:scale-110'
                        : isCompleted
                        ? 'text-green-600 border-green-500 bg-gradient-to-br from-green-50/60 to-emerald-50/60 backdrop-blur-sm hover:shadow-lg sm:hover:transform sm:hover:scale-105'
                        : isFuture
                        ? 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-white/40 hover:backdrop-blur-sm sm:hover:transform sm:hover:scale-105'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/40 hover:backdrop-blur-sm border-transparent sm:hover:transform sm:hover:scale-105'
                    }`}
                  >
                    <span className={`text-lg sm:text-xl transition-all duration-300 ${
                      isCurrent ? 'scale-125 animate-bounce-subtle' : isCompleted ? 'scale-110' : ''
                    }`}>
                      {isCompleted ? '✅' : isCurrent ? '🔄' : tab.icon}
                    </span>
                    <span className="hidden md:inline">{tab.name}</span>
                    <span className="md:hidden text-[10px] sm:text-xs font-bold">{tab.name.split(' ')[0]}</span>
                    
                    {/* Futuristic Active Indicator */}
                    {isCurrent && (
                      <>
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse shadow-glow-md pointer-events-none"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-t-xl animate-pulse pointer-events-none"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl rounded-t-xl pointer-events-none"></div>
                      </>
                    )}
                    
                    {/* Completed glow */}
                    {isCompleted && (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-200/20 to-emerald-200/20 rounded-t-xl pointer-events-none"></div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Futuristic Back Button - Mobile Optimized */}
            <button
              onClick={() => router.push('/')}
              className="relative overflow-hidden group ml-2 sm:ml-4 flex-shrink-0 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white/80 hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-1 sm:space-x-2"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 group-hover:animate-bounce" />
              <span className="hidden md:inline">Dashboard</span>
              <span className="md:hidden text-xs">Back</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>

        {/* Futuristic Navigation Bar with Glassmorphism - Mobile Optimized */}
        <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm border-t border-white/30 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-3 relative">
            <div className="flex justify-between items-center gap-2 sm:gap-4">
              {/* Futuristic Previous Button - Mobile Optimized */}
              <div className="flex-1 min-w-0">
                {tabIndex > 0 ? (
                  <button 
                    onClick={handlePrevTab}
                    className="relative overflow-hidden group bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white/80 hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-bounce flex-shrink-0 text-blue-600" />
                    <span className="font-semibold text-gray-700 text-xs sm:text-sm truncate">{tabs[tabIndex - 1]?.name}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                ) : (
                  <div className="text-xs sm:text-sm text-gray-400 italic hidden sm:flex items-center space-x-2 px-4">
                    <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                    <span>Start of workflow</span>
                  </div>
                )}
              </div>

              {/* Futuristic Progress Indicator - Mobile Optimized */}
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                {/* Glassmorphism Step Counter */}
                <div className="bg-white/80 backdrop-blur-sm rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-lg border border-white/40 flex items-center space-x-1.5 sm:space-x-2">
                  <span className="text-xs sm:text-sm text-gray-700 font-bold whitespace-nowrap">
                    {tabIndex + 1}/{tabs.length}
                  </span>
                  <span className="text-xs font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline">
                    • {Math.round(((tabIndex + 1) / tabs.length) * 100)}%
                  </span>
                </div>
                
                {/* Futuristic Progress Bar - Hidden on mobile */}
                <div className="w-20 sm:w-40 h-2 sm:h-3 bg-white/40 backdrop-blur-sm rounded-full overflow-hidden shadow-inner border border-white/30 hidden md:block">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out relative"
                    style={{ width: `${((tabIndex + 1) / tabs.length) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              </div>

              {/* Futuristic Next Button - Mobile Optimized */}
              <div className="flex-1 flex justify-end min-w-0">
                {tabIndex < tabs.length - 1 ? (
                  <button
                    onClick={handleNextTab}
                    className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg hover:shadow-glow-lg transform hover:scale-105 active:scale-95 transition-all duration-300 flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-end"
                  >
                    <span className="font-bold text-xs sm:text-sm truncate relative z-10">{tabs[tabIndex + 1]?.name}</span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-bounce flex-shrink-0 relative z-10" />
                    
                    {/* Ripple effect */}
                    <div className="absolute inset-0 bg-white/20 scale-0 group-active:scale-100 transition-transform duration-300 rounded-lg"></div>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-purple-400/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </button>
                ) : (
                  <div className="relative overflow-hidden flex items-center space-x-2 text-green-600 font-bold bg-gradient-to-r from-green-50 to-emerald-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 border-green-200 shadow-lg text-xs sm:text-sm">
                    <span className="hidden sm:inline">Complete!</span>
                    <span className="sm:hidden">Done!</span>
                    <span className="text-base sm:text-lg animate-bounce">🎉</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-200/20 to-emerald-200/20 animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area with Glassmorphism - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto calculator-content relative">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
            <div className="p-4 sm:p-6 lg:p-8 relative z-10">
              {/* Section transition wrapper */}
              <div className="animate-fade-in-up">
                {tabIndex === 0 && (
                  <DealDetailsSection onNext={() => {}} />
                )}
                {tabIndex === 1 && (
                  <HardwareSection onNext={() => {}} onPrev={() => {}} />
                )}
                {tabIndex === 2 && (
                  <ConnectivitySection onNext={() => {}} onPrev={() => {}} />
                )}
                {tabIndex === 3 && (
                  <LicensingSection onNext={() => {}} onPrev={() => {}} />
                )}
                {tabIndex === 4 && (
                  <SettlementSection onNext={() => {}} onPrev={() => {}} />
                )}
                {tabIndex === 5 && (
                  <TotalCostsSection onPrev={() => {}} />
                )}
              </div>
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