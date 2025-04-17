
/**
 * Permission Tracker Service
 * 
 * Manages persistent storage and tracking of notification permission state
 */

import { BrowserPermissionState, PermissionRequestResult } from '@/types/notifications/permissionTypes';
import { browserDetection } from '@/utils/browserDetection';
import { iosPushLogger } from '@/utils/iosPushLogger';

// Storage keys
const PERMISSION_STORAGE_KEY = 'notification-permission-state';
const REQUEST_HISTORY_KEY = 'notification-permission-history';
const DEBUG_MODE_KEY = 'notification-debug-mode';

// Maximum number of request history items to store
const MAX_HISTORY_ITEMS = 50;

/**
 * Permission request history item
 */
export interface PermissionRequestHistoryItem {
  timestamp: number;
  result: boolean;
  reason?: string;
  browserState?: BrowserPermissionState;
  token?: boolean;  // Just track if token was received, not the actual token
  userAgent: string;
  iosVersion?: string;
  isPWA?: boolean;
}

/**
 * Get current browser permission state with fallbacks
 */
export const getCurrentBrowserPermission = (): BrowserPermissionState => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  
  return Notification.permission as BrowserPermissionState;
};

/**
 * Save permission state to localStorage
 */
export const savePermissionState = (granted: boolean, browserState: BrowserPermissionState = 'default'): void => {
  try {
    localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify({
      granted,
      browserState,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    }));
  } catch (error) {
    console.error('Failed to save permission state:', error);
  }
};

/**
 * Get permission state from localStorage
 */
export const getPermissionState = (): { granted: boolean; browserState: BrowserPermissionState; timestamp?: number } => {
  try {
    const data = localStorage.getItem(PERMISSION_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to get permission state:', error);
  }
  
  // Default state if not found
  return { 
    granted: false, 
    browserState: getCurrentBrowserPermission()
  };
};

/**
 * Clear stored permission state
 */
export const clearPermissionState = (): void => {
  try {
    localStorage.removeItem(PERMISSION_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear permission state:', error);
  }
};

/**
 * Add permission request to history
 */
export const addRequestToHistory = (result: PermissionRequestResult): void => {
  try {
    // Get current history
    const history = getRequestHistory();
    
    // Create new history item
    const historyItem: PermissionRequestHistoryItem = {
      timestamp: Date.now(),
      result: result.granted,
      reason: result.reason,
      browserState: getCurrentBrowserPermission(),
      token: !!result.token,
      userAgent: navigator.userAgent,
      iosVersion: browserDetection.isIOS() ? String(browserDetection.getIOSVersion()) : undefined,
      isPWA: browserDetection.isIOSPWA()
    };
    
    // Add to beginning of history
    history.unshift(historyItem);
    
    // Limit size
    const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    
    // Save updated history
    localStorage.setItem(REQUEST_HISTORY_KEY, JSON.stringify(limitedHistory));
    
    // Log to debug logger if iOS
    if (browserDetection.isIOS()) {
      iosPushLogger.logPermissionEvent('permission-history-updated', {
        result: result.granted,
        reason: result.reason,
        token: !!result.token
      });
    }
  } catch (error) {
    console.error('Failed to add request to history:', error);
  }
};

/**
 * Get permission request history
 */
export const getRequestHistory = (): PermissionRequestHistoryItem[] => {
  try {
    const data = localStorage.getItem(REQUEST_HISTORY_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to get request history:', error);
  }
  
  return [];
};

/**
 * Clear request history
 */
export const clearRequestHistory = (): void => {
  try {
    localStorage.removeItem(REQUEST_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear request history:', error);
  }
};

/**
 * Set debug mode
 */
export const setDebugMode = (enabled: boolean): void => {
  try {
    localStorage.setItem(DEBUG_MODE_KEY, String(enabled));
    
    // Log mode change
    console.log(`Notification debug mode ${enabled ? 'enabled' : 'disabled'}`);
    
    if (browserDetection.isIOS()) {
      iosPushLogger.logPermissionEvent('debug-mode-changed', { enabled });
    }
  } catch (error) {
    console.error('Failed to set debug mode:', error);
  }
};

/**
 * Check if debug mode is enabled
 */
export const isDebugModeEnabled = (): boolean => {
  try {
    return localStorage.getItem(DEBUG_MODE_KEY) === 'true';
  } catch (error) {
    console.error('Failed to check debug mode:', error);
    return false;
  }
};

/**
 * Sync permission state with browser
 * Returns true if state was updated
 */
export const syncPermissionWithBrowser = (): boolean => {
  try {
    const currentPermission = getCurrentBrowserPermission();
    const storedState = getPermissionState();
    
    // Check if browser state matches stored state
    if (
      (currentPermission === 'granted' && !storedState.granted) ||
      (currentPermission !== 'granted' && storedState.granted) ||
      (currentPermission !== storedState.browserState)
    ) {
      // State needs to be updated
      const granted = currentPermission === 'granted';
      savePermissionState(granted, currentPermission);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to sync permission with browser:', error);
    return false;
  }
};

/**
 * Get comprehensive permission status
 */
export const getPermissionStatus = () => {
  const browserState = getCurrentBrowserPermission();
  const storedState = getPermissionState();
  const history = getRequestHistory();
  const lastRequest = history[0] || null;
  
  return {
    granted: browserState === 'granted',
    browserState,
    storedState,
    isStored: !!storedState.timestamp,
    isSupported: browserState !== 'unsupported',
    lastRequest,
    requestCount: history.length,
    syncRequired: storedState.browserState !== browserState
  };
};
