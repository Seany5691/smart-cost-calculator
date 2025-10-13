'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConfigStore } from '@/store/config';
import { Item } from '@/lib/types';
import { formatCurrency, generateId } from '@/lib/utils';
import { Plus, Trash2, Edit, Save, X, Check, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';

export default function HardwareConfig() {
  const { hardware, updateHardware } = useConfigStore();
  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalItems, setOriginalItems] = useState<Item[]>([]);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  const [managerMarkup, setManagerMarkup] = useState<number>(25);
  const [userMarkup, setUserMarkup] = useState<number>(50);

  // Deep comparison function to check if items have changed
  const deepEqual = useCallback((obj1: any, obj2: any): boolean => {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }, []);

  useEffect(() => {
    // Don't override local changes if we just saved within the last 5 seconds
    const timeSinceLastSave = Date.now() - lastSaveTime;
    if (timeSinceLastSave < 5000) {
      return;
    }
    
    setItems(hardware);
    setOriginalItems(JSON.parse(JSON.stringify(hardware))); // Deep copy
    setHasUnsavedChanges(false);
  }, [hardware, lastSaveTime]);

  // Track changes to detect unsaved modifications
  useEffect(() => {
    const hasChanges = !deepEqual(items, originalItems);
    setHasUnsavedChanges(hasChanges);
  }, [items, originalItems, deepEqual]);

  const handleBatchSave = async () => {
    if (!hasUnsavedChanges) {
      setMessage({ type: 'success', text: 'No changes to save.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await updateHardware(items);
      setLastSaveTime(Date.now());
      setOriginalItems(JSON.parse(JSON.stringify(items))); // Update original data
      setHasUnsavedChanges(false);
      setMessage({ type: 'success', text: 'All hardware changes saved successfully to Supabase!' });
    } catch (error) {
      console.error('Error saving hardware config:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving to Supabase. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle browser navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Reset changes to original values
  const handleDiscardChanges = () => {
    setItems(JSON.parse(JSON.stringify(originalItems)));
    setHasUnsavedChanges(false);
    setEditingItem(null);
    setMessage({ type: 'success', text: 'All changes have been discarded.' });
  };

  // Count total number of changes
  const getChangedItemsCount = useCallback(() => {
    return items.filter((item, index) => {
      const originalItem = originalItems[index];
      return !originalItem || !deepEqual(item, originalItem);
    }).length + Math.abs(items.length - originalItems.length);
  }, [items, originalItems, deepEqual]);

  // Calculate markup prices based on cost price
  const calculateMarkupPrice = (costPrice: number, markupPercent: number) => {
    return costPrice * (1 + markupPercent / 100);
  };

  // Apply markup to all items
  const applyMarkupToAll = () => {
    const updatedItems = items.map(item => {
      if (item.cost && item.cost > 0) {
        return {
          ...item,
          managerCost: calculateMarkupPrice(item.cost, managerMarkup),
          userCost: calculateMarkupPrice(item.cost, userMarkup)
        };
      }
      return item;
    });
    setItems(updatedItems);
  };

  const handleAddItem = () => {
    const newItem: Item = {
      id: generateId(),
      name: '',
      cost: 0,
      managerCost: 0,
      userCost: 0,
      quantity: 0,
      locked: false,
      isExtension: false,
      displayOrder: items.length
    };
    setItems([...items, newItem]);
    setEditingItem(newItem.id);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleEditItem = (id: string) => {
    setEditingItem(id);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleUpdateItem = (id: string, updates: Partial<Item>) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleSaveItem = (id: string) => {
    setEditingItem(null);
  };

  const handleMoveItem = (id: string, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(item => item.id === id);
    if (currentIndex === -1) return;

    const newItems = [...items];
    if (direction === 'up' && currentIndex > 0) {
      // Swap with previous item
      [newItems[currentIndex], newItems[currentIndex - 1]] = [newItems[currentIndex - 1], newItems[currentIndex]];
    } else if (direction === 'down' && currentIndex < newItems.length - 1) {
      // Swap with next item
      [newItems[currentIndex], newItems[currentIndex + 1]] = [newItems[currentIndex + 1], newItems[currentIndex]];
    }

    // Update display order values
    newItems.forEach((item, index) => {
      item.displayOrder = index;
    });

    setItems(newItems);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <h2 className="text-xl sm:text-2xl font-bold gradient-text">Hardware Configuration</h2>
          {hasUnsavedChanges && (
            <div className="flex items-center space-x-1.5 sm:space-x-2 text-amber-600 bg-amber-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Unsaved changes</span>
              <span className="sm:hidden">Unsaved</span>
            </div>
          )}
        </div>
        <button
          onClick={handleAddItem}
          className="btn btn-primary flex items-center space-x-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Markup Controls - Mobile Optimized */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4">Markup Percentage Controls</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-end">
          <div>
            <label className="label text-xs sm:text-sm">Manager Markup (%)</label>
            <input
              type="number"
              value={managerMarkup}
              onChange={(e) => setManagerMarkup(parseFloat(e.target.value) || 0)}
              className="input"
              placeholder="e.g., 25"
              step="0.1"
            />
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1">Markup percentage for manager pricing</p>
          </div>
          <div>
            <label className="label text-xs sm:text-sm">User Markup (%)</label>
            <input
              type="number"
              value={userMarkup}
              onChange={(e) => setUserMarkup(parseFloat(e.target.value) || 0)}
              className="input"
              placeholder="e.g., 50"
              step="0.1"
            />
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1">Markup percentage for user pricing</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              onClick={applyMarkupToAll}
              className="btn btn-success w-full"
            >
              Apply Markup to All Items
            </button>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1">Calculates manager/user costs from cost prices</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {hasUnsavedChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800 text-sm sm:text-base">Pending Changes Summary</h3>
          </div>
          <p className="text-amber-700 text-xs sm:text-sm">
            You have <strong>{getChangedItemsCount()} unsaved changes</strong> to your hardware configuration. 
            Use "Save All Changes" to persist all modifications or "Discard Changes" to revert to the last saved state.
          </p>
        </div>
      )}

      <div className="card p-0 sm:p-6">
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Order</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Name</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Cost Price</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Manager Cost</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">User Cost</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Extension</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Locked</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs sm:text-sm text-gray-600 font-medium">{index + 1}</span>
                      <div className="flex flex-col">
                        <button
                          onClick={() => handleMoveItem(item.id, 'up')}
                          disabled={index === 0}
                          className="p-0.5 sm:p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 touch-manipulation"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveItem(item.id, 'down')}
                          disabled={index === items.length - 1}
                          className="p-0.5 sm:p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 touch-manipulation"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    {editingItem === item.id ? (
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                        className="input w-full text-xs sm:text-sm"
                      />
                    ) : (
                      <span className="font-medium text-xs sm:text-sm">{item.name}</span>
                    )}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        value={item.cost}
                        onChange={(e) => handleUpdateItem(item.id, { cost: parseFloat(e.target.value) || 0 })}
                        className="input w-20 sm:w-24 text-xs sm:text-sm"
                        step="0.01"
                        placeholder="Cost price"
                      />
                    ) : (
                      <span className="text-xs sm:text-sm">{formatCurrency(item.cost)}</span>
                    )}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        value={item.managerCost || item.cost}
                        onChange={(e) => handleUpdateItem(item.id, { managerCost: parseFloat(e.target.value) || 0 })}
                        className="input w-20 sm:w-24 text-xs sm:text-sm"
                        step="0.01"
                      />
                    ) : (
                      <span className="text-xs sm:text-sm">{formatCurrency(item.managerCost || item.cost)}</span>
                    )}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        value={item.userCost || item.cost}
                        onChange={(e) => handleUpdateItem(item.id, { userCost: parseFloat(e.target.value) || 0 })}
                        className="input w-20 sm:w-24 text-xs sm:text-sm"
                        step="0.01"
                      />
                    ) : (
                      <span className="text-xs sm:text-sm">{formatCurrency(item.userCost || item.cost)}</span>
                    )}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    {editingItem === item.id ? (
                      <input
                        type="checkbox"
                        checked={item.isExtension || false}
                        onChange={(e) => handleUpdateItem(item.id, { isExtension: e.target.checked })}
                        className="w-4 h-4 text-blue-600 touch-manipulation"
                      />
                    ) : (
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs ${
                        item.isExtension ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.isExtension ? 'Yes' : 'No'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    {editingItem === item.id ? (
                      <input
                        type="checkbox"
                        checked={item.locked || false}
                        onChange={(e) => handleUpdateItem(item.id, { locked: e.target.checked })}
                        className="w-4 h-4 text-blue-600 touch-manipulation"
                      />
                    ) : (
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs ${
                        item.locked ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.locked ? 'Locked' : 'Unlocked'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    <div className="flex space-x-1 sm:space-x-2">
                      {editingItem === item.id ? (
                        <>
                          <button
                            onClick={() => handleSaveItem(item.id)}
                            className="p-1 text-green-600 hover:text-green-800 touch-manipulation"
                          >
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-gray-600 hover:text-gray-800 touch-manipulation"
                          >
                            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditItem(item.id)}
                            className="p-1 text-blue-600 hover:text-blue-800 touch-manipulation"
                          >
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-red-600 hover:text-red-800 touch-manipulation"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
        {hasUnsavedChanges && (
          <button
            onClick={handleDiscardChanges}
            disabled={isLoading}
            className="btn btn-outline text-gray-600 hover:text-gray-800 w-full sm:w-auto"
          >
            Discard Changes
          </button>
        )}
        <button
          onClick={handleBatchSave}
          disabled={isLoading || !hasUnsavedChanges}
          className={`btn flex items-center justify-center space-x-2 w-full sm:w-auto ${
            hasUnsavedChanges 
              ? 'btn-success' 
              : 'btn-secondary opacity-50 cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4" />
          <span className="text-xs sm:text-sm">
            {isLoading 
              ? 'Saving...' 
              : hasUnsavedChanges 
                ? `Save All (${getChangedItemsCount()})` 
                : 'No Changes'
            }
          </span>
        </button>
      </div>

      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Hardware Configuration Info</h3>
        <ul className="text-blue-800 text-xs sm:text-sm space-y-1">
          <li><strong>Cost Price:</strong> Base cost price for markup calculations (shown to admin users)</li>
          <li><strong>Manager Cost:</strong> Cost shown to manager role users (with markup)</li>
          <li><strong>User Cost:</strong> Cost shown to regular users (with markup)</li>
          <li><strong>Markup Controls:</strong> Set percentage markup and apply to all items based on cost price</li>
          <li><strong>Extension:</strong> Items that count toward extension totals</li>
          <li><strong>Locked:</strong> Items that cannot be modified in the calculator</li>
          <li><strong>Changes are saved to Supabase:</strong> All updates are persisted across browsers</li>
        </ul>
      </div>
    </div>
  );
} 