'use client';

import { useState, useEffect } from 'react';

interface UseIsMobileReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Custom hook to detect device type based on viewport width
 * - Mobile: < 768px
 * - Tablet: 768px - 1024px
 * - Desktop: > 1024px
 */
export function useIsMobile(): UseIsMobileReturn {
  const [deviceType, setDeviceType] = useState<UseIsMobileReturn>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    // Define media queries
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1024px)');
    const desktopQuery = window.matchMedia('(min-width: 1025px)');

    // Handler to update device type
    const updateDeviceType = () => {
      setDeviceType({
        isMobile: mobileQuery.matches,
        isTablet: tabletQuery.matches,
        isDesktop: desktopQuery.matches,
      });
    };

    // Set initial value
    updateDeviceType();

    // Add listeners for viewport changes
    mobileQuery.addEventListener('change', updateDeviceType);
    tabletQuery.addEventListener('change', updateDeviceType);
    desktopQuery.addEventListener('change', updateDeviceType);

    // Cleanup listeners on unmount
    return () => {
      mobileQuery.removeEventListener('change', updateDeviceType);
      tabletQuery.removeEventListener('change', updateDeviceType);
      desktopQuery.removeEventListener('change', updateDeviceType);
    };
  }, []);

  return deviceType;
}
