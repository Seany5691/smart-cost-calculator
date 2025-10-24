'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Table, ExternalLink } from 'lucide-react';
import type { Business } from '@/lib/scraper/types';

interface ViewAllResultsProps {
  businesses: Business[];
}

const ViewAllResults = React.memo(({ businesses }: ViewAllResultsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (businesses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-lg">
            <Table className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              View All Results
            </h3>
            <p className="text-sm text-gray-600">
              {businesses.length} businesses scraped
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-secondary flex items-center gap-2"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Business Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Provider</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Industry</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Town</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Address</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Maps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {businesses.map((business, index) => (
                    <tr
                      key={`${business.phone}-${index}`}
                      className="hover:bg-white transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {business.name}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {business.phone || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                          ${business.provider === 'Unknown'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700'
                          }
                        `}>
                          {business.provider || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {business.type_of_business}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {business.town}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                        {business.address || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {business.maps_address ? (
                          <a
                            href={business.maps_address}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="text-xs">View</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View - No Horizontal Scroll */}
          <div className="md:hidden space-y-3 max-h-96 overflow-y-auto">
            {businesses.map((business, index) => (
              <div
                key={`${business.phone}-${index}`}
                className="bg-white rounded-lg p-4 border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all duration-300"
              >
                {/* Business Name */}
                <div className="font-bold text-gray-900 text-base mb-3 flex items-start justify-between">
                  <span className="flex-1">{business.name}</span>
                  {business.maps_address && (
                    <a
                      href={business.maps_address}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                      aria-label="View on Google Maps"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Business Details Grid */}
                <div className="space-y-2 text-sm">
                  {/* Phone */}
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Phone:</span>
                    <span className="text-gray-900 font-semibold">{business.phone || 'N/A'}</span>
                  </div>

                  {/* Provider */}
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Provider:</span>
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${business.provider === 'Unknown'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700'
                      }
                    `}>
                      {business.provider || 'Unknown'}
                    </span>
                  </div>

                  {/* Industry */}
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Industry:</span>
                    <span className="text-gray-900 text-right">{business.type_of_business}</span>
                  </div>

                  {/* Town */}
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Town:</span>
                    <span className="text-gray-900">{business.town}</span>
                  </div>

                  {/* Address */}
                  {business.address && business.address !== 'N/A' && (
                    <div className="pt-1.5">
                      <span className="text-gray-600 font-medium block mb-1">Address:</span>
                      <span className="text-gray-700 text-xs leading-relaxed block">{business.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

ViewAllResults.displayName = 'ViewAllResults';

export default ViewAllResults;
