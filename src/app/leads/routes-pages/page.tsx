'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRoutesStore } from '@/store/leads/routes';
import { useLeadsStore } from '@/store/leads/leads';
import { Route, Lead } from '@/lib/leads/types';
import { storage, STORAGE_KEYS } from '@/lib/leads/localStorage';
import { 
  MapPin, 
  ExternalLink, 
  Trash2, 
  Calendar,
  Navigation,
  Download,
  Share2,
  TrendingUp,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RoutesPage() {
  const { 
    routes, 
    isLoading, 
    error, 
    fetchRoutes, 
    deleteRoute,
    getRouteStats 
  } = useRoutesStore();
  const { leads, fetchLeads } = useLeadsStore();
  
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchRoutes();
    fetchLeads();
  }, [fetchRoutes, fetchLeads]);

  const stats = getRouteStats();

  const handleDeleteRoute = async (routeId: string) => {
    try {
      await deleteRoute(routeId);
      setShowDeleteConfirm(null);
      if (selectedRoute?.id === routeId) {
        setSelectedRoute(null);
      }
    } catch (error) {
      console.error('Failed to delete route:', error);
      setErrorMessage('Failed to delete route. Please try again.');
    }
  };

  const handleShareRoute = (route: Route) => {
    setShareUrl(route.route_url);
    
    // Copy to clipboard
    navigator.clipboard.writeText(route.route_url).then(() => {
      setShareMessage('Route URL copied to clipboard!');
    }).catch(() => {
      setShareMessage('Failed to copy URL. Please copy manually from the text below.');
    });
  };

  const handleUpdateRouteNotes = async (routeId: string, notes: string) => {
    try {
      const allRoutes = storage.get<Route[]>(STORAGE_KEYS.ROUTES) || [];
      const routeIndex = allRoutes.findIndex(r => r.id === routeId);
      
      if (routeIndex !== -1) {
        allRoutes[routeIndex] = { ...allRoutes[routeIndex], notes };
        storage.set(STORAGE_KEYS.ROUTES, allRoutes);
        
        // Update local state
        await fetchRoutes();
      }
    } catch (error) {
      console.error('Failed to update route notes:', error);
    }
  };

  const handleExportRoute = (route: Route) => {
    const routeLeads = leads.filter(lead => route.lead_ids.includes(lead.id));
    
    const csvContent = [
      ['Route Name', route.name],
      ['Created', new Date(route.created_at).toLocaleString()],
      ['Total Stops', route.stop_count.toString()],
      ['Starting Point', route.starting_point || 'N/A'],
      ['Notes', route.notes || 'N/A'],
      ['Route URL', route.route_url],
      [''],
      ['Stop #', 'Name', 'Phone', 'Provider', 'Address', 'Business Type'],
      ...routeLeads.map((lead, index) => [
        (index + 1).toString(),
        lead.name,
        lead.phone || '',
        lead.provider || '',
        lead.address || '',
        lead.type_of_business || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${route.name.replace(/[^a-z0-9]/gi, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRouteLeads = (route: Route): Lead[] => {
    return leads.filter(lead => route.lead_ids.includes(lead.id));
  };

  if (isLoading && routes.length === 0) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading routes...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Error Loading Routes</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl shadow-lg">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Route History</h1>
              <p className="text-gray-600 mt-1">
                View and manage your generated routes
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Routes</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Navigation className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Stops</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalStops}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Stops/Route</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgStops}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Routes List */}
        {routes.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <MapPin className="w-12 h-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">No Routes Yet</h3>
                <p className="text-gray-600 mt-2">
                  Generate your first route from the Main Sheet to get started
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {routes.map((route) => {
              const routeLeads = getRouteLeads(route);
              const createdDate = new Date(route.created_at);
              const isRecent = Date.now() - createdDate.getTime() < 24 * 60 * 60 * 1000; // Within 24 hours

              return (
                <div
                  key={route.id}
                  className={cn(
                    'glass-card p-6 transition-all duration-300 hover:shadow-xl',
                    selectedRoute?.id === route.id && 'ring-2 ring-green-500'
                  )}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Route Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                          <Navigation className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              {route.name}
                            </h3>
                            {isRecent && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                New
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{route.stop_count} stops</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{createdDate.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>

                          {/* Lead Preview */}
                          {routeLeads.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {routeLeads.slice(0, 3).map((lead, index) => (
                                <span
                                  key={lead.id}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                                >
                                  {index + 1}. {lead.name}
                                </span>
                              ))}
                              {routeLeads.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{routeLeads.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 lg:flex-shrink-0">
                      <a
                        href={route.route_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary flex items-center space-x-2 text-sm"
                        aria-label={`Open ${route.name} in Google Maps`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open in Maps</span>
                      </a>

                      <button
                        onClick={() => handleShareRoute(route)}
                        className="btn btn-info flex items-center space-x-2 text-sm"
                        aria-label={`Share ${route.name}`}
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Share</span>
                      </button>

                      <button
                        onClick={() => handleExportRoute(route)}
                        className="btn btn-secondary flex items-center space-x-2 text-sm"
                        aria-label={`Export ${route.name}`}
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                      </button>

                      <button
                        onClick={() => setShowDeleteConfirm(route.id)}
                        className="btn btn-danger flex items-center space-x-2 text-sm"
                        aria-label={`Delete ${route.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedRoute?.id === route.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Route Details</h4>
                      
                      {/* Starting Point */}
                      {route.starting_point && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Starting Point
                          </label>
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-gray-700">
                            📍 {route.starting_point}
                          </div>
                        </div>
                      )}

                      {/* Route Notes */}
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Route Notes
                        </label>
                        <textarea
                          value={route.notes || ''}
                          onChange={(e) => handleUpdateRouteNotes(route.id, e.target.value)}
                          placeholder="Add notes about this route..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                          rows={3}
                        />
                      </div>
                      
                      {/* Route URL */}
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Route URL
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600 break-all">
                          {route.route_url}
                        </div>
                      </div>

                      {/* Stops List */}
                      {routeLeads.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Stops ({routeLeads.length})
                          </label>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {routeLeads.map((lead, index) => (
                              <div
                                key={lead.id}
                                className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200"
                              >
                                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-green-700">
                                    {index + 1}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {lead.name}
                                  </p>
                                  <p className="text-sm text-gray-600 truncate">
                                    {lead.provider && `${lead.provider} • `}
                                    {lead.phone || 'No phone'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Toggle Details Button */}
                  <button
                    onClick={() => setSelectedRoute(selectedRoute?.id === route.id ? null : route)}
                    className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    {selectedRoute?.id === route.id ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && mounted && createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={() => setShowDeleteConfirm(null)}
            />
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-slide-up">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Route?</h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this route? This action cannot be undone.
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDeleteRoute(showDeleteConfirm)}
                    className="btn btn-danger flex-1"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="btn btn-outline flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}

        {/* Share Success Modal */}
        {shareMessage && shareUrl && mounted && createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={() => {
                setShareMessage(null);
                setShareUrl(null);
              }}
            />
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Share2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Share Route</h3>
                </div>
                
                <p className="text-gray-600 mb-4">{shareMessage}</p>
                
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600 break-all mb-4">
                  {shareUrl}
                </div>

                <button
                  onClick={() => {
                    setShareMessage(null);
                    setShareUrl(null);
                  }}
                  className="btn btn-primary w-full"
                >
                  OK
                </button>
              </div>
            </div>
          </>,
          document.body
        )}

        {/* Error Message Modal */}
        {errorMessage && mounted && createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={() => setErrorMessage(null)}
            />
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Error</h3>
                </div>
                <p className="text-gray-600 mb-6">{errorMessage}</p>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="btn btn-primary w-full"
                >
                  OK
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    </div>
  );
}
