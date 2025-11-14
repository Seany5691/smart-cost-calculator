'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lead, CallbackReminder, ReminderStatus } from '@/lib/leads/types';
import { Card } from '@/components/leads/ui/Card';
import { Bell, Calendar, Clock, CheckCircle, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReminderManagerProps {
  leads: Lead[];
  onUpdateCallback: (leadId: string, date: string | null) => Promise<void>;
  onCompleteCallback: (leadId: string) => Promise<void>;
}

export const ReminderManager = ({
  leads,
  onUpdateCallback,
  onCompleteCallback
}: ReminderManagerProps) => {
  const [reminders, setReminders] = useState<CallbackReminder[]>([]);
  const [selectedReminder, setSelectedReminder] = useState<CallbackReminder | null>(null);
  const [newCallbackDate, setNewCallbackDate] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Filter leads with callbacks and calculate reminder status
    const callbackLeads = leads
      .filter(lead => lead.status === 'later' && lead.date_to_call_back)
      .map(lead => {
        const reminderStatus = getReminderStatus(lead.date_to_call_back!);
        return {
          ...lead,
          reminder_status: reminderStatus
        } as CallbackReminder;
      })
      .sort((a, b) => {
        // Sort by date, with overdue first
        const dateA = new Date(a.date_to_call_back!).getTime();
        const dateB = new Date(b.date_to_call_back!).getTime();
        return dateA - dateB;
      });

    setReminders(callbackLeads);
  }, [leads]);

  const getReminderStatus = (dateString: string): ReminderStatus => {
    const callbackDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    callbackDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((callbackDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    if (diffDays <= 2) return 'upcoming';
    return 'future';
  };

  const getReminderColor = (status: ReminderStatus) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'today':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'tomorrow':
      case 'upcoming':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getReminderIcon = (status: ReminderStatus) => {
    switch (status) {
      case 'overdue':
        return AlertCircle;
      case 'today':
        return Bell;
      case 'tomorrow':
      case 'upcoming':
        return Clock;
      default:
        return Calendar;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays <= 7) return `In ${diffDays} days`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleSnooze = async (reminder: CallbackReminder, days: number) => {
    const currentDate = new Date(reminder.date_to_call_back!);
    currentDate.setDate(currentDate.getDate() + days);
    const newDate = currentDate.toISOString().split('T')[0];

    try {
      await onUpdateCallback(reminder.id, newDate);
      setSelectedReminder(null);
    } catch (error) {
      console.error('Error snoozing reminder:', error);
    }
  };

  const handleReschedule = async (reminder: CallbackReminder) => {
    if (!newCallbackDate) return;

    try {
      await onUpdateCallback(reminder.id, newCallbackDate);
      setSelectedReminder(null);
      setNewCallbackDate('');
    } catch (error) {
      console.error('Error rescheduling reminder:', error);
    }
  };

  const handleComplete = async (reminder: CallbackReminder) => {
    try {
      await onCompleteCallback(reminder.id);
      setSelectedReminder(null);
    } catch (error) {
      console.error('Error completing callback:', error);
    }
  };

  const groupedReminders = {
    overdue: reminders.filter(r => r.reminder_status === 'overdue'),
    today: reminders.filter(r => r.reminder_status === 'today'),
    upcoming: reminders.filter(r => ['tomorrow', 'upcoming'].includes(r.reminder_status)),
    future: reminders.filter(r => r.reminder_status === 'future')
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" padding="md" className="border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{groupedReminders.overdue.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
          </div>
        </Card>

        <Card variant="glass" padding="md" className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-2xl font-bold text-green-600">{groupedReminders.today.length}</p>
            </div>
            <Bell className="w-8 h-8 text-green-500" aria-hidden="true" />
          </div>
        </Card>

        <Card variant="glass" padding="md" className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">{groupedReminders.upcoming.length}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" aria-hidden="true" />
          </div>
        </Card>

        <Card variant="glass" padding="md" className="border-l-4 border-l-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Future</p>
              <p className="text-2xl font-bold text-gray-600">{groupedReminders.future.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-gray-500" aria-hidden="true" />
          </div>
        </Card>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {reminders.length === 0 ? (
          <Card variant="glass" padding="md">
            <p className="text-gray-500 text-center">No callbacks scheduled</p>
          </Card>
        ) : (
          reminders.map((reminder) => {
            const Icon = getReminderIcon(reminder.reminder_status);
            const colorClass = getReminderColor(reminder.reminder_status);

            return (
              <Card
                key={reminder.id}
                variant="glass"
                padding="md"
                className={cn('border-l-4', colorClass)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={cn('p-3 rounded-lg', colorClass)}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">{reminder.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {reminder.provider && `${reminder.provider} • `}
                        {reminder.type_of_business}
                      </p>
                      {reminder.phone && (
                        <p className="text-sm text-gray-600 mt-1">
                          <a href={`tel:${reminder.phone}`} className="text-blue-600 hover:underline">
                            {reminder.phone}
                          </a>
                        </p>
                      )}
                      <p className="text-sm font-medium text-gray-800 mt-2">
                        <Calendar className="w-4 h-4 inline mr-1" aria-hidden="true" />
                        {formatDate(reminder.date_to_call_back!)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleComplete(reminder)}
                      className="btn btn-success btn-sm whitespace-nowrap"
                      aria-label="Mark as completed"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" aria-hidden="true" />
                      Complete
                    </button>
                    <button
                      onClick={() => setSelectedReminder(reminder)}
                      className="btn btn-secondary btn-sm whitespace-nowrap"
                      aria-label="Snooze or reschedule"
                    >
                      <Clock className="w-4 h-4 mr-1" aria-hidden="true" />
                      Snooze
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Snooze/Reschedule Modal */}
      {selectedReminder && mounted && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={() => setSelectedReminder(null)}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <Card variant="glass" padding="lg" className="w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Snooze Reminder</h3>
                <button
                  onClick={() => setSelectedReminder(null)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Callback for <strong>{selectedReminder.name}</strong>
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleSnooze(selectedReminder, 1)}
                  className="btn btn-secondary w-full"
                >
                  Snooze 1 day
                </button>
                <button
                  onClick={() => handleSnooze(selectedReminder, 3)}
                  className="btn btn-secondary w-full"
                >
                  Snooze 3 days
                </button>
                <button
                  onClick={() => handleSnooze(selectedReminder, 7)}
                  className="btn btn-secondary w-full"
                >
                  Snooze 1 week
                </button>

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or choose a specific date:
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={newCallbackDate}
                      onChange={(e) => setNewCallbackDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <button
                      onClick={() => handleReschedule(selectedReminder)}
                      disabled={!newCallbackDate}
                      className="btn btn-primary"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
