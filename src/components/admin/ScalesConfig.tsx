'use client';

import { useState, useEffect } from 'react';
import { useConfigStore } from '@/store/config';
import { Scales } from '@/lib/types';
import { Save } from 'lucide-react';

export default function ScalesConfig() {
  const { scales, updateScales } = useConfigStore();
  const [scalesData, setScalesData] = useState<Scales>({
    installation: {},
    finance_fee: {},
    gross_profit: {},
    additional_costs: { cost_per_kilometer: 0, cost_per_point: 0 }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setScalesData(scales);
  }, [scales]);

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      await updateScales(scalesData);
      setMessage({ type: 'success', text: 'Scales configuration saved successfully to Supabase!' });
    } catch (error) {
      console.error('Error saving scales config:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving to Supabase. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateInstallationBand = (band: string, value: number) => {
    setScalesData(prev => ({
      ...prev,
      installation: { ...prev.installation, [band]: value }
    }));
  };

  const updateFinanceFeeRange = (range: string, value: number) => {
    setScalesData(prev => ({
      ...prev,
      finance_fee: { ...prev.finance_fee, [range]: value }
    }));
  };

  const updateGrossProfitBand = (band: string, value: number) => {
    setScalesData(prev => ({
      ...prev,
      gross_profit: { ...prev.gross_profit, [band]: value }
    }));
  };

  const updateAdditionalCosts = (field: 'cost_per_kilometer' | 'cost_per_point', value: number) => {
    setScalesData(prev => ({
      ...prev,
      additional_costs: { ...prev.additional_costs, [field]: value }
    }));
  };

  const installationBands = ['0-4', '5-8', '9-16', '17-32', '33+'];
  const financeFeeRanges = ['0-20000', '20001-50000', '50001-100000', '100001+'];
  const grossProfitBands = ['0-4', '5-8', '9-16', '17-32', '33+'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold gradient-text">Scales Configuration</h2>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="btn btn-success flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{isLoading ? 'Saving to Supabase...' : 'Save Changes'}</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Installation Costs */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Installation Costs</h3>
          <div className="space-y-3">
            {installationBands.map(band => (
              <div key={band} className="flex justify-between items-center">
                <span className="font-medium">{band} extensions</span>
                <input
                  type="number"
                  value={scalesData.installation[band] || 0}
                  onChange={(e) => updateInstallationBand(band, parseFloat(e.target.value) || 0)}
                  className="input w-32"
                  step="0.01"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Finance Fees */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Finance Fees</h3>
          <div className="space-y-3">
            {financeFeeRanges.map(range => (
              <div key={range} className="flex justify-between items-center">
                <span className="font-medium">{range}</span>
                <input
                  type="number"
                  value={scalesData.finance_fee[range] || 0}
                  onChange={(e) => updateFinanceFeeRange(range, parseFloat(e.target.value) || 0)}
                  className="input w-32"
                  step="0.01"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Gross Profit */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Gross Profit</h3>
          <div className="space-y-3">
            {grossProfitBands.map(band => (
              <div key={band} className="flex justify-between items-center">
                <span className="font-medium">{band} extensions</span>
                <input
                  type="number"
                  value={scalesData.gross_profit[band] || 0}
                  onChange={(e) => updateGrossProfitBand(band, parseFloat(e.target.value) || 0)}
                  className="input w-32"
                  step="0.01"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Additional Costs */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Additional Costs</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Cost per kilometer</span>
              <input
                type="number"
                value={scalesData.additional_costs.cost_per_kilometer || 0}
                onChange={(e) => updateAdditionalCosts('cost_per_kilometer', parseFloat(e.target.value) || 0)}
                className="input w-32"
                step="0.01"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Cost per point</span>
              <input
                type="number"
                value={scalesData.additional_costs.cost_per_point || 0}
                onChange={(e) => updateAdditionalCosts('cost_per_point', parseFloat(e.target.value) || 0)}
                className="input w-32"
                step="0.01"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Scales Information</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li><strong>Installation Costs:</strong> Based on the number of extensions in the deal</li>
          <li><strong>Finance Fees:</strong> Based on the total finance amount</li>
          <li><strong>Gross Profit:</strong> Base profit based on the number of extensions</li>
          <li><strong>Additional Costs:</strong> Distance and point-based costs</li>
          <li><strong>Changes are saved to Supabase:</strong> All updates are persisted across browsers</li>
        </ul>
      </div>
    </div>
  );
} 