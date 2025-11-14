'use client';

import { useMemo } from 'react';
import { Calendar, Clock, Phone, MapPin, ArrowRight } from 'lucide-react';
import { Lead } from '@/lib/leads/types';
import { cn } from '@/lib/utils';

interface UpcomingEventsProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  daysAhead?: number; // Maximum days to show (default 30)
}

export const UpcomingEvents = ({ leads, onLeadClick, daysAhead = 30 }: UpcomingEventsProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group callbacks by date
  const groupedCallbacks = useMemo(() => {
    const groups: Record<string, Lead[]> = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      nextWeek: [],
      later: []
    };

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));

    const endOfNextWeek = new Date(endOfWeek);
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + daysAhead);

    leads
      .filter(lead => lead.date_to_call_back)
      .sort((a, b) => {
        const dateA = new Date(a.date_to_call_back!).getTime();
        const dateB = new Date(b.date_to_call_back!).getTime();
        return dateA - dateB;
      })
      .forEach(lead => {
        const callbackDate = new Date(lead.date_to_call_back!);
        callbackDate.setHours(0, 0, 0, 0);
        const callbackTime = callbackDate.getTime();

        if (callbackTime > maxDate.getTime()) return;

        if (callbackTime === today.getTime()) {
          groups.today.push(lead);
        } else if (callbackTime === tomorrow.getTime()) {
          groups.tomorrow.push(lead);
        } else if (callbackTime <= endOfWeek.getTime()) {
          groups.thisWeek.push(lead);
        } else if (callbackTime <= endOfNextWeek.getTime()) {
          groups.nextWeek.push(lead);
        } else {
          groups.later.push(lead);
        }
      });

    return groups;
  }, [leads, daysAhead]);

  const totalCallbacks = Object.values(groupedCallbacks).reduce((sum, group) => sum + group.length, 0);

  const getStatusColor = (groupKey: string) => {
    switch (groupKey) {
      case 'today': return 'text-green-600 bg-green-50 border-green-200';
      case 'tomorrow': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'thisWeek': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'nextWeek': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getGroupTitle = (groupKey: string) => {
    switch (groupKey) {
      case 'today': return 'Today';
      case 'tomorrow': return 'Tomorrow';
      case 'thisWeek': return 'This Week';
      case 'nextWeek': return 'Next Week';
      default: return 'Later';
    }
  };

  const formatCallbackTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Callbacks</h2>
            <p className="text-sm text-gray-600">Next {daysAhead} days (1 month)</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{totalCallbacks}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
      </div>

      {/* Callbacks List */}
      {totalCallbacks === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No upcoming callbacks</p>
          <p className="text-sm text-gray-500 mt-1">Schedule callbacks to see them here</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {Object.entries(groupedCallbacks).map(([groupKey, groupLeads]) => {
            if (groupLeads.length === 0) return null;

            return (
              <div key={groupKey}>
                <div className="flex items-center space-x-2 mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {getGroupTitle(groupKey)}
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                    {groupLeads.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {groupLeads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => onLeadClick?.(lead)}
                      className={cn(
                        'p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md',
                        getStatusColor(groupKey)
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {lead.name}
                            </h4>
                            {lead.provider && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-white rounded-full">
                                {lead.provider}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatCallbackTime(lead.date_to_call_back!)}</span>
                            </div>
                            {lead.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="w-3 h-3" />
                                <span>{lead.phone}</span>
                              </div>
                            )}
                            {lead.type_of_business && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{lead.type_of_business}</span>
                              </div>
                            )}
                          </div>

                          {lead.notes && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {lead.notes}
                            </p>
                          )}
                        </div>

                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View All Link */}
      {totalCallbacks > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <button
            onClick={() => onLeadClick?.(groupedCallbacks.today[0] || groupedCallbacks.tomorrow[0])}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All Callbacks →
          </button>
        </div>
      )}
    </div>
  );
};
