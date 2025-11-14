// Supabase helpers for lead notes and reminders
import { supabase } from '@/lib/supabase';

export interface LeadNote {
  id: string;
  leadId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadReminder {
  id: string;
  leadId: string;
  userId: string;
  reminderDate: string;
  note: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// NOTES FUNCTIONS
// ============================================================================

export async function getLeadNotes(leadId: string): Promise<LeadNote[]> {
  const { data, error } = await supabase
    .from('lead_notes')
    .select('*')
    .eq('leadId', leadId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching lead notes:', error);
    throw error;
  }

  return data || [];
}

export async function createLeadNote(
  leadId: string,
  userId: string,
  content: string
): Promise<LeadNote> {
  console.log('[Supabase] Creating note:', { leadId, userId, content });
  
  const { data, error } = await supabase
    .from('lead_notes')
    .insert({
      leadId,
      userId,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error creating lead note:', error);
    console.error('[Supabase] Error details:', JSON.stringify(error, null, 2));
    
    // Check if it's a "relation does not exist" error
    if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.error('\n⚠️  DATABASE MIGRATION REQUIRED ⚠️');
      console.error('The lead_notes table does not exist in your database.');
      console.error('Please run the migration file: leads-supabase-migration.sql');
      console.error('Instructions: Open Supabase SQL Editor and paste the contents of the migration file.\n');
    }
    
    throw error;
  }

  console.log('[Supabase] Note created successfully:', data);
  return data;
}

export async function updateLeadNote(
  noteId: string,
  content: string
): Promise<LeadNote> {
  const { data, error } = await supabase
    .from('lead_notes')
    .update({ content })
    .eq('id', noteId)
    .select()
    .single();

  if (error) {
    console.error('Error updating lead note:', error);
    throw error;
  }

  return data;
}

export async function deleteLeadNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('lead_notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    console.error('Error deleting lead note:', error);
    throw error;
  }
}

// ============================================================================
// REMINDERS FUNCTIONS
// ============================================================================

export async function getLeadReminders(leadId: string): Promise<LeadReminder[]> {
  const { data, error } = await supabase
    .from('lead_reminders')
    .select('*')
    .eq('leadId', leadId)
    .order('reminderDate', { ascending: true });

  if (error) {
    console.error('Error fetching lead reminders:', error);
    throw error;
  }

  return data || [];
}

export async function getAllUserReminders(userId: string): Promise<LeadReminder[]> {
  const { data, error } = await supabase
    .from('lead_reminders')
    .select('*')
    .eq('userId', userId)
    .order('reminderDate', { ascending: true });

  if (error) {
    console.error('Error fetching user reminders:', error);
    throw error;
  }

  return data || [];
}

export async function createLeadReminder(
  leadId: string,
  userId: string,
  reminderDate: string,
  note: string
): Promise<LeadReminder> {
  console.log('[Supabase] Creating reminder:', { leadId, userId, reminderDate, note, completed: false });
  
  const { data, error } = await supabase
    .from('lead_reminders')
    .insert({
      leadId,
      userId,
      reminderDate,
      note,
      completed: false,
    })
    .select()
    .single();
  
  console.log('[Supabase] Insert result - data:', data, 'error:', error);

  if (error) {
    console.error('Error creating lead reminder:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    console.error('Attempted to insert:', { leadId, userId, reminderDate, note });
    
    // Check if it's a "relation does not exist" error
    if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.error('\n⚠️  DATABASE MIGRATION REQUIRED ⚠️');
      console.error('The lead_reminders table does not exist in your database.');
      console.error('Please run the migration file: lead-reminders-migration.sql');
      console.error('Instructions: Open Supabase SQL Editor and paste the contents of the migration file.\n');
    }
    
    // Check for RLS/auth issues
    if (error.code === '42501' || (error.message && error.message.includes('policy'))) {
      console.error('\n⚠️  PERMISSION/RLS ISSUE ⚠️');
      console.error('Row Level Security policy is blocking the insert.');
      console.error('This usually means auth.uid() is not matching the userId.');
      console.error('Check that you are logged in and the user ID is correct.\n');
    }
    
    throw error;
  }

  return data;
}

export async function updateLeadReminder(
  reminderId: string,
  updates: Partial<Pick<LeadReminder, 'reminderDate' | 'note' | 'completed'>>
): Promise<LeadReminder> {
  const { data, error } = await supabase
    .from('lead_reminders')
    .update(updates)
    .eq('id', reminderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating lead reminder:', error);
    throw error;
  }

  return data;
}

export async function toggleReminderCompletion(reminderId: string): Promise<LeadReminder> {
  // First get the current state
  const { data: current, error: fetchError } = await supabase
    .from('lead_reminders')
    .select('completed')
    .eq('id', reminderId)
    .single();

  if (fetchError) {
    console.error('Error fetching reminder:', fetchError);
    throw fetchError;
  }

  // Toggle the completion state
  const { data, error } = await supabase
    .from('lead_reminders')
    .update({ completed: !current.completed })
    .eq('id', reminderId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling reminder completion:', error);
    throw error;
  }

  return data;
}

export async function deleteLeadReminder(reminderId: string): Promise<void> {
  const { error } = await supabase
    .from('lead_reminders')
    .delete()
    .eq('id', reminderId);

  if (error) {
    console.error('Error deleting lead reminder:', error);
    throw error;
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export async function getLeadNotesAndReminders(leadId: string) {
  const [notes, reminders] = await Promise.all([
    getLeadNotes(leadId),
    getLeadReminders(leadId),
  ]);

  return { notes, reminders };
}

// ============================================================================
// MIGRATION HELPERS (for moving from localStorage to Supabase)
// ============================================================================

export async function migrateLocalStorageNotesToSupabase(
  localNotes: any[],
  userId: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const note of localNotes) {
    try {
      await createLeadNote(note.lead_id, userId, note.content);
      success++;
    } catch (error) {
      console.error('Failed to migrate note:', note, error);
      failed++;
    }
  }

  return { success, failed };
}

export async function migrateLocalStorageRemindersToSupabase(
  localReminders: any[],
  userId: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const reminder of localReminders) {
    try {
      await createLeadReminder(
        reminder.leadId,
        userId,
        reminder.reminderDate,
        reminder.note || 'Reminder'
      );
      success++;
    } catch (error) {
      console.error('Failed to migrate reminder:', reminder, error);
      failed++;
    }
  }

  return { success, failed };
}
