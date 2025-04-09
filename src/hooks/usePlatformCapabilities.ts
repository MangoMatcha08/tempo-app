
import { useState, useEffect, useCallback } from 'react';
import { 
  getPlatformCapabilities,
  resetCapabilitiesCache,
  PlatformCapabilities
} from '@/utils/platformCapabilities';

/**
 * Hook for accessing platform capabilities
 * Provides reactive access to platform features with refresh capability
 */
export function usePlatformCapabilities() {
  const [capabilities, setCapabilities] = useState<PlatformCapabilities>(
    getPlatformCapabilities()
  );
  
  const [lastChecked, setLastChecked] = useState<number>(Date.now());
  const [isChecking, setIsChecking] = useState<boolean>(false);
  
  // Refresh capabilities
  const refreshCapabilities = useCallback(async (forceReset: boolean = false) => {
    setIsChecking(true);
    
    try {
      // Reset cache if forced
      if (forceReset) {
        resetCapabilitiesCache();
      }
      
      // Small delay to ensure DOM is ready for queries
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Get fresh capabilities
      const freshCapabilities = getPlatformCapabilities();
      setCapabilities(freshCapabilities);
      setLastChecked(Date.now());
      
      return freshCapabilities;
    } catch (error) {
      console.error('Error refreshing platform capabilities:', error);
      return capabilities;
    } finally {
      setIsChecking(false);
    }
  }, [capabilities]);
  
  // Check once on mount
  useEffect(() => {
    // Don't refresh immediately on SSR
    if (typeof window !== 'undefined') {
      refreshCapabilities(false);
    }
  }, [refreshCapabilities]);
  
  // Listen for display mode changes (e.g. installing as PWA)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQueryList = window.matchMedia('(display-mode: standalone)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      // Display mode changed, refresh capabilities
      refreshCapabilities(true);
    };
    
    // Modern browsers
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
      return () => mediaQueryList.removeEventListener('change', handleChange);
    } 
    // Older browsers
    else if ('addListener' in mediaQueryList) {
      // @ts-ignore - older browsers support
      mediaQueryList.addListener(handleChange);
      return () => {
        // @ts-ignore - older browsers support
        mediaQueryList.removeListener(handleChange);
      };
    }
  }, [refreshCapabilities]);
  
  return {
    ...capabilities,
    lastChecked,
    isChecking,
    refreshCapabilities
  };
}

export default usePlatformCapabilities;
