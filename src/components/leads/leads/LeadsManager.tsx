'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Users, Upload, Route as RouteIcon, Search, Calendar } from 'lucide-react';
import { LeadCard } from './LeadCard';
import { LeadTable } from './LeadTable';
import { StatusManager } from './StatusManager';
import { RouteGenerator } from './RouteGenerator';
import { LeadSearch } from './LeadSearch';
import { LeadDetailsModal } from './LeadDetailsModal';
import { ReminderManager } from './ReminderManager';
import { useLeadsStore } from '@/store/leads/leads';
import { useRoutesStore } from '@/store/leads/routes';
import { Lead, LeadStatus, LeadSortOptions } from '@/lib/leads/types';

export function LeadsManager() {
  const [tabIndex, setTabIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [sortOptions, setSortOptions] = useState<LeadSortOptions>({
    field: 'number',
    direction: 'asc'
  });
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<Lead | null>(null);

  const router = useRouter();
  const { leads, fetchLeads, changeLeadStatus, updateLead, deleteLead, isLoading } = useLeadsStore();
  const { createRoute } = useRoutesStore();

  // Import sorting utilities
  const { sortLeads, sortLeadsByProvider } = require('@/lib/leadUtils');

  // Fetch leads on mount
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

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
      } else if (event.key === 'ArrowRight' && tabIndex < tabs.length - 1) {
        event.preventDefault();
        handleNextTab();
      } else if (event.key >= '1' && event.key <= String(tabs.length)) {
        event.preventDefault();
        const targetIndex = parseInt(event.key) - 1;
        if (targetIndex >= 0 && targetIndex < tabs.length) {
          setTabIndex(targetIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabIndex]);

  const tabs = [
    { name: 'All Leads', icon: <Users className="w-4 h-4" /> },
    { name: 'Import', icon: <Upload className="w-4 h-4" /> },
    { name: 'Routes', icon: <RouteIcon className="w-4 h-4" /> },
    { name: 'Search', icon: <Search className="w-4 h-4" /> },
    { name: 'Callbacks', icon: <Calendar className="w-4 h-4" /> },
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

  const handleStatusChange = async (leadId: string, status: LeadStatus, additionalData?: any) => {
    await changeLeadStatus(leadId, status, additionalData);
  };

  const handleEdit = async (lead: Lead) => {
    await updateLead(lead.id, lead);
  };

  const handleDelete = async (leadId: string) => {
    await deleteLead(leadId);
  };

  const handleViewDetails = (lead: Lead) => {
    setSelectedLeadForDetails(lead);
  };

  const handleBulkAction = async (leadIds: string[], action: string) => {
    if (action === 'delete') {
      for (const id of leadIds) {
        await deleteLead(id);
      }
      setSelectedLeads([]);
    }
  };

  const handleRouteGenerated = async (route: any) => {
    await createRoute(route);
    setSelectedLeads([]);
  };

  const handleUpdateCallback = async (leadId: string, date: string | null) => {
    await updateLead(leadId, { date_to_call_back: date });
    await fetchLeads(); // Refresh to update reminders
  };

  const handleCompleteCallback = async (leadId: string) => {
    // Move lead to "working" status when callback is completed
    await changeLeadStatus(leadId, 'working', {});
    await fetchLeads(); // Refresh to update reminders
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

      {/* Enhanced Fixed Tabs and Navigation Container - Glassmorphism */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl shadow-2xl border-b border-white/20 z-40 relative">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
        
        {/* Futuristic Tabs with Glassmorphism - Mobile Responsive */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative">
          <div className="flex items-center justify-between border-b border-white/20">
            <div className="flex overflow-x-auto overflow-y-visible scrollbar-hide flex-1">
              {tabs.map((tab, index) => {
                const isCurrent = index === tabIndex;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleTabChange(index)}
                    className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-5 py-3 sm:py-3.5 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-500 border-b-3 relative group cursor-pointer touch-manipulation flex-shrink-0 ${
                      isCurrent
                        ? 'text-blue-600 border-blue-600 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm shadow-lg sm:transform sm:scale-110'
                        : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-white/40 hover:backdrop-blur-sm sm:hover:transform sm:hover:scale-105'
                    }`}
                  >
                    <span className={`transition-all duration-300 ${
                      isCurrent ? 'scale-125 animate-bounce-subtle' : ''
                    }`}>
                      {tab.icon}
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
                    <span>Lead Management</span>
                  </div>
                )}
              </div>

              {/* Tab Indicator */}
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                <div className="bg-white/80 backdrop-blur-sm rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-lg border border-white/40 flex items-center space-x-1.5 sm:space-x-2">
                  <span className="text-xs sm:text-sm text-gray-700 font-bold whitespace-nowrap">
                    {tabIndex + 1}/{tabs.length}
                  </span>
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
                    <div className="absolute inset-0 bg-white/20 scale-0 group-active:scale-100 transition-transform duration-300 rounded-lg"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-purple-400/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </button>
                ) : (
                  <div className="text-xs sm:text-sm text-gray-400 italic hidden sm:flex items-center space-x-2 px-4">
                    <span>End of sections</span>
                    <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area with Glassmorphism - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
            <div className="p-4 sm:p-6 lg:p-8 relative z-10">
              {/* Section transition wrapper */}
              <div className="animate-fade-in-up">
                {/* Tab 0: All Leads */}
                {tabIndex === 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold gradient-text">All Leads</h2>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewMode('card')}
                          className={`btn ${viewMode === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                          Cards
                        </button>
                        <button
                          onClick={() => setViewMode('table')}
                          className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                          Table
                        </button>
                      </div>
                    </div>

                    {isLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading leads...</p>
                      </div>
                    ) : viewMode === 'card' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {leads.map(lead => (
                          <LeadCard
                            key={lead.id}
                            lead={lead}
                            onStatusChange={handleStatusChange}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onViewDetails={handleViewDetails}
                            isSelected={selectedLeads.includes(lead.id)}
                            onSelect={(id) => {
                              setSelectedLeads(prev =>
                                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                              );
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <LeadTable
                        leads={leads}
                        onStatusChange={handleStatusChange}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onBulkAction={handleBulkAction}
                        sortOptions={sortOptions}
                        onSort={setSortOptions}
                        selectedLeads={selectedLeads}
                        onSelectionChange={setSelectedLeads}
                      />
                    )}
                  </div>
                )}

                {/* Tab 1: Import */}
                {tabIndex === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold gradient-text">Import Leads</h2>
                    <p className="text-gray-600">Import functionality coming soon...</p>
                  </div>
                )}

                {/* Tab 2: Routes */}
                {tabIndex === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold gradient-text">Generate Route</h2>
                    {selectedLeads.length > 0 ? (
                      <RouteGenerator
                        leads={leads.filter(l => selectedLeads.includes(l.id))}
                        onRouteGenerated={handleRouteGenerated}
                      />
                    ) : (
                      <div className="text-center py-12 bg-yellow-50 rounded-xl border border-yellow-200">
                        <p className="text-yellow-800">Please select leads from the "All Leads" tab to generate a route.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Search */}
                {tabIndex === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold gradient-text">Search & Filter</h2>
                    
                    <LeadSearch 
                      onSearchResults={setSearchResults}
                      showResults={true}
                    />

                    {searchResults.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <h3 className="text-lg font-semibold text-gray-700">
                            Search Results ({searchResults.length})
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                const sorted = sortLeadsByProvider(searchResults);
                                setSearchResults(sorted);
                              }}
                              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Sort by Provider
                            </button>
                            <button
                              onClick={() => setViewMode('card')}
                              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                                viewMode === 'card' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              Cards
                            </button>
                            <button
                              onClick={() => setViewMode('table')}
                              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                                viewMode === 'table' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              Table
                            </button>
                          </div>
                        </div>

                        {viewMode === 'card' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {searchResults.map(lead => (
                              <LeadCard
                                key={lead.id}
                                lead={lead}
                                onStatusChange={handleStatusChange}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onViewDetails={handleViewDetails}
                                isSelected={selectedLeads.includes(lead.id)}
                                onSelect={(id) => {
                                  setSelectedLeads(prev =>
                                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                                  );
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <LeadTable
                            leads={searchResults}
                            onStatusChange={handleStatusChange}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onBulkAction={handleBulkAction}
                            sortOptions={sortOptions}
                            onSort={(newSort) => {
                              setSortOptions(newSort);
                              const sorted = sortLeads(searchResults, newSort);
                              setSearchResults(sorted);
                            }}
                            selectedLeads={selectedLeads}
                            onSelectionChange={setSelectedLeads}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 4: Callbacks */}
                {tabIndex === 4 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold gradient-text">Callback Reminders</h2>
                    <ReminderManager
                      leads={leads}
                      onUpdateCallback={handleUpdateCallback}
                      onCompleteCallback={handleCompleteCallback}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Details Modal */}
      {selectedLeadForDetails && (
        <LeadDetailsModal
          lead={selectedLeadForDetails}
          isOpen={!!selectedLeadForDetails}
          onClose={() => setSelectedLeadForDetails(null)}
        />
      )}
    </div>
  );
}
