'use client';

import React, { useState, useEffect } from 'react';
import type { IndustrySelectorProps } from '@/lib/scraper/types';
import { Plus, Trash2, CheckSquare, Square, Briefcase } from 'lucide-react';

export default function IndustrySelector({
  industries,
  selectedIndustries,
  onSelectionChange,
  onAddIndustry,
  onRemoveIndustry,
  disabled,
}: IndustrySelectorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newIndustry, setNewIndustry] = useState('');
  const [selectedForRemoval, setSelectedForRemoval] = useState<string[]>([]);

  const handleToggleIndustry = (industry: string) => {
    if (selectedIndustries.includes(industry)) {
      onSelectionChange(selectedIndustries.filter((i) => i !== industry));
    } else {
      onSelectionChange([...selectedIndustries, industry]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(industries);
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const handleAddIndustry = () => {
    if (newIndustry.trim() && !industries.includes(newIndustry.trim())) {
      onAddIndustry(newIndustry.trim());
      setNewIndustry('');
      setShowAddDialog(false);
    }
  };

  const handleRemoveIndustries = () => {
    selectedForRemoval.forEach((industry) => {
      onRemoveIndustry(industry);
    });
    setSelectedForRemoval([]);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Industry Categories
            </h3>
            <p className="text-xs text-gray-600">
              {selectedIndustries.length} selected
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
          >
            Select All
          </button>
          <span className="text-gray-400">•</span>
          <button
            type="button"
            onClick={handleDeselectAll}
            disabled={disabled}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-80 overflow-y-auto space-y-2">
        {industries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No industries available. Add some to get started.
          </p>
        ) : (
          industries.map((industry) => (
            <label
              key={industry}
              className={`
                flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200
                ${selectedIndustries.includes(industry)
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                  : 'hover:bg-white/50'
                }
              `}
            >
              <input
                type="checkbox"
                checked={selectedIndustries.includes(industry)}
                onChange={() => handleToggleIndustry(industry)}
                disabled={disabled}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className={`text-sm flex-1 ${
                selectedIndustries.includes(industry) ? 'text-white font-medium' : 'text-gray-700'
              }`}>
                {industry}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (selectedForRemoval.includes(industry)) {
                      setSelectedForRemoval(selectedForRemoval.filter((i) => i !== industry));
                    } else {
                      setSelectedForRemoval([...selectedForRemoval, industry]);
                    }
                  }}
                  className={`p-1 rounded ${
                    selectedForRemoval.includes(industry)
                      ? 'text-red-600 bg-red-50'
                      : selectedIndustries.includes(industry)
                      ? 'text-white/80 hover:text-white hover:bg-white/20'
                      : 'text-gray-400 hover:text-red-600'
                  }`}
                  title="Mark for removal"
                >
                  {selectedForRemoval.includes(industry) ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              )}
            </label>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowAddDialog(true)}
          disabled={disabled}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Industry
        </button>
        {selectedForRemoval.length > 0 && (
          <button
            type="button"
            onClick={handleRemoveIndustries}
            disabled={disabled}
            className="btn btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Remove ({selectedForRemoval.length})
          </button>
        )}
      </div>

      {/* Add Industry Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Custom Industry</h3>
            <input
              type="text"
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddIndustry();
                } else if (e.key === 'Escape') {
                  setShowAddDialog(false);
                  setNewIndustry('');
                }
              }}
              placeholder="e.g., Restaurants, Law Firms, etc."
              className="input mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddDialog(false);
                  setNewIndustry('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddIndustry}
                disabled={!newIndustry.trim() || industries.includes(newIndustry.trim())}
                className="btn btn-primary"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
