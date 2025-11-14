'use client';

import { useState, useEffect } from 'react';
import { Lead } from '@/lib/leads/types';
import { ChevronRight, MessageSquare, Bell, Calendar } from 'lucide-react';
import { 
  getLeadNotes,
  createLeadNote,
  type LeadNote,
} from '@/lib/leads/supabaseNotesReminders';
import { useAuthStore } from '@/store/auth';
import { useRemindersStore, useLeadReminders } from '@/store/reminders';

interface LeadNotesRemindersDropdownProps {
  lead: Lead;
  onNotesClick?: () => void;
  onRemindersClick?: () => void;
  refreshTrigger?: number; // Add trigger to force refresh
}

export const LeadNotesRemindersDropdown = ({ 
  lead, 
  onNotesClick, 
  onRemindersClick,
  refreshTrigger = 0
}: LeadNotesRemindersDropdownProps) => {
  const user = useAuthStore((state) => state.user);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get reminders from global store
  const reminders = useLeadReminders(lead.id);
  const { toggleComplete } = useRemindersStore();
  
  // Debug logging
  useEffect(() => {
    console.log('[Dropdown] Reminders for lead', lead.id, ':', reminders);
    console.log('[Dropdown] Active reminders:', reminders.filter(r => !r.completed));
    console.log('[Dropdown] Completed reminders:', reminders.filter(r => r.completed));
  }, [reminders, lead.id]);

  // Load notes for this lead - reload when lead changes or refreshTrigger changes
  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [lead.id, refreshTrigger, user]);

  const loadNotes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Load notes from Supabase
      const leadNotes = await getLeadNotes(lead.id);
      setNotes(leadNotes as any);
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReminderCompletion = async (reminderId: string) => {
    try {
      await toggleComplete(reminderId);
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  };

  const [showCompleted, setShowCompleted] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderNote, setNewReminderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addReminder } = useRemindersStore();
  
  const activeReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);
  const displayReminders = showCompleted ? reminders : activeReminders;
  const totalItems = notes.length + activeReminders.length;
  
  const handleAddNote = async () => {
    if (!user || !newNoteContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createLeadNote(lead.id, user.id, newNoteContent.trim());
      setNewNoteContent('');
      setShowAddNote(false);
      await loadNotes(); // Refresh notes
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddReminder = async () => {
    if (!user || !newReminderDate || !newReminderNote.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addReminder(lead.id, user.id, newReminderDate, newReminderNote.trim());
      setNewReminderDate('');
      setNewReminderNote('');
      setShowAddReminder(false);
    } catch (error) {
      console.error('Error adding reminder:', error);
      alert('Failed to add reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Always show the dropdown so users know they can add notes/reminders
  return (
    <details className="mt-4 pt-4 border-t border-gray-200 group">
      <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
        <span className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
          Notes & Reminders
          {totalItems > 0 && (
            <span className="text-xs font-normal text-gray-500">
              ({totalItems} items)
            </span>
          )}
        </span>
      </summary>
      
      <div className="mt-3 space-y-4 pl-6">
        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Notes ({notes.length})
            </p>
            <button
              onClick={() => setShowAddNote(!showAddNote)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {showAddNote ? 'Cancel' : '+ Add'}
            </button>
          </div>
          
          {showAddNote && (
            <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Enter note..."
                className="w-full text-xs p-2 border rounded resize-none"
                rows={2}
                disabled={isSubmitting}
              />
              <button
                onClick={handleAddNote}
                disabled={!newNoteContent.trim() || isSubmitting}
                className="mt-1 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          )}
          
          {notes.length > 0 ? (
            <div className="space-y-2">
              {notes.slice(-3).map(note => (
                <div key={note.id} className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                  <p>{note.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {notes.length > 3 && onNotesClick && (
                <button
                  onClick={onNotesClick}
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  View all {notes.length} notes
                </button>
              )}
            </div>
          ) : !showAddNote && (
            <p className="text-xs text-gray-500 italic">No notes yet</p>
          )}
        </div>

        {/* Reminders */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <Bell className="w-3 h-3" />
              Reminders ({activeReminders.length})
            </p>
            <div className="flex items-center gap-2">
              {completedReminders.length > 0 && (
                <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                    className="rounded w-3 h-3"
                  />
                  Completed
                </label>
              )}
              <button
                onClick={() => setShowAddReminder(!showAddReminder)}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                {showAddReminder ? 'Cancel' : '+ Add'}
              </button>
            </div>
          </div>
          
          {showAddReminder && (
            <div className="mb-2 p-2 bg-purple-50 rounded border border-purple-200 space-y-2">
              <input
                type="date"
                value={newReminderDate}
                onChange={(e) => setNewReminderDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full text-xs p-2 border rounded"
                disabled={isSubmitting}
              />
              <input
                type="text"
                value={newReminderNote}
                onChange={(e) => setNewReminderNote(e.target.value)}
                placeholder="Reminder note..."
                className="w-full text-xs p-2 border rounded"
                disabled={isSubmitting}
              />
              <button
                onClick={handleAddReminder}
                disabled={!newReminderDate || !newReminderNote.trim() || isSubmitting}
                className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Reminder'}
              </button>
            </div>
          )}
          
          {displayReminders.length > 0 ? (
            <div className="space-y-2">
              {displayReminders.map(reminder => (
                <div key={reminder.id} className={`flex items-center gap-2 text-sm p-2 rounded border ${reminder.completed ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-purple-50 border-purple-200'}`}>
                  <input
                    type="checkbox"
                    checked={reminder.completed}
                    onChange={() => handleToggleReminderCompletion(reminder.id)}
                    className="rounded"
                  />
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className={`text-gray-700 flex-1 text-xs ${reminder.completed ? 'line-through' : ''}`}>
                    {new Date(reminder.reminderDate).toLocaleDateString()} - {reminder.note}
                  </span>
                </div>
              ))}
            </div>
          ) : !showAddReminder && (
            <p className="text-xs text-gray-500 italic">No reminders yet</p>
          )}
        </div>
      </div>
    </details>
  );
};
