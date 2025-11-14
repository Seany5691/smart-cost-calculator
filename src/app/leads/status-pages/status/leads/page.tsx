'use client';

import { useEffect, useState, useMemo } from 'react';
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
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadDetailsModal } from '@/components/leads/leads/LeadDetailsModal';
import { LaterStageModal } from '@/components/leads/leads/LaterStageModal';
import { LeadNotesRemindersDropdown } from '@/components/leads/leads/LeadNotesRemindersDropdown';
import { AddLeadButton } from '@/components/leads/leads/AddLeadButton';
import { LEAD_STATUSES } from '@/lib/leads/types';

export default function LeadsStatusPage() {
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
      return (localStorage.getItem('leads-view-mode') as 'grid' | 'table') || 'table';
    }
    return 'table';
  });

  // Persist view mode changes
  useEffect(() => {
    localStorage.setItem('leads-view-mode', viewMode);
  }, [viewMode]);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sort state
  const [sortOptions, setSortOptions] = useState<LeadSortOptions>({
    field: 'number',
    direction: 'asc'
  });

  // Modal states
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<Lead | null>(null);
  const [editingNotes, setEditingNotes] = useState<{ leadId: string; notes: string } | null>(null);
  const [showLaterStageModal, setShowLaterStageModal] = useState<Lead | null>(null);

  // Load leads on mount
  useEffect(() => {
    fetchLeadsByStatus('leads');
  }, [fetchLeadsByStatus]);

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let result = leads.filter(lead => lead.status === 'leads');

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
      const field = sortOptions.field;
      const direction = sortOptions.direction === 'asc' ? 1 : -1;

      if (field === 'number') {
        return (a.number - b.number) * direction;
      }

      const aValue = a[field as keyof Lead] || '';
      const bValue = b[field as keyof Lead] || '';

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * direction;
      }

      return 0;
    });

    return result;
  }, [leads, searchTerm, sortOptions]);

  // Handle status change
  const handleStatusChange = async (leadId: string, newStatus: LeadStatus, additionalData?: any) => {
    try {
      // If changing to "later" status, show modal to collect callback date
      if (newStatus === 'later') {
        const lead = filteredLeads.find(l => l.id === leadId);
        if (lead) {
          setShowLaterStageModal(lead);
        }
      } else {
        await changeLeadStatus(leadId, newStatus, additionalData);
      }
    } catch (error) {
      console.error('Failed to change lead status:', error);
    }
  };

  // Handle Later Stage confirmation
  const handleLaterStageConfirm = async (data: { date_to_call_back: string; notes: string }) => {
    if (!showLaterStageModal) return;
    
    try {
      await changeLeadStatus(showLaterStageModal.id, 'later', data);
      setShowLaterStageModal(null);
      // Reload leads to reflect changes
      await fetchLeadsByStatus('leads');
    } catch (error) {
      console.error('Failed to move lead to Later Stage:', error);
    }
  };

  // Handle lead update
  const handleLeadUpdate = async (leadId: string, updates: Partial<Lead>) => {
    try {
      await updateLead(leadId, updates);
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  // Handle lead deletion (no confirmation - used by bulk delete)
  const handleLeadDelete = async (leadId: string) => {
    try {
      await deleteLead(leadId);
    } catch (error) {
      console.error('Failed to delete lead:', error);
      throw error;
    }
  };

  // Handle sort change
  const handleSortChange = (field: keyof Lead) => {
    setSortOptions(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading leads...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Leads</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Leads</h1>
            <p className="text-lg text-gray-600">
              Leads that have been through route generation and are ready to be worked on.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
              aria-label="Grid view"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'table'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
              aria-label="Table view"
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{filteredLeads.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Notes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredLeads.filter(l => l.notes).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selected</p>
                <p className="text-2xl font-bold text-gray-900">{selectedLeads.length}</p>
              </div>
              <Plus className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by name, phone, provider, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Add Lead Button */}
          <AddLeadButton defaultStatus="leads" onSuccess={() => fetchLeadsByStatus('leads')} />
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedLeads.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-blue-900">
                {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                onChange={async (e) => {
                  if (e.target.value && confirm(`Change status of ${selectedLeads.length} leads?`)) {
                    for (const leadId of selectedLeads) {
                      await handleStatusChange(leadId, e.target.value as LeadStatus);
                    }
                    clearSelection();
                  }
                  e.target.value = '';
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                defaultValue=""
              >
                <option value="" disabled>Change Status...</option>
                {LEAD_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <button
                onClick={async () => {
                  if (confirm(`Delete ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}? This cannot be undone.`)) {
                    // Delete all at once without individual confirmations
                    try {
                      await Promise.all(selectedLeads.map(leadId => deleteLead(leadId)));
                      clearSelection();
                    } catch (error) {
                      console.error('Error deleting leads:', error);
                      alert('Some leads could not be deleted. Please try again.');
                    }
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {filteredLeads.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Leads Yet</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm
              ? 'No leads match your search criteria.'
              : 'Generate a route from the Main Sheet to add leads here.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Main Sheet
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="space-y-2">
              <LeadCard
                lead={lead}
                onStatusChange={handleStatusChange}
                onUpdate={handleLeadUpdate}
                onDelete={handleLeadDelete}
                onViewDetails={() => setSelectedLeadForDetails(lead)}
                isSelected={selectedLeads.includes(lead.id)}
                onSelect={() => selectLead(lead.id)}
                onDeselect={() => deselectLead(lead.id)}
              />
              <LeadNotesRemindersDropdown lead={lead} />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        filteredLeads.forEach(lead => selectLead(lead.id));
                      } else {
                        clearSelection();
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Provider</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Notes</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className={cn(
                  "border-b border-gray-100 hover:bg-gray-50",
                  selectedLeads.includes(lead.id) && "bg-blue-50"
                )}>
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectLead(lead.id);
                        } else {
                          deselectLead(lead.id);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 truncate max-w-xs" title={lead.name}>{lead.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{lead.address}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      lead.provider?.toLowerCase() === 'telkom'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.provider || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{lead.phone || 'N/A'}</td>
                  <td className="py-3 px-4">
                    {editingNotes?.leadId === lead.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingNotes.notes}
                          onChange={(e) => setEditingNotes({ leadId: lead.id, notes: e.target.value })}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          autoFocus
                        />
                        <button
                          onClick={async () => {
                            await handleLeadUpdate(lead.id, { notes: editingNotes.notes });
                            setEditingNotes(null);
                          }}
                          className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingNotes(null)}
                          className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 truncate max-w-xs">
                          {lead.notes || 'No notes'}
                        </span>
                        <button
                          onClick={() => setEditingNotes({ leadId: lead.id, notes: lead.notes || '' })}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit notes"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {LEAD_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedLeadForDetails(lead)}
                        className="btn btn-sm btn-info"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${lead.name}? This cannot be undone.`)) {
                            handleLeadDelete(lead.id);
                          }
                        }}
                        className="btn btn-sm btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Details Modal */}
      {selectedLeadForDetails && (
        <LeadDetailsModal
          lead={selectedLeadForDetails}
          onClose={() => setSelectedLeadForDetails(null)}
          onUpdate={handleLeadUpdate}
          onStatusChange={handleStatusChange}
        />
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
