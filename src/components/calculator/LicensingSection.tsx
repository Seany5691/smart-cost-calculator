'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { useCalculatorSections, useUpdateSectionItem, useAddTemporaryItem } from '@/store/calculator';
import { useAuthUser } from '@/store/auth';
import { formatCurrency, getItemCost, generateId } from '@/lib/utils';
import { Item } from '@/lib/types';
import { Plus, Minus, Key, Sparkles, CreditCard, Zap } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { GradientText, FloatingInput, MagneticButton, GlassCard } from '@/components/ui/modern';

interface LicensingSectionProps {
  onNext: () => void;
  onPrev: () => void;
}

const LicensingSection = memo(function LicensingSection({ onNext, onPrev }: LicensingSectionProps) {
  const sections = useCalculatorSections();
  const updateSectionItem = useUpdateSectionItem();
  const addTemporaryItem = useAddTemporaryItem();
  const user = useAuthUser();
  const [licensingItems, setLicensingItems] = useState<Item[]>([]);
  const [totalLicensingCost, setTotalLicensingCost] = useState(0);
  const [newItem, setNewItem] = useState({
    name: '',
    cost: 0,
    showOnProposal: true
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Load licensing items from store
  useEffect(() => {
    const licensingSection = sections.find((s: any) => s.id === 'licensing');
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
  const handleQuantityChange = useCallback((itemId: string, quantity: number) => {
    updateSectionItem('licensing', itemId, { quantity: Math.max(0, quantity) });
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

    // Add the item to the licensing section
    addTemporaryItem('licensing', tempItem);

    // Reset the form
    setNewItem({ name: '', cost: 0, showOnProposal: true });
    setShowAddForm(false);
  }, [addTemporaryItem, newItem]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header with Icon */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-lg animate-float">
          <Key className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2">
          <GradientText animated gradient="purple-pink">
            Licensing Selection
          </GradientText>
        </h2>
        <p className="text-gray-600 flex items-center justify-center space-x-2">
          <Sparkles className="w-4 h-4 text-pink-500" />
          <span>Select licensing items and quantities for this deal</span>
          <Sparkles className="w-4 h-4 text-pink-500" />
        </p>
      </div>

      {/* Licensing Items Table */}
      <GlassCard className="overflow-hidden" glow>
        <div className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/20">
                  <TableHead className="w-2/5 text-gray-700 font-bold">License</TableHead>
                  <TableHead className="w-1/5 text-right text-gray-700 font-bold">Monthly Cost</TableHead>
                  <TableHead className="w-1/5 text-center text-gray-700 font-bold">Quantity</TableHead>
                  <TableHead className="w-1/5 text-right text-gray-700 font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licensingItems.map((item, index) => {
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
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
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
                      <TableCell className="text-right font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {formatCurrency(total)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </GlassCard>

      {/* Total Licensing Cost */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10"></div>
        <div className="relative p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">
              Total Monthly Licensing Cost:
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
            <span className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
              {formatCurrency(totalLicensingCost)}
            </span>
            <span className="text-sm text-gray-500 font-medium">/month</span>
          </div>
        </div>
      </GlassCard>

      {/* Add Temporary License Form */}
      <GlassCard className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold">
                <GradientText gradient="purple-pink">
                  Add Custom License
                </GradientText>
              </h3>
            </div>
            <MagneticButton
              variant={showAddForm ? 'outline' : 'primary'}
              size="md"
              onClick={() => setShowAddForm(!showAddForm)}
              glow={!showAddForm}
            >
              {showAddForm ? 'Cancel' : 'Add License'}
            </MagneticButton>
          </div>

          {showAddForm && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="p-4 bg-purple-50/50 backdrop-blur-sm rounded-xl border border-purple-200/50">
                <p className="text-sm text-gray-700 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Add a custom license for this calculation only. This license will not be saved for future calculations.</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FloatingInput
                  label="License Name"
                  type="text"
                  placeholder="Enter license name"
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
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">Show on Proposal</span>
              </label>

              <MagneticButton
                variant="primary"
                size="lg"
                onClick={handleAddTemporaryItem}
                glow
                className="w-full"
              >
                <Plus className="w-5 h-5" />
                <span>Add License</span>
              </MagneticButton>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
});

export default LicensingSection; 