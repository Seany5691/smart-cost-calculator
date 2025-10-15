'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { useCalculatorSections, useUpdateSectionItem, useAddTemporaryItem } from '@/store/calculator';
import { useAuthUser } from '@/store/auth';
import { formatCurrency, getItemCost, generateId } from '@/lib/utils';
import { Item } from '@/lib/types';
import { Plus, Minus, Package, Sparkles, TrendingUp, ShoppingCart, Zap } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { GradientText, FloatingInput, MagneticButton, GlassCard } from '@/components/ui/modern';

interface HardwareSectionProps {
  onNext: () => void;
  onPrev: () => void;
}

const HardwareSection = memo(function HardwareSection({ onNext, onPrev }: HardwareSectionProps) {
  const sections = useCalculatorSections();
  const updateSectionItem = useUpdateSectionItem();
  const addTemporaryItem = useAddTemporaryItem();
  const user = useAuthUser();
  const [hardwareItems, setHardwareItems] = useState<Item[]>([]);
  const [totalHardwareCost, setTotalHardwareCost] = useState(0);
  const [newItem, setNewItem] = useState({
    name: '',
    cost: 0,
    isExtension: false,
    showOnProposal: true
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Load hardware items from store
  useEffect(() => {
    const hardwareSection = sections.find((s: any) => s.id === 'hardware');
    if (hardwareSection) {
      setHardwareItems(hardwareSection.items);
    }
  }, [sections]);

  // Calculate total hardware cost
  useEffect(() => {
    const total = hardwareItems.reduce((sum, item) => {
      const cost = getItemCost(item, user?.role || 'user');
      return sum + (cost * item.quantity);
    }, 0);
    setTotalHardwareCost(total);
  }, [hardwareItems, user?.role]);

  // Handle quantity change
  const handleQuantityChange = useCallback((itemId: string, quantity: number) => {
    updateSectionItem('hardware', itemId, { quantity: Math.max(0, quantity) });
  }, [updateSectionItem]);

  // Handle adding a new temporary item
  const handleAddTemporaryItem = useCallback(() => {
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
      locked: false,
      isExtension: newItem.isExtension,
      showOnProposal: newItem.showOnProposal,
      isTemporary: true
    };

    // Add the item to the hardware section
    addTemporaryItem('hardware', tempItem);

    // Reset the form
    setNewItem({ name: '', cost: 0, isExtension: false, showOnProposal: true });
    setShowAddForm(false);
  }, [addTemporaryItem, newItem]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header with Icon */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg animate-float">
          <Package className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2">
          <GradientText animated gradient="blue-purple">
            Hardware Selection
          </GradientText>
        </h2>
        <p className="text-gray-600 flex items-center justify-center space-x-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span>Select hardware items and quantities for this deal</span>
          <Sparkles className="w-4 h-4 text-purple-500" />
        </p>
      </div>

      {/* Hardware Items - Responsive Layout */}
      <GlassCard className="overflow-hidden" glow>
        <div className="p-4 md:p-6">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/20">
                  <TableHead className="w-2/5 text-gray-700 font-bold">Item</TableHead>
                  <TableHead className="w-1/5 text-right text-gray-700 font-bold">Cost</TableHead>
                  <TableHead className="w-1/5 text-center text-gray-700 font-bold">Quantity</TableHead>
                  <TableHead className="w-1/5 text-right text-gray-700 font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hardwareItems.map((item, index) => {
                  const cost = getItemCost(item, user?.role || 'user');
                  const total = cost * item.quantity;

                  return (
                    <TableRow 
                      key={item.id}
                      className="border-b border-white/10 hover:bg-white/40 transition-all duration-300 group"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                          <span className="font-semibold text-gray-800">{item.name}</span>
                          <div className="flex space-x-1">
                            {item.isExtension && (
                              <Badge variant="info" className="text-xs">Extension</Badge>
                            )}
                            {item.isTemporary && (
                              <Badge variant="purple" className="text-xs">Temporary</Badge>
                            )}
                            {item.isTemporary && !item.showOnProposal && (
                              <Badge variant="warning" className="text-xs">Hidden</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-700">
                        {formatCurrency(cost)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 0}
                            className="p-2 h-8 w-8 rounded-lg bg-white/60 hover:bg-white/80 border border-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center group"
                          >
                            <Minus className="w-3 h-3 text-red-600 group-hover:scale-125 transition-transform" />
                          </button>
                          <Input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                            className="w-16 text-center font-bold bg-white/60 border-white/40"
                            inputSize="sm"
                          />
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="p-2 h-8 w-8 rounded-lg bg-white/60 hover:bg-white/80 border border-white/40 transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center group"
                          >
                            <Plus className="w-3 h-3 text-green-600 group-hover:scale-125 transition-transform" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatCurrency(total)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View - No Horizontal Scroll */}
          <div className="md:hidden space-y-3">
            {hardwareItems.map((item, index) => {
              const cost = getItemCost(item, user?.role || 'user');
              const total = cost * item.quantity;

              return (
                <div 
                  key={item.id}
                  className="bg-white/60 rounded-lg p-3 border border-white/40 hover:bg-white/80 transition-all duration-300"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Item Name and Badges */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-sm mb-1">{item.name}</div>
                      <div className="flex flex-wrap gap-1">
                        {item.isExtension && (
                          <Badge variant="info" className="text-xs">Extension</Badge>
                        )}
                        {item.isTemporary && (
                          <Badge variant="purple" className="text-xs">Temp</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cost, Quantity, Total - All Visible */}
                  <div className="grid grid-cols-3 gap-2 items-center">
                    {/* Cost */}
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Cost</div>
                      <div className="font-medium text-gray-800 text-sm">{formatCurrency(cost)}</div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Qty</div>
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 0}
                          className="p-1.5 h-7 w-7 rounded-lg bg-white hover:bg-gray-50 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center touch-manipulation"
                        >
                          <Minus className="w-3 h-3 text-red-600" />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="p-1.5 h-7 w-7 rounded-lg bg-white hover:bg-gray-50 border border-gray-300 transition-all active:scale-95 flex items-center justify-center touch-manipulation"
                        >
                          <Plus className="w-3 h-3 text-green-600" />
                        </button>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Total</div>
                      <div className="font-bold text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatCurrency(total)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Total Hardware Cost */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
        <div className="relative p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">
              Total Hardware Cost:
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
            <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {formatCurrency(totalHardwareCost)}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Add Temporary Item Form */}
      <GlassCard className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold">
                <GradientText gradient="blue-purple">
                  Add Custom Hardware Item
                </GradientText>
              </h3>
            </div>
            <MagneticButton
              variant={showAddForm ? 'outline' : 'primary'}
              size="md"
              onClick={() => setShowAddForm(!showAddForm)}
              glow={!showAddForm}
            >
              {showAddForm ? 'Cancel' : 'Add Item'}
            </MagneticButton>
          </div>

          {showAddForm && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="p-4 bg-blue-50/50 backdrop-blur-sm rounded-xl border border-blue-200/50">
                <p className="text-sm text-gray-700 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>Add a custom hardware item for this calculation only. This item will not be saved for future calculations.</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FloatingInput
                  label="Item Name"
                  type="text"
                  placeholder="Enter item name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />

                <FloatingInput
                  label="Cost (R)"
                  type="number"
                  placeholder="Enter cost"
                  value={newItem.cost || ''}
                  onChange={(e) => setNewItem({ ...newItem, cost: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 cursor-pointer hover:bg-white/80 transition-all duration-200 group">
                  <input
                    type="checkbox"
                    checked={newItem.isExtension}
                    onChange={(e) => setNewItem({ ...newItem, isExtension: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Is Extension</span>
                </label>
                <label className="flex items-center space-x-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 cursor-pointer hover:bg-white/80 transition-all duration-200 group">
                  <input
                    type="checkbox"
                    checked={newItem.showOnProposal}
                    onChange={(e) => setNewItem({ ...newItem, showOnProposal: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Show on Proposal</span>
                </label>
              </div>

              <MagneticButton
                variant="primary"
                size="lg"
                onClick={handleAddTemporaryItem}
                glow
                className="w-full"
              >
                <Plus className="w-5 h-5" />
                <span>Add Hardware Item</span>
              </MagneticButton>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
});

export default HardwareSection; 