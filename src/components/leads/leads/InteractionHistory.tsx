'use client';

import { LeadInteraction, InteractionType } from '@/lib/leads/types';
import { Card } from '@/components/leads/ui/Card';
import { 
  Activity, 
  FileText, 
  Edit, 
  Trash2, 
  Plus, 
  RefreshCw,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractionHistoryProps {
  leadId: string;
  interactions: LeadInteraction[];
  isLoading?: boolean;
}

const getInteractionIcon = (type: InteractionType) => {
  switch (type) {
    case 'status_change':
      return RefreshCw;
    case 'note_added':
      return Plus;
    case 'note_updated':
      return Edit;
    case 'note_deleted':
      return Trash2;
    case 'lead_created':
      return Plus;
    case 'lead_updated':
      return Edit;
    case 'callback_scheduled':
      return Calendar;
    case 'callback_completed':
      return CheckCircle;
    default:
      return Activity;
  }
};

const getInteractionColor = (type: InteractionType) => {
  switch (type) {
    case 'status_change':
      return 'text-blue-600 bg-blue-100';
    case 'note_added':
      return 'text-green-600 bg-green-100';
    case 'note_updated':
      return 'text-yellow-600 bg-yellow-100';
    case 'note_deleted':
      return 'text-red-600 bg-red-100';
    case 'lead_created':
      return 'text-purple-600 bg-purple-100';
    case 'lead_updated':
      return 'text-indigo-600 bg-indigo-100';
    case 'callback_scheduled':
      return 'text-orange-600 bg-orange-100';
    case 'callback_completed':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const getInteractionDescription = (interaction: LeadInteraction) => {
  const { interaction_type, old_value, new_value, metadata } = interaction;

  switch (interaction_type) {
    case 'status_change':
      return (
        <span>
          Changed status from <strong className="text-gray-900">{old_value}</strong> to{' '}
          <strong className="text-gray-900">{new_value}</strong>
        </span>
      );
    case 'note_added':
      return (
        <span>
          Added a note: <em className="text-gray-700">"{new_value}"</em>
        </span>
      );
    case 'note_updated':
      return <span>Updated a note</span>;
    case 'note_deleted':
      return (
        <span>
          Deleted a note: <em className="text-gray-700">"{old_value}"</em>
        </span>
      );
    case 'lead_created':
      return (
        <span>
          Created lead <strong className="text-gray-900">{new_value}</strong>
        </span>
      );
    case 'lead_updated':
      return <span>Updated lead information</span>;
    case 'callback_scheduled':
      return (
        <span>
          Scheduled callback for{' '}
          <strong className="text-gray-900">
            {new_value ? new Date(new_value).toLocaleDateString() : 'unknown date'}
          </strong>
        </span>
      );
    case 'callback_completed':
      return <span>Completed callback</span>;
    default:
      return <span>Performed an action</span>;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const InteractionHistory = ({
  leadId,
  interactions,
  isLoading = false
}: InteractionHistoryProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Activity className="w-5 h-5 text-blue-600" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-gray-900">Activity History</h3>
      </div>

      {isLoading ? (
        <Card variant="glass" padding="md">
          <p className="text-gray-500 text-center">Loading activity...</p>
        </Card>
      ) : interactions.length === 0 ? (
        <Card variant="glass" padding="md">
          <p className="text-gray-500 text-center">No activity yet.</p>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" aria-hidden="true" />

          {/* Interactions */}
          <div className="space-y-4">
            {interactions.map((interaction, index) => {
              const Icon = getInteractionIcon(interaction.interaction_type);
              const colorClass = getInteractionColor(interaction.interaction_type);

              return (
                <div key={interaction.id} className="relative flex items-start space-x-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'relative z-10 flex items-center justify-center w-12 h-12 rounded-full',
                      colorClass
                    )}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>

                  {/* Content */}
                  <Card variant="glass" padding="sm" className="flex-1">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-800">
                        {getInteractionDescription(interaction)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(interaction.created_at)}
                      </p>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
