'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { useCalculatorSections, useUpdateSectionItem, useAddTemporaryItem } from '@/store/calculator';
import { useAuthUser } from '@/store/auth';
import { formatCurrency, getItemCost, generateId } from '@/lib/utils';
import { Item } from '@/lib/types';
import { Plus, Minus, Wifi, Sparkles, Radio, Zap } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { GradientText, FloatingInput, MagneticButton, GlassCard } from '@/components/ui/modern';

interface ConnectivitySectionProps {
  onNext: () => void;
  onPrev: () => void;
}

const ConnectivitySection = memo(function ConnectivitySection({ onNext, onPrev }: ConnectivitySectionProps) {
  const sections = useCalculatorSections();
  const updateSectionItem = useUpdateSectionItem();
  const addTemporaryItem = useAddTemporaryItem();
  const user = useAuthUser();
  const [connectivityItems, setConnectivityItems] = useState<Item[]>([]);
  const [totalConnectivityCost, setTotalConnectivityCost] = useState(0);
  const [newItem, setNewItem] = useState({
    name: '',
    cost: 0,
    showOnProposal: true
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Load connectivity items from store
  useEffect(() => {
    const connectivitySection = sections.find((s: any) => s.id === 'connectivity');
    if (connectivitySection) {
      setConnectivityItems(connectivitySection.items);
    }
  }, [sections]);

  // Calculate total connectivity cost
  useEffect(() => {
    const total = connectivityItems.reduce((sum, item) => {
      const cost = getItemCost(item, user?.role || 'user');
      return sum + (cost * item.quantity);
    }, 0);
    setTotalConnectivityCost(total);
  }, [connectivityItems, user?.role]);

  // Handle quantity change
  const handleQuantityChange = useCallback((itemId: string, quantity: number) => {
    updateSectionItem('connectivity', itemId, { quantity: Math.max(0, quantity) });
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
      showOnProposal: newItem.showOnProposal,
      isTemporary: true
    };

    // Add the item to the connectivity section
    addTemporaryItem('connectivity', tempItem);

    // Reset the form
    setNewItem({ name: '', cost: 0, showOnProposal: true });
    setShowAddForm(false);
  }, [addTemporaryItem, newItem]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header with Icon */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-4 shadow-lg animate-float">
          <Wifi className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2">
          <GradientText animated gradient="blue-purple">
            Connectivity Selection
          </GradientText>
        </h2>
        <p className="text-gray-600 flex items-center justify-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-500" />
          <span>Select connectivity services and quantities for this deal</span>
          <Sparkles className="w-4 h-4 text-cyan-500" />
        </p>
      </div>

      {/* Connectivity Items - Responsive Layout */}
      <GlassCard className="overflow-hidden" glow>
        <div className="p-4 md:p-6">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/20">
                  <TableHead className="w-2/5 text-gray-700 font-bold">Service</TableHead>
                  <TableHead className="w-1/5 text-right text-gray-700 font-bold">Monthly Cost</TableHead>
                  <TableHead className="w-1/5 text-center text-gray-700 font-bold">Quantity</TableHead>
                  <TableHead className="w-1/5 text-right text-gray-700 font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connectivityItems.map((item, index) => {
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
                          <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                          <span className="font-semibold text-gray-800">{item.name}</span>
                          <div className="flex space-x-1">
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
                        {formatCurrency(cost)}/mo
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
                      <TableCell className="text-right font-bold text-lg bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                        {formatCurrency(total)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View - No Horizontal Scroll */}
          <div className="md:hidden space-y-2">
            {connectivityItems.map((item, index) => {
              const cost = getItemCost(item, user?.role || 'user');
              const total = cost * item.quantity;

              return (
                <div 
                  key={item.id}
                  className="bg-white/60 rounded-lg p-2 border border-white/40 hover:bg-white/80 transition-all duration-300"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Service Name and Badges */}
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-sm mb-0.5">{item.name}</div>
                      <div className="flex flex-wrap gap-1">
                        {item.isTemporary && (
                          <Badge variant="purple" className="text-xs">Temp</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cost, Quantity, Total - All Visible */}
                  <div className="grid grid-cols-3 gap-2 items-center">
                    {/* Monthly Cost */}
                    <div className="text-center">
                      <div className="text-[10px] text-gray-600 mb-0.5">Cost/mo</div>
                      <div className="font-medium text-gray-800 text-xs">{formatCurrency(cost)}</div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="text-center">
                      <div className="text-[10px] text-gray-600 mb-0.5">Qty</div>
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 0}
                          className="p-0.5 h-6 w-6 rounded-md bg-white hover:bg-gray-50 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center touch-manipulation"
                        >
                          <Minus className="w-3 h-3 text-red-600" />
                        </button>
                        <span className="w-7 text-center font-bold text-gray-800 text-sm">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="p-0.5 h-6 w-6 rounded-md bg-white hover:bg-gray-50 border border-gray-300 transition-all active:scale-95 flex items-center justify-center touch-manipulation"
                        >
                          <Plus className="w-3 h-3 text-green-600" />
                        </button>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="text-center">
                      <div className="text-[10px] text-gray-600 mb-0.5">Total</div>
                      <div className="font-bold text-xs bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
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

      {/* Total Connectivity Cost */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10"></div>
        <div className="relative p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg flex-shrink-0">
              <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-base sm:text-xl font-bold text-gray-800 whitespace-nowrap">
              Total Monthly Cost:
            </span>
          </div>
          <div className="flex items-center space-x-2 ml-auto">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 animate-pulse flex-shrink-0" />
            <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
              {formatCurrency(totalConnectivityCost)}
            </span>
            <span className="text-xs sm:text-sm text-gray-500 font-medium">/mo</span>
          </div>
        </div>
      </GlassCard>

      {/* Add Temporary Service Form */}
      <GlassCard className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold">
                <GradientText gradient="blue-purple">
                  Add Custom Connectivity Service
                </GradientText>
              </h3>
            </div>
            <MagneticButton
              variant={showAddForm ? 'outline' : 'primary'}
              size="md"
              onClick={() => setShowAddForm(!showAddForm)}
              glow={!showAddForm}
            >
              {showAddForm ? 'Cancel' : 'Add Service'}
            </MagneticButton>
          </div>

          {showAddForm && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="p-4 bg-cyan-50/50 backdrop-blur-sm rounded-xl border border-cyan-200/50">
                <p className="text-sm text-gray-700 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  <span>Add a custom connectivity service for this calculation only. This service will not be saved for future calculations.</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FloatingInput
                  label="Service Name"
                  type="text"
                  placeholder="Enter service name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />

                <FloatingInput
                  label="Monthly Cost (R)"
                  type="number"
                  placeholder="Enter monthly cost"
                  value={newItem.cost || ''}
                  onChange={(e) => setNewItem({ ...newItem, cost: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <label className="flex items-center space-x-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 cursor-pointer hover:bg-white/80 transition-all duration-200 group">
                <input
                  type="checkbox"
                  checked={newItem.showOnProposal}
                  onChange={(e) => setNewItem({ ...newItem, showOnProposal: e.target.checked })}
                  className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-cyan-600 transition-colors">Show on Proposal</span>
              </label>

              <MagneticButton
                variant="primary"
                size="lg"
                onClick={handleAddTemporaryItem}
                glow
                className="w-full"
              >
                <Plus className="w-5 h-5" />
                <span>Add Connectivity Service</span>
              </MagneticButton>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
});

export default ConnectivitySection; 