/**
 * useAutoExport - Hook to automatically export results when scraping completes
 */

import { useEffect, useRef } from 'react';
import { Business, ScrapingStatus } from '@/lib/scraper/types';
import { exportService } from '@/lib/export/ExportService';

export function useAutoExport(
  status: ScrapingStatus,
  businesses: Business[],
  enabled: boolean = true
) {
  const previousStatusRef = useRef<ScrapingStatus>('idle');
  const hasExportedRef = useRef(false);

  useEffect(() => {
    // Check if scraping just completed
    const wasRunning = previousStatusRef.current === 'running';
    const isNowCompleted = status === 'completed' || status === 'stopped';
    
    if (enabled && wasRunning && isNowCompleted && !hasExportedRef.current && businesses.length > 0) {
      // Auto-export by town
      try {
        console.log('[AutoExport] Exporting businesses by town...');
        const filenames = exportService.exportByTown(businesses);
        
        console.log(`[AutoExport] ✅ Success! Exported ${filenames.length} file(s):`);
        filenames.forEach(f => console.log(`  - ${f}`));
        
        hasExportedRef.current = true;
      } catch (error) {
        console.error('[AutoExport] ❌ Error:', error);
      }
    }

    // Reset export flag when starting new scrape
    if (status === 'running' && previousStatusRef.current !== 'running') {
      hasExportedRef.current = false;
    }

    previousStatusRef.current = status;
  }, [status, businesses, enabled]);
}
