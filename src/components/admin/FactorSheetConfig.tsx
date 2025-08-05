'use client';

import { useState, useEffect } from 'react';
import { useConfigStore } from '@/store/config';
import { FactorData } from '@/lib/types';
import { Save } from 'lucide-react';

export default function FactorSheetConfig() {
  const { factors, updateFactors } = useConfigStore();
  const [factorData, setFactorData] = useState<FactorData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setFactorData(factors);
  }, [factors]);

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      await updateFactors(factorData);
      setMessage({ type: 'success', text: 'Factor sheet saved successfully to Supabase!' });
    } catch (error) {
      console.error('Error saving factors config:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving to Supabase. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFactor = (term: string, escalation: string, range: string, value: number) => {
    setFactorData(prev => ({
      ...prev,
      [term]: {
        ...prev[term],
        [escalation]: {
          ...prev[term]?.[escalation],
          [range]: value
        }
      }
    }));
  };

  const terms = ['36_months', '48_months', '60_months'];
  const escalations = ['0%', '10%', '15%'];
  const ranges = ['0-20000', '20001-50000', '50001-100000', '100000+'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold gradient-text">Factor Sheet Configuration</h2>
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

      <div className="card">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold min-w-[120px]">Term</th>
                <th className="text-left py-3 px-4 font-semibold min-w-[100px]">Escalation</th>
                {ranges.map(range => (
                  <th key={range} className="text-left py-3 px-4 font-semibold min-w-[140px]">{range}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {terms.map(term => 
                escalations.map((escalation, escalationIndex) => (
                  <tr key={`${term}-${escalation}`} className="border-b border-gray-100 hover:bg-gray-50">
                    {escalationIndex === 0 && (
                      <td className="py-3 px-4 font-medium" rowSpan={escalations.length}>
                        {term.replace('_', ' ')}
                      </td>
                    )}
                    <td className="py-3 px-4 font-medium">{escalation}</td>
                    {ranges.map(range => (
                      <td key={range} className="py-3 px-4">
                        <input
                          type="number"
                          value={factorData[term]?.[escalation]?.[range] || 0}
                          onChange={(e) => updateFactor(term, escalation, range, parseFloat(e.target.value) || 0)}
                          className="input w-32 text-sm"
                          step="0.00001"
                          min="0"
                          placeholder="0.00000"
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Factor Sheet Information</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li><strong>Term:</strong> Contract duration in months</li>
          <li><strong>Escalation:</strong> Annual price increase percentage</li>
          <li><strong>Finance Range:</strong> Total finance amount range</li>
          <li><strong>Factor:</strong> Monthly rental rate multiplier (e.g., 0.03814 = 3.814% per month)</li>
          <li><strong>Changes are saved to Supabase:</strong> All updates are persisted across browsers</li>
        </ul>
      </div>
    </div>
  );
} 