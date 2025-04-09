import { PermissionRequestResult } from '@/types/notifications/permissionTypes';

/**
 * Notification permission interface
 */
export interface NotificationPermission {
  /** Whether notification permissions have been granted */
  permissionGranted: boolean;
  
  /** Whether notifications are supported in the current browser */
  isSupported: boolean;
  
  /** Whether a permission request is currently in progress */
  isRequesting?: boolean;
  
  /** Function to request notification permission */
  requestPermission: () => Promise<PermissionRequestResult>;
}

/**
 * Options for notification display
 */
export interface NotificationDisplayOptions {
  /** Maximum number of notifications to show */
  maxCount?: number;
  
  /** Whether to automatically close notifications */
  autoClose?: boolean;
  
  /** Duration before auto-closing notifications (in ms) */
  duration?: number;
  
  /** Whether to show notifications when the app is in the foreground */
  showInForeground?: boolean;
  
  /** iOS-specific display options */
  iOS?: {
    /** Whether to use native iOS notifications when in PWA mode */
    useNativeInPWA?: boolean;
    
    /** Whether to group notifications by type */
    groupByType?: boolean;
  };
}

/**
 * Complete notification API surface
 */
export interface NotificationsAPI extends NotificationPermission {
  // State properties
  unreadCount: number;
  
  // Methods from other hooks will be added here
  // (These will be implemented in Phase 3)
}
