'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lead, LeadInteraction, LeadAttachment } from '@/lib/leads/types';
import { NotesList } from './NotesList';
import { InteractionHistory } from './InteractionHistory';
import { FileUpload } from './FileUpload';
import { RemindersTab } from './RemindersTab';
import { X, StickyNote, Activity, Paperclip, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storage, STORAGE_KEYS } from '@/lib/leads/localStorage';
import { 
  getLeadNotes, 
  createLeadNote, 
  updateLeadNote, 
  deleteLeadNote,
  getLeadReminders,
  type LeadNote
} from '@/lib/leads/supabaseNotesReminders';
import { useAuthStore } from '@/store/auth';

interface LeadDetailsModalProps {
  lead: Lead;
  isOpen?: boolean;
  onClose: () => void;
  onUpdate?: (leadId: string, updates: Partial<Lead>) => void;
  onStatusChange?: (leadId: string, status: any, additionalData?: any) => void;
}

type TabType = 'notes' | 'reminders' | 'files' | 'history';

export const LeadDetailsModal = ({ lead, isOpen = true, onClose, onUpdate, onStatusChange }: LeadDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [interactions, setInteractions] = useState<LeadInteraction[]>([]);
  const [attachments, setAttachments] = useState<LeadAttachment[]>([]);
  const [remindersCount, setRemindersCount] = useState(0);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch notes and attachments when modal opens
  useEffect(() => {
    if (isOpen && lead.id) {
      fetchNotes();
      fetchInteractions();
      fetchAttachments();
      fetchRemindersCount();
    }
  }, [isOpen, lead.id]);

  const fetchRemindersCount = async () => {
    try {
      const reminders = await getLeadReminders(lead.id);
      const count = reminders.filter(r => !r.completed).length;
      setRemindersCount(count);
    } catch (error) {
      console.error('Error fetching reminders count:', error);
    }
  };

  const fetchNotes = async () => {
    setIsLoadingNotes(true);
    try {
      // Load notes from Supabase
      const leadNotes = await getLeadNotes(lead.id);
      setNotes(leadNotes as any);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const fetchInteractions = async () => {
    setIsLoadingInteractions(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/interactions`);
      const result = await response.json();
      if (result.success) {
        setInteractions(result.data);
      }
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setIsLoadingInteractions(false);
    }
  };

  const fetchAttachments = () => {
    // Get attachments from localStorage
    const allLeads = storage.get<Lead[]>(STORAGE_KEYS.LEADS) || [];
    const currentLead = allLeads.find(l => l.id === lead.id);
    setAttachments(currentLead?.attachments || []);
  };

  const handleFileUpload = async (file: File, description?: string) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const fileData = reader.result as string;
          
          const newAttachment: LeadAttachment = {
            id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            lead_id: lead.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_data: fileData,
            uploaded_by: 'current_user',
            uploaded_at: new Date().toISOString(),
            description
          };

          // Update lead in localStorage
          const allLeads = storage.get<Lead[]>(STORAGE_KEYS.LEADS) || [];
          const leadIndex = allLeads.findIndex(l => l.id === lead.id);
          
          if (leadIndex !== -1) {
            const updatedLead = { ...allLeads[leadIndex] };
            updatedLead.attachments = [...(updatedLead.attachments || []), newAttachment];
            allLeads[leadIndex] = updatedLead;
            storage.set(STORAGE_KEYS.LEADS, allLeads);
            
            fetchAttachments();
            resolve();
          } else {
            reject(new Error('Lead not found'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileDelete = async (attachmentId: string) => {
    try {
      const allLeads = storage.get<Lead[]>(STORAGE_KEYS.LEADS) || [];
      const leadIndex = allLeads.findIndex(l => l.id === lead.id);
      
      if (leadIndex !== -1) {
        const updatedLead = { ...allLeads[leadIndex] };
        updatedLead.attachments = (updatedLead.attachments || []).filter(a => a.id !== attachmentId);
        allLeads[leadIndex] = updatedLead;
        storage.set(STORAGE_KEYS.LEADS, allLeads);
        
        fetchAttachments();
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw error;
    }
  };

  const user = useAuthStore((state) => state.user);

  const handleAddNote = async (content: string) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      // Create note in Supabase
      await createLeadNote(lead.id, user.id, content.trim());

      // Refresh notes display
      await fetchNotes();
      await fetchInteractions(); // Refresh interactions to show note_added
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  };

  const handleUpdateNote = async (noteId: string, content: string) => {
    try {
      // Update note in Supabase
      await updateLeadNote(noteId, content.trim());

      // Refresh notes display
      await fetchNotes();
      await fetchInteractions(); // Refresh interactions to show note_updated
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      // Delete note from Supabase
      await deleteLeadNote(noteId);

      // Refresh notes display
      await fetchNotes();
      await fetchInteractions(); // Refresh interactions to show note_deleted
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
                {lead.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {lead.provider && `${lead.provider} • `}
                {lead.type_of_business}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-target"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-6">
            <button
              onClick={() => setActiveTab('notes')}
              className={cn(
                'flex items-center space-x-2 px-4 py-3 border-b-2 font-medium transition-colors',
                activeTab === 'notes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              )}
              aria-selected={activeTab === 'notes'}
              role="tab"
            >
              <StickyNote className="w-4 h-4" aria-hidden="true" />
              <span>Notes</span>
              {notes.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {notes.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={cn(
                'flex items-center space-x-2 px-4 py-3 border-b-2 font-medium transition-colors',
                activeTab === 'reminders'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              )}
              aria-selected={activeTab === 'reminders'}
              role="tab"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              <span>Reminders</span>
              {remindersCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {remindersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={cn(
                'flex items-center space-x-2 px-4 py-3 border-b-2 font-medium transition-colors',
                activeTab === 'files'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              )}
              aria-selected={activeTab === 'files'}
              role="tab"
            >
              <Paperclip className="w-4 h-4" aria-hidden="true" />
              <span>Files</span>
              {attachments.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {attachments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'flex items-center space-x-2 px-4 py-3 border-b-2 font-medium transition-colors',
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              )}
              aria-selected={activeTab === 'history'}
              role="tab"
            >
              <Activity className="w-4 h-4" aria-hidden="true" />
              <span>Activity</span>
              {interactions.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {interactions.length}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'notes' ? (
              <NotesList
                leadId={lead.id}
                notes={notes}
                onAddNote={handleAddNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                isLoading={isLoadingNotes}
              />
            ) : activeTab === 'reminders' ? (
              <RemindersTab leadId={lead.id} />
            ) : activeTab === 'files' ? (
              <FileUpload
                leadId={lead.id}
                attachments={attachments}
                onUpload={handleFileUpload}
                onDelete={handleFileDelete}
              />
            ) : (
              <InteractionHistory
                leadId={lead.id}
                interactions={interactions}
                isLoading={isLoadingInteractions}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};
