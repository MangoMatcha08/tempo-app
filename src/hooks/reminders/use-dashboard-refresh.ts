
import { useCallback, useEffect, useRef } from "react";

// Constants for optimizing refresh
const INITIAL_REFRESH_DELAY = 800; // Slight delay for initial render
const BACKGROUND_REFRESH_INTERVAL = 60000; // 60 seconds between background refreshes

/**
 * Hook for managing dashboard refresh logic
 */
export function useDashboardRefresh(
  refreshFunction: () => Promise<void>,
  loading: boolean,
  hasError: boolean
) {
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Optimized background refresh with improved performance
  const performBackgroundRefresh = useCallback(async () => {
    if (!loading && !hasError) {
      try {
        await refreshFunction();
        return true; // Return true to indicate successful refresh
      } catch (error) {
        console.error("Background refresh error:", error);
        // Don't show an error toast for background refreshes
        return false; // Return false to indicate failed refresh
      }
    }
    return false; // Return false if conditions aren't met for refresh
  }, [refreshFunction, loading, hasError]);

  // Set up refresh timers
  useEffect(() => {
    // Initial refresh after component mounts with a delay
    // to prioritize UI rendering first
    refreshTimerRef.current = setTimeout(() => {
      performBackgroundRefresh();
    }, INITIAL_REFRESH_DELAY);
    
    // Set up interval for background refresh
    intervalRef.current = setInterval(() => {
      performBackgroundRefresh();
    }, BACKGROUND_REFRESH_INTERVAL);
    
    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [performBackgroundRefresh]);

  // Function to force an immediate refresh
  const forceRefresh = useCallback(async () => {
    return performBackgroundRefresh();
  }, [performBackgroundRefresh]);

  return {
    forceRefresh
  };
}
