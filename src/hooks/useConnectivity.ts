
/**
 * Connectivity Hook
 * 
 * Monitors network connectivity status and provides reconnection events
 * Useful for triggering sync operations when connectivity is restored
 */

import { useState, useEffect, useCallback } from 'react';

type ConnectivityState = {
  online: boolean;
  type: string | null;  // "wifi", "cellular", etc.
  downlink: number | null;  // Connection speed in Mbps
  effectiveType: string | null;  // "slow-2g", "2g", "3g", "4g"
  lastChanged: number | null;
  reconnectedAt: number | null;
};

export function useConnectivity() {
  // State for tracking connectivity details
  const [connectivity, setConnectivity] = useState<ConnectivityState>({
    online: navigator.onLine,
    type: null,
    downlink: null,
    effectiveType: null,
    lastChanged: null,
    reconnectedAt: null
  });
  
  // Handler for when connection comes back online
  const handleOnline = useCallback(() => {
    const now = Date.now();
    setConnectivity(prev => ({
      ...prev,
      online: true,
      lastChanged: now,
      reconnectedAt: prev.online ? null : now
    }));
    
    updateConnectionInfo();
  }, []);
  
  // Handler for when connection goes offline
  const handleOffline = useCallback(() => {
    setConnectivity(prev => ({
      ...prev,
      online: false,
      lastChanged: Date.now(),
      reconnectedAt: null
    }));
  }, []);
  
  // Update network information if available
  const updateConnectionInfo = useCallback(() => {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      
      if (conn) {
        setConnectivity(prev => ({
          ...prev,
          type: conn.type || null,
          downlink: conn.downlink || null,
          effectiveType: conn.effectiveType || null
        }));
      }
    }
  }, []);
  
  // Initialize network info tracking
  useEffect(() => {
    // Set initial state
    updateConnectionInfo();
    
    // Add event listeners for online/offline status
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Add listener for connection changes if supported
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn && conn.addEventListener) {
        conn.addEventListener('change', updateConnectionInfo);
      }
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        if (conn && conn.removeEventListener) {
          conn.removeEventListener('change', updateConnectionInfo);
        }
      }
    };
  }, [handleOnline, handleOffline, updateConnectionInfo]);
  
  return connectivity;
}

export default useConnectivity;
