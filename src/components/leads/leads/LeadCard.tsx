'use client';

import { memo, useState } from 'react';
import { Lead, LeadStatus, STATUS_COLORS } from '@/lib/leads/types';
import { Card } from '@/components/leads/ui/Card';
import { cn } from '@/lib/utils';
import { useSwipeGestureRef } from '@/hooks/leads/useSwipeGesture';
import { 
  MapPin, 
  Phone, 
  Building2, 
  Briefcase, 
  StickyNote,
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  FileText,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onStatusChange?: (leadId: string, status: LeadStatus, additionalData?: any) => void;
  onUpdate?: (leadId: string, updates: Partial<Lead>) => void;
  onEdit?: (lead: Lead) => void;
  onDelete?: (leadId: string) => void;
  onViewDetails?: (lead: Lead) => void;
  isSelected?: boolean;
  onSelect?: (leadId: string) => void;
  onDeselect?: (leadId: string) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact';
}

const LeadCardComponent = ({
  lead,
  onStatusChange,
  onEdit,
  onDelete,
  onViewDetails,
  isSelected = false,
  onSelect,
  showActions = true,
  variant = 'default'
}: LeadCardProps) => {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const statusColor = STATUS_COLORS[lead.status];
  
  // Provider-specific styling (Telkom priority)
  const isTelkom = lead.provider?.toLowerCase().includes('telkom');
  
  // Swipe gesture handlers for mobile
  const swipeRef = useSwipeGestureRef<HTMLDivElement>({
    onSwipeLeft: () => {
      if (lead.status === 'leads' && onStatusChange) {
        setSwipeDirection('left');
        setTimeout(() => {
          onStatusChange(lead.id, 'bad');
          setSwipeDirection(null);
        }, 300);
      }
    },
    onSwipeRight: () => {
      if (lead.status === 'leads' && onStatusChange) {
        setSwipeDirection('right');
        setTimeout(() => {
          onStatusChange(lead.id, 'working');
          setSwipeDirection(null);
        }, 300);
      }
    },
    threshold: 80,
    velocityThreshold: 0.3,
  });
  
  // Status-specific styling
  const isBadLead = lead.status === 'bad';
  const isLaterStage = lead.status === 'later';
  const isSigned = lead.status === 'signed';
  
  // Callback reminder styling
  const getCallbackReminderStyle = () => {
    if (!lead.date_to_call_back || lead.status !== 'later') return '';
    
    const callbackDate = new Date(lead.date_to_call_back);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    callbackDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((callbackDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'ring-2 ring-green-500 bg-green-50';
    if (diffDays === 2) return 'ring-2 ring-blue-400 bg-blue-50';
    if (diffDays < 0) return 'ring-2 ring-red-500 bg-red-50';
    
    return '';
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    if (onStatusChange) {
      onStatusChange(lead.id, newStatus);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(lead.id);
    }
  };

  return (
    <div
      ref={swipeRef}
      className={cn(
        'relative',
        swipeDirection === 'right' && 'animate-slide-in-right',
        swipeDirection === 'left' && 'animate-slide-in-left'
      )}
    >
      {/* Swipe Indicators */}
      {lead.status === 'leads' && (
        <>
          <div
            className={cn(
              'absolute left-0 top-0 bottom-0 w-20 bg-green-500 rounded-l-xl flex items-center justify-center transition-opacity duration-200 z-0',
              swipeDirection === 'right' ? 'opacity-100' : 'opacity-0'
            )}
            aria-hidden="true"
          >
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <div
            className={cn(
              'absolute right-0 top-0 bottom-0 w-20 bg-red-500 rounded-r-xl flex items-center justify-center transition-opacity duration-200 z-0',
              swipeDirection === 'left' ? 'opacity-100' : 'opacity-0'
            )}
            aria-hidden="true"
          >
            <Trash2 className="w-8 h-8 text-white" />
          </div>
        </>
      )}
      
      <Card
        variant="glass"
        padding={variant === 'compact' ? 'sm' : 'md'}
        className={cn(
          'relative transition-all duration-300 hover:scale-[1.02] touch-manipulation z-10 h-full flex flex-col',
          isBadLead && 'bg-red-50/80 border-red-200',
          isSigned && 'bg-green-50/80 border-green-200',
          lead.background_color && 'border-2 border-red-500',
          isTelkom && 'border-l-4 border-l-blue-600',
          isSelected && 'ring-2 ring-blue-500 bg-blue-50/50',
          getCallbackReminderStyle(),
          swipeDirection && 'transform translate-x-0'
        )}
        style={{
          backgroundColor: lead.background_color || undefined
        }}
        onClick={handleSelect}
        role="article"
        aria-label={`Lead card for ${lead.name}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelect();
          }
        }}
      >
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide',
            statusColor === 'blue' && 'bg-blue-100 text-blue-700',
            statusColor === 'yellow' && 'bg-yellow-100 text-yellow-700',
            statusColor === 'red' && 'bg-red-100 text-red-700',
            statusColor === 'purple' && 'bg-purple-100 text-purple-700',
            statusColor === 'green' && 'bg-green-100 text-green-700'
          )}
        >
          {lead.status}
        </span>
      </div>

      {/* Lead Number */}
      {lead.number && (
        <div className="absolute top-4 left-4">
          <span className="text-sm font-bold text-gray-500">
            #{lead.number}
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="mt-8 space-y-3 flex-1">
        {/* Name */}
        <h3 className="text-lg font-bold text-gray-900 pr-20 line-clamp-2" title={lead.name}>
          {lead.name}
        </h3>

        {/* Provider */}
        {lead.provider && (
          <div className="flex items-center space-x-2 text-sm">
            <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
            <span className={cn(
              'font-medium',
              isTelkom && 'text-blue-600 font-semibold'
            )}>
              {lead.provider}
            </span>
          </div>
        )}

        {/* Phone */}
        {lead.phone && (
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
            <a 
              href={`tel:${lead.phone}`}
              className="text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {lead.phone}
            </a>
          </div>
        )}

        {/* Address */}
        {lead.address && (
          <div className="flex items-start space-x-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-gray-700 line-clamp-2">{lead.address}</span>
          </div>
        )}

        {/* Business Type */}
        {lead.type_of_business && (
          <div className="flex items-center space-x-2 text-sm">
            <Briefcase className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
            <span className="text-gray-700">{lead.type_of_business}</span>
          </div>
        )}

        {/* Callback Date */}
        {lead.date_to_call_back && isLaterStage && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
            <span className="text-gray-700 font-medium">
              Call back: {new Date(lead.date_to_call_back).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Notes Preview */}
        {lead.notes && variant !== 'compact' && (
          <div className="flex items-start space-x-2 text-sm">
            <StickyNote className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-gray-600 line-clamp-2 italic">{lead.notes}</span>
          </div>
        )}
      </div>

      {/* Swipe Hint for Mobile */}
      {lead.status === 'leads' && variant !== 'compact' && (
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400 md:hidden" aria-hidden="true">
          <div className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            <span>Swipe right to select</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Swipe left for no good</span>
            <ChevronLeft className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
          {/* Status Change Buttons */}
          {lead.status === 'leads' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('working');
                }}
                className="btn btn-success flex-1 min-w-[120px] touch-target"
                aria-label="Select lead and move to working area"
              >
                <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                Select
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('bad');
                }}
                className="btn btn-danger flex-1 min-w-[120px] touch-target"
                aria-label="Mark lead as no good"
              >
                No Good
              </button>
            </>
          )}

          {/* View Details Button */}
          {onViewDetails && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(lead);
              }}
              className="btn btn-secondary touch-target"
              aria-label={`View notes and activity for ${lead.name}`}
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">View Details</span>
            </button>
          )}

          {/* Edit Button */}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(lead);
              }}
              className="btn btn-secondary touch-target"
              aria-label={`Edit lead information for ${lead.name}`}
            >
              <Edit className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Edit</span>
            </button>
          )}

          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete ${lead.name}?`)) {
                  onDelete(lead.id);
                }
              }}
              className="btn btn-danger touch-target"
              aria-label={`Delete lead ${lead.name}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Delete</span>
            </button>
          )}
        </div>
      )}

      {/* Maps Link */}
      {lead.maps_address && (
        <div className="mt-4">
          <a
            href={lead.maps_address}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center space-x-1 touch-target"
            onClick={(e) => e.stopPropagation()}
            aria-label={`View ${lead.name} location on Google Maps`}
          >
            <MapPin className="w-3 h-3" aria-hidden="true" />
            <span>View on Google Maps</span>
          </a>
        </div>
      )}
      </Card>
    </div>
  );
};

LeadCardComponent.displayName = 'LeadCard';

export const LeadCard = memo(LeadCardComponent);
