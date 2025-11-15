'use client';

import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLeadsStore } from '@/store/leads/leads';
import { LeadCard } from '@/components/leads/leads/LeadCard';
import { LeadTable } from '@/components/leads/leads/LeadTable';
import { Lead, LeadStatus, LeadSortOptions } from '@/lib/leads/types';
import { Card } from '@/components/leads/ui/Card';
import { 
  Search, 
  Filter, 
  Download, 
  Grid, 
  List as ListIcon,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Calendar,
  Bell,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/leads/localStorage';
import { LaterStageModal } from '@/components/leads/leads/LaterStageModal';
import { LeadNotesRemindersDropdown } from '@/components/leads/leads/LeadNotesRemindersDropdown';
import { LeadFilesButton } from '@/components/leads/leads/LeadFilesButton';
import { AddLeadButton } from '@/components/leads/leads/AddLeadButton';
import { 
  getLeadNotes, 
  getLeadReminders, 
  createLeadNote,
  type LeadNote,
  type LeadReminder
} from '@/lib/leads/supabaseNotesReminders';
import { useAuthStore } from '@/store/auth';
import { useRemindersStore } from '@/store/reminders';

export default function WorkingOnStatusPage() {
  const user = useAuthStore((state) => state.user);
  const {
    leads,
    isLoading,
    error,
    fetchLeadsByStatus,
    updateLead,
    deleteLead,
    changeLeadStatus,
    selectLead,
    deselectLead,
    clearSelection,
    selectedLeads
  } = useLeadsStore();

  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('working-view-mode') as 'grid' | 'table') || 'table';
    }
    return 'table';
  });

  // Persist view mode changes
  useEffect(() => {
    localStorage.setItem('working-view-mode', viewMode);
  }, [viewMode]);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sort state
  const [sortOptions, setSortOptions] = useState<LeadSortOptions>({
    field: 'updated_at',
    direction: 'desc'
  });

  // Notes and reminders state (in a real app, these would come from the database)
  const [notes, setNotes] = useState<Record<string, LeadNote[]>>({});
  const [reminders, setReminders] = useState<Record<string, LeadReminder[]>>({});
  const [showNotesModal, setShowNotesModal] = useState<string | null>(null);
  const [showReminderModal, setShowReminderModal] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [newReminder, setNewReminder] = useState({ date: '', note: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger to refresh dropdowns
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load leads on mount and reload notes/reminders
  useEffect(() => {
    const loadData = async () => {
      await fetchLeadsByStatus('working');
    };
    loadData();
  }, [fetchLeadsByStatus]);

  // Load notes and reminders whenever leads array changes
  useEffect(() => {
    if (leads.length > 0) {
      loadNotesAndReminders();
    }
  }, [leads]); // Reload whenever leads change (including on page refresh)

  // Load notes and reminders from Supabase
  const loadNotesAndReminders = async () => {
    if (!user) return;
    
    try {
      // Load notes for all leads
      const allLeads = leads.filter(l => l.status === 'working');
      const notesMap: Record<string, LeadNote[]> = {};
      const remindersMap: Record<string, LeadReminder[]> = {};

      for (const lead of allLeads) {
        // Load notes from Supabase
        const leadNotes = await getLeadNotes(lead.id);
        if (leadNotes.length > 0) {
          notesMap[lead.id] = leadNotes as any;
        }

        // Load reminders from Supabase
        const leadReminders = await getLeadReminders(lead.id);
        if (leadReminders.length > 0) {
          remindersMap[lead.id] = leadReminders;
        }
      }

      setNotes(notesMap);
      setReminders(remindersMap);
    } catch (error) {
      console.error('Error loading notes and reminders:', error);
    }
  };

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let result = leads.filter(lead => lead.status === 'working');

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(lead =>
        lead.name?.toLowerCase().includes(term) ||
        lead.phone?.toLowerCase().includes(term) ||
        lead.provider?.toLowerCase().includes(term) ||
        lead.address?.toLowerCase().includes(term) ||
        lead.type_of_business?.toLowerCase().includes(term) ||
        lead.notes?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const { field, direction } = sortOptions;
      let valueA = a[field];
      let valueB = b[field];

      if (valueA === null || valueA === undefined) return direction === 'asc' ? 1 : -1;
      if (valueB === null || valueB === undefined) return direction === 'asc' ? -1 : 1;

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        const comparison = valueA.localeCompare(valueB);
        return direction === 'asc' ? comparison : -comparison;
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return direction === 'asc' ? valueA - valueB : valueB - valueA;
      }

      return 0;
    });

    return result;
  }, [leads, searchTerm, sortOptions]);

  // Calculate progress metrics
  const progressMetrics = useMemo(() => {
    const total = filteredLeads.length;
    const withNotes = filteredLeads.filter(lead => 
      notes[lead.id] && notes[lead.id].length > 0
    ).length;
    const withReminders = filteredLeads.filter(lead =>
      reminders[lead.id] && reminders[lead.id].some(r => !r.completed)
    ).length;
    const recentlyUpdated = filteredLeads.filter(lead => {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceUpdate <= 7;
    }).length;

    return { total, withNotes, withReminders, recentlyUpdated };
  }, [filteredLeads, notes, reminders]);

  // State for Later Stage modal
  const [showLaterStageModal, setShowLaterStageModal] = useState<Lead | null>(null);

  // Handle status change
  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    try {
      if (status === 'later') {
        // Find the lead and show modal
        const lead = filteredLeads.find(l => l.id === leadId);
        if (lead) {
          setShowLaterStageModal(lead);
        }
      } else {
        await changeLeadStatus(leadId, status);
      }
    } catch (err) {
      console.error('Failed to change lead status:', err);
    }
  };

  // Handle Later Stage confirmation
  const handleLaterStageConfirm = async (data: { date_to_call_back: string; notes: string }) => {
    if (!showLaterStageModal) return;
    
    try {
      await changeLeadStatus(showLaterStageModal.id, 'later', data);
      setShowLaterStageModal(null);
      // Reload leads to reflect changes
      await fetchLeadsByStatus('working');
    } catch (err) {
      console.error('Failed to move to Later Stage:', err);
      throw err;
    }
  };

  // Handle edit
  const handleEdit = async (lead: Lead) => {
    console.log('Edit lead:', lead);
  };

  // Handle delete
  const handleDelete = async (leadId: string) => {
    try {
      await deleteLead(leadId);
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (leadIds: string[], action: string) => {
    try {
      if (action === 'delete') {
        if (confirm(`Are you sure you want to delete ${leadIds.length} lead(s)?`)) {
          for (const id of leadIds) {
            await deleteLead(id);
          }
          clearSelection();
        }
      } else if (action === 'export') {
        handleExport(leadIds);
      }
    } catch (err) {
      console.error('Failed to perform bulk action:', err);
    }
  };

  // Handle export
  const handleExport = (leadIds?: string[]) => {
    const leadsToExport = leadIds 
      ? filteredLeads.filter(lead => leadIds.includes(lead.id))
      : filteredLeads;

    const headers = ['Number', 'Name', 'Provider', 'Phone', 'Address', 'Business Type', 'Status', 'Notes', 'Last Updated'];
    const rows = leadsToExport.map(lead => [
      lead.number,
      lead.name,
      lead.provider || '',
      lead.phone || '',
      lead.address || '',
      lead.type_of_business || '',
      lead.status,
      lead.notes || '',
      new Date(lead.updated_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `working-leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle selection change
  const handleSelectionChange = (leadIds: string[]) => {
    clearSelection();
    leadIds.forEach(id => selectLead(id));
  };

  // Add note
  const handleAddNote = async (leadId: string) => {
    if (!newNote.trim()) return;

    try {
      // Generate note ID
      if (!user) {
        alert('User not authenticated');
        return;
      }

      // Create note in Supabase
      const createdNote = await createLeadNote(leadId, user.id, newNote.trim());

      // Update local state immediately
      const note: LeadNote = {
        id: createdNote.id,
        leadId,
        content: createdNote.content,
        createdAt: createdNote.createdAt,
        userId: createdNote.userId
      };

      setNotes(prev => ({
        ...prev,
        [leadId]: [...(prev[leadId] || []), note]
      }));

      setNewNote('');
      // Trigger dropdown refresh
      setRefreshTrigger(prev => prev + 1);
      // Don't close modal immediately so user can see the note was added
      setTimeout(() => setShowNotesModal(null), 500);
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    }
  };

  // Add reminder
  const { addReminder: addReminderToStore } = useRemindersStore();
  
  const handleAddReminder = async (leadId: string) => {
    console.log('[WorkingPage] handleAddReminder called for lead:', leadId);
    console.log('[WorkingPage] Reminder data:', newReminder);
    console.log('[WorkingPage] User:', user);
    
    if (!newReminder.date || !newReminder.note.trim()) {
      console.error('[WorkingPage] Missing date or note - aborting');
      return;
    }

    if (!user) {
      console.error('[WorkingPage] No user - aborting');
      alert('User not authenticated');
      return;
    }

    try {
      console.log('[WorkingPage] Creating reminder in store...');
      
      // Add reminder to Supabase via the store
      const createdReminder = await addReminderToStore(
        leadId,
        user.id,
        newReminder.date,
        newReminder.note.trim()
      );
      
      console.log('[WorkingPage] Reminder created:', createdReminder);

      // Also update the lead's callback date
      await updateLead(leadId, {
        date_to_call_back: newReminder.date,
        notes: newReminder.note.trim()
      });

      setNewReminder({ date: '', note: '' });
      // Trigger dropdown refresh
      setRefreshTrigger(prev => prev + 1);
      // Don't close modal immediately so user can see the reminder was added
      setTimeout(() => setShowReminderModal(null), 500);
    } catch (error) {
      console.error('[WorkingPage] Error adding reminder:', error);
      alert('Failed to add reminder');
    }
  };

  // Toggle reminder completion
  const toggleReminderCompletion = async (leadId: string, reminderId: string) => {
    try {
      // Get current reminder states from localStorage
      const reminderStates = storage.get<Record<string, boolean>>('reminder-completion-states') || {};
      
      // Toggle the completion state
      const isCompleted = !reminderStates[reminderId];
      reminderStates[reminderId] = isCompleted;
      
      // Save to localStorage
      storage.set('reminder-completion-states', reminderStates);
      
      // Update local state
      setReminders(prev => ({
        ...prev,
        [leadId]: prev[leadId].map(r =>
          r.id === reminderId ? { ...r, completed: isCompleted } : r
        )
      }));
    } catch (error) {
      console.error('Error toggling reminder completion:', error);
    }
  };

  // Get days since last update
  const getDaysSinceUpdate = (updatedAt: string) => {
    return Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
      {/* Header - Mobile Optimized */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-1 sm:mb-2">
          Working On
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Track progress and manage active leads
        </p>
      </div>

      {/* Progress Metrics - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card variant="glass" padding="sm" className="sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Active Leads</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600">{progressMetrics.total}</div>
            </div>
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 opacity-50" />
          </div>
        </Card>
        <Card variant="glass" padding="sm" className="sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">With Notes</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{progressMetrics.withNotes}</div>
            </div>
            <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 opacity-50" />
          </div>
        </Card>
        <Card variant="glass" padding="sm" className="sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">With Reminders</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">{progressMetrics.withReminders}</div>
            </div>
            <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 opacity-50" />
          </div>
        </Card>
        <Card variant="glass" padding="sm" className="sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Recently Updated</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{progressMetrics.recentlyUpdated}</div>
            </div>
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Search and Action Bar - Mobile Optimized */}
      <Card variant="glass" padding="sm" className="sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search working leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
              aria-label="Search leads"
            />
          </div>

          {/* View Mode Toggle - Mobile Optimized */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'btn touch-manipulation',
                viewMode === 'table' ? 'btn-primary' : 'btn-secondary'
              )}
              aria-label="Table view"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'btn touch-manipulation',
                viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'
              )}
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {/* Add Lead Button */}
          <AddLeadButton defaultStatus="working" onSuccess={() => fetchLeadsByStatus('working')} />
          
          {/* Export Button - Mobile Optimized */}
          <button
            onClick={() => handleExport()}
            className="btn btn-success flex items-center gap-2 touch-manipulation"
            aria-label="Export leads"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading leads...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card variant="glass" padding="md" className="bg-red-50 border-red-200 mb-6">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Leads Display */}
      {!isLoading && !error && (
        <>
          {viewMode === 'table' ? (
            <div className="space-y-4">
              {filteredLeads.map(lead => (
                <Card key={lead.id} variant="glass" padding="md" className="hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Lead Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{lead.name}</h3>
                          <p className="text-sm text-gray-600">
                            {lead.provider && (
                              <span className={cn(
                                'font-medium',
                                lead.provider.toLowerCase().includes('telkom') && 'text-blue-600'
                              )}>
                                {lead.provider}
                              </span>
                            )}
                            {lead.type_of_business && ` • ${lead.type_of_business}`}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          Updated {getDaysSinceUpdate(lead.updated_at)} days ago
                        </span>
                      </div>

                      {lead.phone && (
                        <p className="text-sm text-gray-700 mb-1">📞 {lead.phone}</p>
                      )}
                      {lead.address && (
                        <p className="text-sm text-gray-700 mb-2">📍 {lead.address}</p>
                      )}
                      {lead.notes && (
                        <p className="text-sm text-gray-600 italic">💬 {lead.notes}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-[180px]">
                      {/* Quick Action Buttons */}
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          onClick={() => setShowNotesModal(lead.id)}
                          className="btn btn-primary text-xs p-2 flex flex-col items-center justify-center gap-1"
                          title="Notes"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-[10px]">{notes[lead.id]?.length || 0}</span>
                        </button>
                        <button
                          onClick={() => setShowReminderModal(lead.id)}
                          className="btn btn-primary text-xs p-2 flex flex-col items-center justify-center gap-1"
                          title="Reminders"
                        >
                          <Bell className="w-4 h-4" />
                          <span className="text-[10px]">{reminders[lead.id]?.filter(r => !r.completed).length || 0}</span>
                        </button>
                        <LeadFilesButton lead={lead} compact />
                      </div>
                      
                      {/* Status Dropdown */}
                      <select
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        className="input text-sm py-2"
                        defaultValue="working"
                      >
                        <option value="working">Working On</option>
                        <option value="later">Later Stage</option>
                        <option value="signed">Signed</option>
                        <option value="bad">Bad Lead</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes & Reminders Dropdown */}
                  <LeadNotesRemindersDropdown
                    lead={lead}
                    onNotesClick={() => setShowNotesModal(lead.id)}
                    onRemindersClick={() => setShowReminderModal(lead.id)}
                    refreshTrigger={refreshTrigger}
                  />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeads.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isSelected={selectedLeads.includes(lead.id)}
                  onSelect={(id) => {
                    if (selectedLeads.includes(id)) {
                      deselectLead(id);
                    } else {
                      selectLead(id);
                    }
                  }}
                  showActions={true}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredLeads.length === 0 && (
            <Card variant="glass" padding="lg" className="text-center">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No leads in progress</p>
              <p className="text-gray-400 text-sm">
                Select leads from the main list to start working on them
              </p>
            </Card>
          )}
        </>
      )}

      {/* Notes Modal */}
      {showNotesModal && mounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity"
            onClick={() => setShowNotesModal(null)}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[calc(100vh-4rem)] transition-opacity duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Notes</h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {filteredLeads.find(l => l.id === showNotesModal)?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotesModal(null)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">


            {/* Existing Notes */}
            <div className="space-y-3 mb-4">
              {notes[showNotesModal]?.map(note => (
                <div key={note.id} className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-800">{note.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {(!notes[showNotesModal] || notes[showNotesModal].length === 0) && (
                <p className="text-gray-500 text-center py-4">No notes yet</p>
              )}
            </div>

            {/* Add Note */}
            <div className="border-t pt-4 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add New Note
              </label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type your note here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
            <button
              onClick={() => setShowNotesModal(null)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleAddNote(showNotesModal)}
              disabled={!newNote.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Note</span>
            </button>
          </div>
        </div>
      </div>
    </>,
        document.body
      )}

      {/* Reminder Modal */}
      {showReminderModal && mounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity"
            onClick={() => setShowReminderModal(null)}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[calc(100vh-4rem)] transition-opacity duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Bell className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Reminders</h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {filteredLeads.find(l => l.id === showReminderModal)?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReminderModal(null)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">


            {/* Existing Reminders */}
            <div className="space-y-3 mb-4">
              {reminders[showReminderModal]?.map(reminder => (
                <div
                  key={reminder.id}
                  className={cn(
                    'bg-gray-50 p-3 rounded-lg flex items-start gap-3',
                    reminder.completed && 'opacity-50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={reminder.completed}
                    onChange={() => toggleReminderCompletion(showReminderModal, reminder.id)}
                    className="mt-1 rounded"
                  />
                  <div className="flex-1">
                    <p className={cn(
                      'text-gray-800',
                      reminder.completed && 'line-through'
                    )}>
                      {reminder.note}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      📅 {new Date(reminder.reminderDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!reminders[showReminderModal] || reminders[showReminderModal].length === 0) && (
                <p className="text-gray-500 text-center py-4">No reminders yet</p>
              )}
            </div>

            {/* Add Reminder */}
            <div className="border-t pt-4 mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Reminder Date
                </label>
                <input
                  type="date"
                  value={newReminder.date}
                  onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reminder Note
                </label>
                <input
                  type="text"
                  value={newReminder.note}
                  onChange={(e) => setNewReminder({ ...newReminder, note: e.target.value })}
                  placeholder="What should you remember?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
            <button
              onClick={() => setShowReminderModal(null)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleAddReminder(showReminderModal)}
              disabled={!newReminder.date || !newReminder.note.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Reminder</span>
            </button>
          </div>
        </div>
      </div>
    </>,
        document.body
      )}

      {/* Later Stage Modal */}
      {showLaterStageModal && (
        <LaterStageModal
          lead={showLaterStageModal}
          isOpen={true}
          onClose={() => setShowLaterStageModal(null)}
          onConfirm={handleLaterStageConfirm}
        />
      )}
    </div>
  );
}
