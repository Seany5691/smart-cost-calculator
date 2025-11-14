'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useImportStore } from '@/store/leads/import';
import { useLeadsStore } from '@/store/leads/leads';
import { 
  validateImportFile, 
  detectFieldMapping, 
  validateFieldMapping,
  IMPORT_CONSTANTS 
} from '@/lib/leads/importUtils';

interface ExcelImporterProps {
  onImportComplete?: () => void;
  onCancel?: () => void;
}

export default function ExcelImporter({ onImportComplete, onCancel }: ExcelImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [listName, setListName] = useState<string>('');
  const [listMode, setListMode] = useState<'new' | 'existing'>('new');
  const [existingLists, setExistingLists] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importFromExcel, isImporting, importProgress, error } = useImportStore();
  const { getUniqueListNames } = useLeadsStore();

  // Load existing lists on mount
  useEffect(() => {
    const lists = getUniqueListNames();
    setExistingLists(lists);
  }, [getUniqueListNames]);

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setValidationErrors([]);
    
    // Validate file
    const validation = validateImportFile(selectedFile);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setFile(selectedFile);
    
    // Auto-fill list name from filename (remove extension)
    const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
    setListName(fileNameWithoutExt);
    
    // Parse file for preview
    try {
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) {
            setValidationErrors(['File is empty or has no data']);
            return;
          }

          // Get headers
          const fileHeaders = Object.keys(jsonData[0] as object);
          setHeaders(fileHeaders);
          
          // Auto-detect field mapping
          const detectedMapping = detectFieldMapping(fileHeaders);
          setFieldMapping(detectedMapping);
          
          // Validate mapping
          const mappingValidation = validateFieldMapping(detectedMapping);
          if (!mappingValidation.isValid) {
            setValidationErrors([
              `Missing required fields: ${mappingValidation.missingFields.join(', ')}`
            ]);
          }
          
          // Show preview (first 5 rows)
          setPreviewData(jsonData.slice(0, 5));
          setStep('preview');
        } catch (err) {
          setValidationErrors(['Failed to parse Excel file. Please check the file format.']);
        }
      };
      
      reader.onerror = () => {
        setValidationErrors(['Failed to read file']);
      };
      
      reader.readAsBinaryString(selectedFile);
    } catch (err) {
      setValidationErrors(['Failed to load Excel parser']);
    }
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  // Handle field mapping change
  const handleFieldMappingChange = useCallback((targetField: string, sourceField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [targetField]: sourceField
    }));
    
    // Re-validate mapping
    const newMapping = { ...fieldMapping, [targetField]: sourceField };
    const validation = validateFieldMapping(newMapping);
    if (!validation.isValid) {
      setValidationErrors([
        `Missing required fields: ${validation.missingFields.join(', ')}`
      ]);
    } else {
      setValidationErrors([]);
    }
  }, [fieldMapping]);

  // Handle import
  const handleImport = useCallback(async () => {
    if (!file) return;
    
    // Validate mapping one more time
    const validation = validateFieldMapping(fieldMapping);
    if (!validation.isValid) {
      setValidationErrors([
        `Cannot import: Missing required fields: ${validation.missingFields.join(', ')}`
      ]);
      return;
    }
    
    // Validate list name
    if (!listName || listName.trim() === '') {
      setValidationErrors(['Please enter a list name']);
      return;
    }
    
    setStep('importing');
    
    try {
      await importFromExcel(file, fieldMapping, listName.trim());
      onImportComplete?.();
    } catch (err: any) {
      setValidationErrors([err.message || 'Import failed']);
      setStep('preview');
    }
  }, [file, fieldMapping, listName, importFromExcel, onImportComplete]);

  // Reset to upload step
  const handleReset = useCallback(() => {
    setFile(null);
    setPreviewData([]);
    setHeaders([]);
    setFieldMapping({});
    setListName('');
    setListMode('new');
    setValidationErrors([]);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Render upload step
  if (step === 'upload') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Import from Excel</h3>
          <p className="text-gray-400 text-sm">
            Upload an Excel file (.xlsx, .xls) or CSV file to import leads
          </p>
        </div>

        {/* Drag and drop area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center transition-all
            ${isDragging 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center space-y-4">
            <div className={`
              p-4 rounded-full transition-colors
              ${isDragging ? 'bg-blue-500/20' : 'bg-gray-700/50'}
            `}>
              <Upload className={`w-12 h-12 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
            </div>
            
            <div>
              <p className="text-white font-medium mb-1">
                {isDragging ? 'Drop file here' : 'Drag and drop your file here'}
              </p>
              <p className="text-gray-400 text-sm">or</p>
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Browse Files
            </button>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p>Supported formats: .xlsx, .xls, .csv</p>
              <p>Maximum file size: {IMPORT_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB</p>
            </div>
          </div>
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 font-medium mb-1">Validation Errors</p>
                <ul className="text-sm text-red-300 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Cancel button */}
        {onCancel && (
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render preview and field mapping step
  if (step === 'preview') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">Preview and Map Fields</h3>
            <p className="text-gray-400 text-sm">
              Review the data and map columns to lead fields
            </p>
          </div>
          <button
            onClick={handleReset}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File info */}
        <div className="bg-gray-800/50 rounded-lg p-4 flex items-center space-x-3">
          <FileSpreadsheet className="w-8 h-8 text-green-400" />
          <div className="flex-1">
            <p className="text-white font-medium">{file?.name}</p>
            <p className="text-gray-400 text-sm">
              {((file?.size || 0) / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>

        {/* List Selection */}
        <div className="space-y-4">
          <label className="text-gray-900 font-medium">
            List Assignment <span className="text-red-600">*</span>
          </label>
          
          {/* Radio buttons for new/existing */}
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                value="new"
                checked={listMode === 'new'}
                onChange={(e) => setListMode(e.target.value as 'new')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-900">Create New List</span>
            </label>
            
            {existingLists.length > 0 && (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="existing"
                  checked={listMode === 'existing'}
                  onChange={(e) => setListMode(e.target.value as 'existing')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-900">Add to Existing List</span>
              </label>
            )}
          </div>

          {/* List name input or dropdown */}
          {listMode === 'new' ? (
            <div className="space-y-2">
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g., Potchefstroom, Klerksdorp, Rustenburg..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600">
                Auto-filled from filename. Edit to change the list name.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <select
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a list --</option>
                {existingLists.map(list => (
                  <option key={list} value={list}>{list}</option>
                ))}
              </select>
              <p className="text-sm text-gray-600">
                These leads will be added to the selected list.
              </p>
            </div>
          )}
        </div>

        {/* Field mapping */}
        <div className="space-y-4">
          <h4 className="text-white font-medium">Field Mapping</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['maps_address', 'name', 'phone', 'provider', 'address', 'type_of_business', 'notes'].map(field => (
              <div key={field} className="space-y-2">
                <label className="text-sm text-gray-400">
                  {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  {(field === 'maps_address' || field === 'name') && (
                    <span className="text-red-400 ml-1">*</span>
                  )}
                </label>
                <select
                  value={fieldMapping[field] || ''}
                  onChange={(e) => handleFieldMappingChange(field, e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Not mapped --</option>
                  {headers.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Preview data */}
        <div className="space-y-4">
          <h4 className="text-white font-medium">Data Preview (First 5 rows)</h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  {headers.map(header => (
                    <th key={header} className="px-3 py-2 text-left text-gray-400 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    {headers.map(header => (
                      <td key={header} className="px-3 py-2 text-gray-300">
                        {String(row[header] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 font-medium mb-1">Validation Errors</p>
                <ul className="text-sm text-red-300 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Choose Different File
          </button>
          
          <div className="flex space-x-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleImport}
              disabled={validationErrors.length > 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Import Leads
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render importing step
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Importing Leads</h3>
        <p className="text-gray-400 text-sm">
          Please wait while we import your leads...
        </p>
      </div>

      {/* Progress indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className="text-white font-medium">{importProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${importProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium mb-1">Import Error</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
