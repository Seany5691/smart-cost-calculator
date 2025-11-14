'use client';

import { memo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lead, Route, Coordinates } from '@/lib/leads/types';
import { parseGoogleMapsUrl, generateRouteUrl, isValidCoordinate } from '@/lib/leads/routeUtils';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Navigation,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Loader2,
  Info,
  X
} from 'lucide-react';

interface RouteGeneratorProps {
  leads: Lead[];
  onRouteGenerated: (route: Route) => void;
  maxLeads?: number;
  autoGenerateName?: boolean;
}

const RouteGeneratorComponent = ({
  leads,
  onRouteGenerated,
  maxLeads = 25,
  autoGenerateName = true
}: RouteGeneratorProps) => {
  const [routeName, setRouteName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validCoordinates, setValidCoordinates] = useState<Coordinates[]>([]);
  const [routeUrl, setRouteUrl] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Validate leads and extract coordinates
  useEffect(() => {
    const errors: string[] = [];
    const coords: Coordinates[] = [];

    if (leads.length === 0) {
      errors.push('No leads selected for route generation');
    }

    if (leads.length > maxLeads) {
      errors.push(`Too many leads selected. Maximum is ${maxLeads} stops.`);
    }

    leads.forEach((lead, index) => {
      if (!lead.maps_address) {
        errors.push(`Lead #${index + 1} (${lead.name}) is missing a Google Maps address`);
        return;
      }

      try {
        const extracted = parseGoogleMapsUrl(lead.maps_address);
        if (extracted && isValidCoordinate(extracted)) {
          coords.push(extracted);
        } else {
          errors.push(`Lead #${index + 1} (${lead.name}) has an invalid Google Maps URL`);
        }
      } catch (error) {
        errors.push(`Lead #${index + 1} (${lead.name}) - Failed to extract coordinates`);
      }
    });

    setValidationErrors(errors);
    setValidCoordinates(coords);

    // Auto-generate route name
    if (autoGenerateName && leads.length > 0) {
      const date = new Date().toLocaleDateString();
      setRouteName(`Route - ${date} (${leads.length} stops)`);
    }
  }, [leads, maxLeads, autoGenerateName]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerateRoute = async () => {
    if (validationErrors.length > 0) {
      setErrorMessage('Please fix validation errors before generating route');
      return;
    }

    if (!routeName.trim()) {
      setErrorMessage('Please enter a route name');
      return;
    }

    setIsGenerating(true);

    try {
      // Generate Google Maps URL
      const url = generateRouteUrl(validCoordinates);
      setRouteUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate route:', error);
      setErrorMessage('Failed to generate route. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmRoute = async () => {
    if (!routeUrl) return;

    const route: Partial<Route> = {
      name: routeName,
      route_url: routeUrl,
      stop_count: validCoordinates.length,
      lead_ids: leads.map(lead => lead.id)
    };

    try {
      // Save route and trigger callback
      await onRouteGenerated(route as Route);
      
      // Reset state
      setShowPreview(false);
      const savedRouteName = routeName;
      setRouteName('');
      setRouteUrl('');
      
      // Show success notification
      setSuccessMessage(`Route "${savedRouteName}" saved successfully! You can view it in the Routes page.`);
    } catch (error) {
      console.error('Failed to save route:', error);
      setErrorMessage('Failed to save route. Please try again.');
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setRouteUrl('');
  };

  const stopCount = validCoordinates.length;
  const hasWarning = stopCount > 10;
  const hasError = validationErrors.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Navigation className="w-6 h-6 text-blue-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Generate Route
            </h3>
            <p className="text-sm text-gray-600">
              Create a Google Maps route from selected leads
            </p>
          </div>
        </div>
      </div>

      {/* Route Info Card */}
      <div className={cn(
        'p-4 rounded-lg border-2 transition-all',
        hasError && 'bg-red-50 border-red-300',
        !hasError && hasWarning && 'bg-yellow-50 border-yellow-300',
        !hasError && !hasWarning && 'bg-blue-50 border-blue-300'
      )}>
        <div className="flex items-start space-x-3">
          {hasError ? (
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          ) : hasWarning ? (
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">
                {stopCount} {stopCount === 1 ? 'Stop' : 'Stops'}
              </span>
              <span className={cn(
                'text-sm font-medium',
                hasError && 'text-red-700',
                !hasError && hasWarning && 'text-yellow-700',
                !hasError && !hasWarning && 'text-blue-700'
              )}>
                {hasError ? 'Errors Found' : hasWarning ? 'Warning' : 'Ready'}
              </span>
            </div>

            {/* Warnings */}
            {hasWarning && !hasError && (
              <div className="text-sm text-yellow-800">
                <p className="font-medium">⚠️ Route has more than 10 stops</p>
                <p className="mt-1">
                  Google Maps may have difficulty with routes over 10 stops. Consider using Google My Maps for better route planning.
                </p>
              </div>
            )}

            {/* Errors */}
            {hasError && (
              <div className="text-sm text-red-800 space-y-1">
                <p className="font-medium">❌ Please fix the following errors:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success Info */}
            {!hasError && !hasWarning && stopCount > 0 && (
              <div className="text-sm text-blue-800">
                <p>✓ All leads have valid coordinates and are ready for route generation</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lead List */}
      {leads.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-gray-600" aria-hidden="true" />
            Selected Leads ({leads.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {leads.map((lead, index) => {
              const hasValidCoords = validCoordinates[index] !== undefined;
              return (
                <div
                  key={lead.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded border',
                    hasValidCoords ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  )}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {lead.name}
                    </span>
                    {lead.provider && (
                      <span className="text-xs text-gray-500 truncate">
                        ({lead.provider})
                      </span>
                    )}
                  </div>
                  {hasValidCoords ? (
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Route Name Input */}
      <div>
        <label className="label">
          Route Name *
        </label>
        <input
          type="text"
          value={routeName}
          onChange={(e) => setRouteName(e.target.value)}
          placeholder="e.g., Morning Route - Telkom Leads"
          className="input"
          disabled={isGenerating}
          required
          aria-label="Route name"
          aria-required="true"
        />
        <p className="text-xs text-gray-500 mt-1">
          Give your route a descriptive name for easy reference
        </p>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateRoute}
        disabled={hasError || !routeName.trim() || isGenerating || stopCount === 0}
        className={cn(
          'btn btn-primary w-full touch-target',
          (hasError || !routeName.trim() || stopCount === 0) && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="Generate route"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
            Generating Route...
          </>
        ) : (
          <>
            <Navigation className="w-5 h-5 mr-2" aria-hidden="true" />
            Generate Route
          </>
        )}
      </button>

      {/* Route Preview Modal */}
      {showPreview && routeUrl && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Route Generated Successfully!
                </h3>
                <p className="text-sm text-gray-600">
                  Review your route before saving
                </p>
              </div>
            </div>

            {/* Route Details */}
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Route Name</p>
                    <p className="font-semibold text-gray-900">{routeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Stops</p>
                    <p className="font-semibold text-gray-900">{stopCount}</p>
                  </div>
                </div>
              </div>

              {/* Warning for large routes */}
              {stopCount > 10 && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Large Route Warning</p>
                      <p className="mt-1">
                        This route has {stopCount} stops. Google Maps works best with 10 or fewer stops. 
                        For better route optimization, consider using Google My Maps.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Route URL Preview */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Route URL</p>
                <div className="p-3 bg-gray-100 rounded border border-gray-300 text-xs text-gray-600 break-all">
                  {routeUrl}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={routeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline flex-1 flex items-center justify-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />
                Preview in Google Maps
              </a>
              <button
                onClick={handleConfirmRoute}
                className="btn btn-success flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                Save Route
              </button>
              <button
                onClick={handleCancelPreview}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Success Message Modal */}
      {successMessage && mounted && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={() => setSuccessMessage(null)}
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Success!</h3>
              </div>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              <button
                onClick={() => setSuccessMessage(null)}
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
                  <AlertTriangle className="w-6 h-6 text-red-600" />
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
  );
};

RouteGeneratorComponent.displayName = 'RouteGenerator';

export const RouteGenerator = memo(RouteGeneratorComponent);
