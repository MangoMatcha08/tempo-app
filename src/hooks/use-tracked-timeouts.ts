
import { useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage timeouts and intervals with automatic cleanup on unmount
 * Prevents memory leaks and ensures callbacks only run when component is mounted
 */
export const useTrackedTimeouts = () => {
  // Track all active timeouts and intervals
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
  
  /**
   * Creates a tracked interval that is automatically cleaned up
   * 
   * @param callback Function to execute at each interval
   * @param delay Interval delay in milliseconds
   * @returns Interval ID
   */
  const createInterval = useCallback((callback: () => void, delay: number): number => {
    const id = window.setInterval(() => {
      // Only execute callback if component is still mounted
      if (isMountedRef.current) {
        callback();
      } else {
        // If component unmounted but interval somehow wasn't cleared,
        // clear it now
        clearInterval(id);
        timeoutsRef.current = timeoutsRef.current.filter(tid => tid !== id);
      }
    }, delay);
    
    // Add to tracking list for cleanup
    timeoutsRef.current.push(id);
    return id;
  }, []);
  
  /**
   * Safely executes a function only if the component is mounted
   * Useful for async operations that may complete after unmount
   * 
   * @param callback Function to execute only if mounted
   */
  const runIfMounted = useCallback((callback: () => void) => {
    if (isMountedRef.current) {
      callback();
    }
  }, []);
  
  return { 
    createTimeout, 
    clearTrackedTimeout, 
    clearAllTimeouts,
    createInterval,
    runIfMounted,
    isMounted: () => isMountedRef.current
  };
};
