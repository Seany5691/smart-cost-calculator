'use client';

import { useState, useEffect } from 'react';
import { useConfigStore } from '@/store/config';
import { Item } from '@/lib/types';
import { formatCurrency, generateId } from '@/lib/utils';
import { Plus, Trash2, Edit, Save, X, Check } from 'lucide-react';

export default function ConnectivityConfig() {
  const { connectivity, updateConnectivity } = useConfigStore();
  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setItems(connectivity);
  }, [connectivity]);

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      updateConnectivity(items);
      setMessage({ type: 'success', text: 'Connectivity configuration saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    const newItem: Item = {
      id: generateId(),
      name: '',
      cost: 0,
      managerCost: 0,
      userCost: 0,
      quantity: 0,
      locked: false
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold gradient-text">Connectivity Configuration</h2>
        <button
          onClick={handleAddItem}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold">Name</th>
                <th className="text-left py-3 px-4 font-semibold">Cost</th>
                <th className="text-left py-3 px-4 font-semibold">Manager Cost</th>
                <th className="text-left py-3 px-4 font-semibold">User Cost</th>
                <th className="text-left py-3 px-4 font-semibold">Locked</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {editingItem === item.id ? (
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                        className="input w-full"
                      />
                    ) : (
                      <span className="font-medium">{item.name}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        value={item.cost}
                        onChange={(e) => handleUpdateItem(item.id, { cost: parseFloat(e.target.value) || 0 })}
                        className="input w-24"
                        step="0.01"
                      />
                    ) : (
                      <span>{formatCurrency(item.cost)}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        value={item.managerCost || item.cost}
                        onChange={(e) => handleUpdateItem(item.id, { managerCost: parseFloat(e.target.value) || 0 })}
                        className="input w-24"
                        step="0.01"
                      />
                    ) : (
                      <span>{formatCurrency(item.managerCost || item.cost)}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        value={item.userCost || item.cost}
                        onChange={(e) => handleUpdateItem(item.id, { userCost: parseFloat(e.target.value) || 0 })}
                        className="input w-24"
                        step="0.01"
                      />
                    ) : (
                      <span>{formatCurrency(item.userCost || item.cost)}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingItem === item.id ? (
                      <input
                        type="checkbox"
                        checked={item.locked || false}
                        onChange={(e) => handleUpdateItem(item.id, { locked: e.target.checked })}
                        className="w-4 h-4 text-blue-600"
                      />
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.locked ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.locked ? 'Locked' : 'Unlocked'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      {editingItem === item.id ? (
                        <>
                          <button
                            onClick={() => handleSaveItem(item.id)}
                            className="p-1 text-green-600 hover:text-green-800"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-gray-600 hover:text-gray-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditItem(item.id)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
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

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="btn btn-success flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
} 