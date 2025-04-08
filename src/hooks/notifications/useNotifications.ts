
/**
 * Unified Notifications Hook
 * 
 * This facade hook provides a single entry point for all notification functionality.
 * It combines specialized hooks into one unified API.
 * 
 * @module hooks/notifications/useNotifications
 */

import { useMemo } from 'react';
import { NotificationsAPI, NotificationDisplayOptions } from './types';
import { useNotificationState } from './useNotificationState';
import { useNotificationToast } from './useNotificationDisplay';
import { useNotificationActions } from './useNotificationActions';
import { useNotificationPermission } from './useNotificationPermission';
import { useNotificationSettings } from './useNotificationSettings';
import { useNotificationServices } from './useNotificationServices';
import { useNotificationFeatures } from './useNotificationFeatures';
import { useNotificationDisplay } from './useNotificationDisplay';

/**
 * Unified hook for all notification functionality
 * 
 * @param options Optional display options
 * @returns Complete notification API
 */
export function useNotifications(
  options: NotificationDisplayOptions = {}
): NotificationsAPI {
  // Get specialized functionality from individual hooks
  const state = useNotificationState();
  const display = useNotificationToast();
  const actions = useNotificationActions();
  const permission = useNotificationPermission();
  const settings = useNotificationSettings();
  const services = useNotificationServices();
  const features = useNotificationFeatures();
  
  // Use display hook with provided options
  const displayWithOptions = useNotificationDisplay(options, state);
  
  // Calculate unread count
  const unreadCount = displayWithOptions.unreadCount;
  
  // Combine all functionality into one unified API
  const api: NotificationsAPI = {
    // State
    ...state,
    
    // Display
    ...display,
    
    // Actions
    ...actions,
    
    // Permission
    ...permission,
    
    // Settings
    ...settings,
    
    // Services
    ...services,
    
    // Features
    ...features,
    
    // Additional properties from display options
    unreadCount
  };
  
  return api;
}

// Export everything for direct imports
export * from './types';
export * from './useNotificationState';
export * from './useNotificationDisplay';
export * from './useNotificationActions';
export * from './useNotificationPermission';
export * from './useNotificationSettings';
export * from './useNotificationServices';
export * from './useNotificationFeatures';

// Default export for convenience
export default useNotifications;
