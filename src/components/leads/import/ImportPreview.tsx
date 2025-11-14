'use client';

import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { ImportPreviewProps } from '@/lib/leads/types';
import { validateLead } from '@/lib/leads/validation';

interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
}

export default function ImportPreview({
  data,
  fieldMapping,
  onFieldMappingChange,
  onImport,
  onCancel,
  isImporting = false
}: ImportPreviewProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<Record<number, any>>({});
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  // Validate all data
  const validationResults = useMemo(() => {
    return data.map((row, index) => {
      const mappedRow: any = {};
      Object.entries(fieldMapping).forEach(([targetField, sourceField]) => {
        mappedRow[targetField] = row[sourceField];
      });
      
      // Apply any edits
      if (editedData[index]) {
        Object.assign(mappedRow, editedData[index]);
      }
      
      const validation = validateLead(mappedRow);
      return {
        index,
        data: mappedRow,
        isValid: validation.isValid,
        errors: validation.errors
      };
    });
  }, [data, fieldMapping, editedData]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = validationResults.length;
    const valid = validationResults.filter(r => r.isValid).length;
    const invalid = total - valid;
    const validPercentage = total > 0 ? Math.round((valid / total) * 100) : 0;
    
    return { total, valid, invalid, validPercentage };
  }, [validationResults]);

  // Get filtered results
  const filteredResults = useMemo(() => {
    if (showOnlyErrors) {
      return validationResults.filter(r => !r.isValid);
    }
    return validationResults;
  }, [validationResults, showOnlyErrors]);

  // Toggle row expansion
  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  // Start editing a row
  const startEditing = (index: number, rowData: any) => {
    setEditingRow(index);
    setEditedData(prev => ({
      ...prev,
      [index]: { ...rowData }
    }));
  };

  // Save edited row
  const saveEdit = (index: number) => {
    setEditingRow(null);
    // Data is already in editedData state
  };

  // Cancel editing
  const cancelEdit = (index: number) => {
    setEditingRow(null);
    const newEditedData = { ...editedData };
    delete newEditedData[index];
    setEditedData(newEditedData);
  };

  // Update field value
  const updateFieldValue = (index: number, field: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [index]: {
        ...(prev[index] || {}),
        [field]: value
      }
    }));
  };

  // Get status icon
  const getStatusIcon = (isValid: boolean) => {
    if (isValid) {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  // Render field value
  const renderFieldValue = (
    index: number,
    field: string,
    value: any,
    isEditing: boolean,
    hasError: boolean
  ) => {
    if (isEditing) {
      return (
        <input
          type="text"
          value={editedData[index]?.[field] || value || ''}
          onChange={(e) => updateFieldValue(index, field, e.target.value)}
          className={`
            w-full px-2 py-1 bg-gray-700 border rounded text-sm
            ${hasError ? 'border-red-500' : 'border-gray-600'}
            focus:outline-none focus:border-blue-500
          `}
        />
      );
    }
    
    return (
      <span className={hasError ? 'text-red-400' : 'text-gray-300'}>
        {value || <span className="text-gray-500 italic">Empty</span>}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Import Preview</h3>
        <p className="text-gray-400 text-sm">
          Review and validate data before importing
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Records</p>
              <p className="text-2xl font-bold text-white">{statistics.total}</p>
            </div>
            <Info className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Valid</p>
              <p className="text-2xl font-bold text-green-400">{statistics.valid}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Invalid</p>
              <p className="text-2xl font-bold text-red-400">{statistics.invalid}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-white">{statistics.validPercentage}%</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-gray-700 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{statistics.validPercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter toggle */}
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyErrors}
            onChange={(e) => setShowOnlyErrors(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-300">Show only records with errors</span>
        </label>
        
        <span className="text-sm text-gray-400">
          Showing {filteredResults.length} of {statistics.total} records
        </span>
      </div>

      {/* Data preview */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filteredResults.map((result) => {
          const isExpanded = expandedRows.has(result.index);
          const isEditing = editingRow === result.index;
          const errorFields = new Set(result.errors.map(e => e.field));
          
          return (
            <div
              key={result.index}
              className={`
                rounded-lg border transition-all
                ${result.isValid 
                  ? 'bg-gray-800/30 border-gray-700' 
                  : 'bg-red-500/5 border-red-500/30'
                }
              `}
            >
              {/* Row header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3 flex-1">
                  {getStatusIcon(result.isValid)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">
                        Row {result.index + 1}
                      </span>
                      {!result.isValid && (
                        <span className="text-xs text-red-400">
                          ({result.errors.length} error{result.errors.length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {result.data.name || 'Unnamed'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!isEditing && (
                    <button
                      onClick={() => startEditing(result.index, result.data)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  {isEditing && (
                    <>
                      <button
                        onClick={() => saveEdit(result.index)}
                        className="p-2 text-green-400 hover:text-green-300 transition-colors"
                        title="Save"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => cancelEdit(result.index)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => toggleRowExpansion(result.index)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-700">
                  {/* Error messages */}
                  {!result.isValid && result.errors.length > 0 && (
                    <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <p className="text-red-400 font-medium text-sm mb-2">Validation Errors:</p>
                      <ul className="space-y-1">
                        {result.errors.map((error, idx) => (
                          <li key={idx} className="text-sm text-red-300 flex items-start space-x-2">
                            <span>•</span>
                            <span>{error.field}: {error.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Field values */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {Object.entries(fieldMapping).map(([targetField, sourceField]) => {
                      const value = result.data[targetField];
                      const hasError = errorFields.has(targetField);
                      
                      return (
                        <div key={targetField} className="space-y-1">
                          <label className="text-xs text-gray-400 flex items-center space-x-1">
                            <span>{targetField.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            {hasError && <AlertCircle className="w-3 h-3 text-red-400" />}
                          </label>
                          <div className="text-sm">
                            {renderFieldValue(result.index, targetField, value, isEditing, hasError)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredResults.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">All records are valid!</p>
          <p className="text-gray-400 text-sm">No errors found in the import data</p>
        </div>
      )}

      {/* Import summary */}
      {statistics.invalid > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-400 font-medium mb-1">Warning</p>
              <p className="text-sm text-yellow-300">
                {statistics.invalid} record{statistics.invalid !== 1 ? 's' : ''} {statistics.invalid !== 1 ? 'have' : 'has'} validation errors. 
                These records will be skipped during import. You can edit them above to fix the errors.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          {statistics.valid} of {statistics.total} records will be imported
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={isImporting}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onImport}
            disabled={isImporting || statistics.valid === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <span>Import {statistics.valid} Lead{statistics.valid !== 1 ? 's' : ''}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
