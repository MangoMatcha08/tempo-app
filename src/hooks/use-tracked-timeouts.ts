
import { useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage timeouts with automatic cleanup on unmount
 * Prevents memory leaks and ensures callbacks only run when component is mounted
 */
export const useTrackedTimeouts = () => {
  // Track all active timeouts
  const timeoutsRef = useRef<number[]>([]);
  // Track component mounted state
  const isMountedRef = useRef(true);
  
  // Set up cleanup on mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      clearAllTimeouts();
    };
  }, []);
  
  // Clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);
  
  // Create a tracked timeout
  const createTimeout = useCallback((callback: () => void, delay: number): number => {
    const id = window.setTimeout(() => {
      // Remove from tracking list
      timeoutsRef.current = timeoutsRef.current.filter(tid => tid !== id);
      
      // Only execute if component still mounted
      if (isMountedRef.current) {
        callback();
      }
    }, delay);
    
    // Add to tracking list
    timeoutsRef.current.push(id);
    return id;
  }, []);
  
  // Clear a specific timeout
  const clearTrackedTimeout = useCallback((id: number) => {
    clearTimeout(id);
    timeoutsRef.current = timeoutsRef.current.filter(tid => tid !== id);
  }, []);
  
  return { 
    createTimeout, 
    clearTrackedTimeout, 
    clearAllTimeouts,
    isMounted: () => isMountedRef.current
  };
};
