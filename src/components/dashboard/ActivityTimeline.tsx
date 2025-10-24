'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Save, 
  FolderOpen, 
  FileDown, 
  Clock,
  User,
  ChevronDown
} from 'lucide-react';
import { getActivityLogs, getUniqueUsers, ActivityLog, ActivityType } from '@/lib/activityLogger';
import { useAuthStore } from '@/store/auth';

interface ActivityTimelineProps {
  userRole: 'admin' | 'manager' | 'user';
  currentUserId: string;
}

// Activity type to icon mapping
const activityIcons: Record<ActivityType, typeof FileText> = {
  deal_created: FileText,
  deal_saved: Save,
  deal_loaded: FolderOpen,
  proposal_generated: FileText,
  pdf_generated: FileDown
};

// Activity type to color mapping
const activityColors: Record<ActivityType, string> = {
  deal_created: 'text-green-500 bg-green-50',
  deal_saved: 'text-blue-500 bg-blue-50',
  deal_loaded: 'text-purple-500 bg-purple-50',
  proposal_generated: 'text-orange-500 bg-orange-50',
  pdf_generated: 'text-indigo-500 bg-indigo-50'
};

// Activity type to display text mapping
const activityLabels: Record<ActivityType, string> = {
  deal_created: 'Deal Created',
  deal_saved: 'Deal Saved',
  deal_loaded: 'Deal Loaded',
  proposal_generated: 'Proposal Generated',
  pdf_generated: 'PDF Generated'
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffMs = now.getTime() - activityTime.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return activityTime.toLocaleDateString();
  }
};

export default function ActivityTimeline({ userRole, currentUserId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [availableUsers, setAvailableUsers] = useState<Array<{ userId: string; username: string; userRole: string }>>([]);
  const { users } = useAuthStore();

  useEffect(() => {
    // Load activities based on role and selected user
    let logs: ActivityLog[];
    
    if (userRole === 'admin') {
      if (selectedUserId === 'all') {
        // Admin viewing all users
        logs = getActivityLogs();
      } else {
        // Admin viewing specific user
        logs = getActivityLogs(selectedUserId);
      }
    } else {
      // Non-admin users only see their own activities
      logs = getActivityLogs(currentUserId);
    }
    
    setActivities(logs);
  }, [userRole, currentUserId, selectedUserId]);

  useEffect(() => {
    // Load available users for admin dropdown
    if (userRole === 'admin') {
      const uniqueUsers = getUniqueUsers();
      setAvailableUsers(uniqueUsers);
    }
  }, [userRole]);

  return (
    <div className="space-y-4">
      {/* Admin User Selection Dropdown */}
      {userRole === 'admin' && (
        <div className="flex items-center space-x-3">
          <User className="w-5 h-5 text-gray-500" />
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-2 pr-10 bg-white/80 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer transition-all duration-200 hover:bg-white"
            >
              <option value="all">All Users</option>
              {availableUsers.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.username} ({user.userRole})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
            <Clock className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No recent activity to display</p>
          <p className="text-gray-400 text-sm mt-2">
            {userRole === 'admin' && selectedUserId !== 'all'
              ? 'This user has no activity yet'
              : 'Activity will appear here once you start using the calculator'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.activityType];
            const colorClasses = activityColors[activity.activityType];
            const label = activityLabels[activity.activityType];

            return (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 bg-white/60 rounded-lg border border-gray-100 hover:bg-white/80 hover:shadow-md transition-all duration-200"
              >
                {/* Activity Icon */}
                <div className={`p-2 rounded-lg ${colorClasses} flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Activity Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{label}</p>
                      {activity.dealName && (
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.dealName}
                        </p>
                      )}
                      {userRole === 'admin' && (
                        <p className="text-xs text-gray-500 mt-1">
                          by {activity.username}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
