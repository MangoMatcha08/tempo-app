
/**
 * Permission Tracker Hook
 * 
 * Provides unified interface for notification permission tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getCurrentBrowserPermission,
  getPermissionState,
  savePermissionState,
  addRequestToHistory,
  getRequestHistory,
  clearRequestHistory,
  syncPermissionWithBrowser,
  getPermissionStatus,
  isDebugModeEnabled,
  setDebugMode
} from '@/services/notifications/permissionTracker';
import { useNotificationPermission } from '@/hooks/notifications/useNotificationPermission';
import { PermissionRequestResult, BrowserPermissionState } from '@/types/notifications/permissionTypes';
import { iosPushLogger } from '@/utils/iosPushLogger';

/**
 * Hook for tracking permission state and history
 */
export function usePermissionTracker() {
  const { requestPermission: baseRequestPermission, permissionGranted, isSupported } = useNotificationPermission();
  const [lastRequest, setLastRequest] = useState<PermissionRequestResult | null>(null);
  const [requestCount, setRequestCount] = useState<number>(0);
  const [debugMode, setDebugModeState] = useState<boolean>(isDebugModeEnabled());
  const [browserPermission, setBrowserPermission] = useState<BrowserPermissionState>(getCurrentBrowserPermission());
  
  // Sync browser permission on mount
  useEffect(() => {
    const syncPermission = () => {
      const wasUpdated = syncPermissionWithBrowser();
      const currentState = getCurrentBrowserPermission();
      setBrowserPermission(currentState);
      
      // Log sync if in debug mode
      if (debugMode && wasUpdated) {
        console.log('Permission state synced with browser:', currentState);
        iosPushLogger.logPermissionEvent('permission-sync', { 
          current: currentState,
          synced: wasUpdated
        });
      }
    };
    
    // Sync immediately
    syncPermission();
    
    // Set up interval for periodic checks
    const intervalId = setInterval(syncPermission, 60000); // Check every minute
    
    // Load request history count
    const history = getRequestHistory();
    setRequestCount(history.length);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [debugMode]);
  
  // Enhanced request permission that tracks history
  const requestPermission = useCallback(async (): Promise<PermissionRequestResult> => {
    try {
      // Request permission using the base hook
      const result = await baseRequestPermission();
      
      // Store result
      setLastRequest(result);
      
      // Save to history
      addRequestToHistory(result);
      
      // Update request count
      setRequestCount(prev => prev + 1);
      
      // Sync permission state
      const currentPermission = getCurrentBrowserPermission();
      setBrowserPermission(currentPermission);
      savePermissionState(result.granted, currentPermission);
      
      // Log detailed info in debug mode
      if (debugMode) {
        console.group('Permission Request Details');
        console.log('Result:', result);
        console.log('Browser Permission:', currentPermission);
        console.log('Timestamp:', new Date().toISOString());
        console.groupEnd();
        
        iosPushLogger.logPermissionEvent('tracked-permission-request', {
          result: result.granted,
          reason: result.reason,
          browserPermission: currentPermission
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error in tracked permission request:', error);
      
      const errorResult: PermissionRequestResult = {
        granted: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
      
      // Still track the error
      setLastRequest(errorResult);
      addRequestToHistory(errorResult);
      setRequestCount(prev => prev + 1);
      
      return errorResult;
    }
  }, [baseRequestPermission, debugMode]);
  
  // Get permission request history
  const getHistory = useCallback(() => {
    return getRequestHistory();
  }, []);
  
  // Clear history
  const clearHistory = useCallback(() => {
    clearRequestHistory();
    setRequestCount(0);
  }, []);
  
  // Toggle debug mode
  const toggleDebugMode = useCallback(() => {
    const newMode = !debugMode;
    setDebugMode(newMode);
    setDebugModeState(newMode);
    return newMode;
  }, [debugMode]);
  
  return {
    // Base permission state
    permissionGranted,
    isSupported,
    browserPermission,
    
    // Request with tracking
    requestPermission,
    lastRequest,
    
    // History and tracking
    requestCount,
    getHistory,
    clearHistory,
    
    // Debug features
    debugMode,
    toggleDebugMode,
    
    // Comprehensive status
    getStatus: getPermissionStatus
  };
}

export default usePermissionTracker;
