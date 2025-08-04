'use client';

import { useState, useEffect } from 'react';
import { useCalculatorStore } from '@/store/calculator';
import { useAuthStore } from '@/store/auth';
import { formatCurrency, getItemCost, generateId } from '@/lib/utils';
import { Item } from '@/lib/types';
import { ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';

interface LicensingSectionProps {
  onNext: () => void;
  onPrev: () => void;
}

export default function LicensingSection({ onNext, onPrev }: LicensingSectionProps) {
  const { sections, updateSectionItem, addTemporaryItem } = useCalculatorStore();
  const { user } = useAuthStore();
  const [licensingItems, setLicensingItems] = useState<Item[]>([]);
  const [totalLicensingCost, setTotalLicensingCost] = useState(0);
  const [newItem, setNewItem] = useState({ name: '', cost: 0 });
  const [showAddForm, setShowAddForm] = useState(false);

  // Load licensing items from store
  useEffect(() => {
    const licensingSection = sections.find(s => s.id === 'licensing');
    if (licensingSection) {
      setLicensingItems(licensingSection.items);
    }
  }, [sections]);

  // Calculate total licensing cost
  useEffect(() => {
    const total = licensingItems.reduce((sum, item) => {
      const cost = getItemCost(item, user?.role || 'user');
      return sum + (cost * item.quantity);
    }, 0);
    setTotalLicensingCost(total);
  }, [licensingItems, user?.role]);

  // Handle quantity change
  const handleQuantityChange = (itemId: string, quantity: number) => {
    updateSectionItem('licensing', itemId, { quantity: Math.max(0, quantity) });
  };

  // Handle adding a new temporary item
  const handleAddTemporaryItem = () => {
    if (!newItem.name.trim()) {
      alert('Please enter an item name');
      return;
    }
    
    if (newItem.cost <= 0) {
      alert('Cost must be greater than 0');
      return;
    }
    
    // Create a new temporary item
    const tempItem: Item = {
      id: generateId(),
      name: newItem.name,
      cost: newItem.cost,
      quantity: 1,
      locked: false
    };
    
    // Add the item to the licensing section
    addTemporaryItem('licensing', tempItem);
    
    // Reset the form
    setNewItem({ name: '', cost: 0 });
    setShowAddForm(false);
  };

  // Handle save and navigate to next section
  const handleSave = () => {
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold gradient-text mb-2">
          Licensing Selection
        </h2>
        <p className="text-gray-600">
          Select licensing items and quantities for this deal
        </p>
      </div>

      {/* Licensing Items Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                License
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monthly Cost
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {licensingItems.map((item) => {
              const cost = getItemCost(item, user?.role || 'user');
              const total = cost * item.quantity;
              
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        disabled={item.quantity <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Total Licensing Cost */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-blue-900">
            Total Monthly Licensing Cost:
          </span>
          <span className="text-2xl font-bold text-blue-900">
            {formatCurrency(totalLicensingCost)}
          </span>
        </div>
      </div>

      {/* Add Temporary Item Form */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Add Temporary License
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-outline"
          >
            {showAddForm ? 'Cancel' : 'Add License'}
          </button>
        </div>
        
        {showAddForm && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Add a custom license for this calculation only. This license will not be saved for future calculations.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">License Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter license name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Monthly Cost (R)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Enter monthly cost"
                  value={newItem.cost || ''}
                  onChange={(e) => setNewItem({ ...newItem, cost: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  className="btn btn-success w-full"
                  onClick={handleAddTemporaryItem}
                >
                  Add License
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button 
          onClick={onPrev}
          className="btn btn-outline flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back: Connectivity</span>
        </button>
        <button 
          onClick={handleSave}
          className="btn btn-primary flex items-center space-x-2"
        >
          <span>Next: Settlement</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
} 