
import { useCallback } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNotificationHistory } from '@/contexts/notificationHistory';
import { useNotificationSettings } from '@/contexts/NotificationSettingsContext';
import { useNotificationPermission } from '@/contexts/NotificationPermissionContext';
import { useNotificationDisplay } from '@/hooks/useNotificationDisplay';
import { toast } from 'sonner';
import { 
  NotificationRecord, 
  NotificationDeliveryStatus,
  NotificationAction
} from '@/types/notifications/notificationHistoryTypes';
import { NotificationSettings } from '@/types/notifications/settingsTypes';
import { PermissionRequestResult } from '@/types/notifications/permissionTypes';
import { Reminder } from '@/types/reminderTypes';
import { sendTestNotification } from '@/services/notificationService';
import { ServiceWorkerMessage } from '@/types/notifications/serviceWorkerTypes';

/**
 * Unified notification handler interface
 * Consolidates functionality from various notification hooks and contexts
 */
export interface NotificationHandler {
  // Permission Management
  permissionGranted: boolean;
  isSupported: boolean;
  requestPermission: () => Promise<PermissionRequestResult>;
  
  // Settings Management
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  
  // Notification Display
  showNotification: (reminder: Reminder) => void;
  showToastNotification: (notification: NotificationRecord) => void;
  
  // Notification History Management
  notifications: NotificationRecord[];
  addNotification: (notification: NotificationRecord) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  handleAction: (notificationId: string, action: NotificationAction) => void;
  clearHistory: () => void;
  
  // Service Worker Interaction
  handleServiceWorkerMessage: (message: ServiceWorkerMessage) => void;
  
  // Testing
  sendTestNotification: (options: { type: "push" | "email"; email?: string; includeDeviceInfo?: boolean }) => Promise<any>;
  
  // Utility
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  
  // Pagination
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

/**
 * Unified hook for notification handling
 * Consolidates functionality from various notification hooks
 * @returns A unified API for notification operations
 */
export function useNotificationHandler(): NotificationHandler {
  // Get base functionality from contexts and hooks
  const { 
    showNotification: contextShowNotification, 
    handleServiceWorkerMessage 
  } = useNotifications();
  
  const {
    settings,
    updateSettings,
    resetToDefaults: resetSettingsToDefaults,
    loading: settingsLoading,
    error: settingsError
  } = useNotificationSettings();
  
  const {
    permissionGranted,
    isSupported,
    requestPermission
  } = useNotificationPermission();
  
  // Get notification display functionality
  const {
    notifications,
    markAsRead,
    handleAction,
    markAllAsRead,
    clearHistory,
    unreadCount,
    pagination,
    setPage,
    setPageSize,
    loading: displayLoading,
    error: displayError
  } = useNotificationDisplay();
  
  // Get direct access to history functions not exposed by display hook
  const {
    addNotification,
    updateNotificationStatus
  } = useNotificationHistory();

  /**
   * Show a toast notification with actions
   */
  const showToastNotification = useCallback((notification: NotificationRecord) => {
    // Mark notification as displayed
    updateNotificationStatus(notification.id, 'sent');
    
    // Display toast with Sonner
    toast(notification.title, {
      id: notification.id,
      description: notification.body,
      duration: 5000,
      action: {
        label: 'View',
        onClick: () => {
          // Handle action
          updateNotificationStatus(notification.id, 'clicked');
          
          // Navigate to reminder if ID exists
          if (notification.reminderId) {
            window.location.href = `/dashboard/reminders/${notification.reminderId}`;
          }
        }
      },
      onDismiss: () => {
        // Mark as received when dismissed
        updateNotificationStatus(notification.id, 'received');
      },
      onAutoClose: () => {
        // Mark as received when auto-closed
        updateNotificationStatus(notification.id, 'received');
      }
    });
  }, [updateNotificationStatus]);

  /**
   * Send a test notification (wrapper)
   * @param options Configuration options for the test notification
   */
  const sendTestNotificationWrapper = useCallback(async (options: { 
    type: "push" | "email"; 
    email?: string; 
    includeDeviceInfo?: boolean 
  }) => {
    try {
      return await sendTestNotification(options);
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }, []);

  // Determine overall loading and error state
  const loading = settingsLoading || displayLoading;
  const error = settingsError || displayError;

  // Return the consolidated API
  return {
    // Permission Management
    permissionGranted,
    isSupported,
    requestPermission,
    
    // Settings Management
    settings,
    updateSettings,
    resetToDefaults: resetSettingsToDefaults,
    
    // Notification Display
    showNotification: contextShowNotification,
    showToastNotification,
    
    // Notification History Management
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    handleAction,
    clearHistory,
    
    // Service Worker Interaction
    handleServiceWorkerMessage,
    
    // Testing
    sendTestNotification: sendTestNotificationWrapper,
    
    // Utility
    unreadCount,
    loading,
    error,
    
    // Pagination
    pagination,
    setPage,
    setPageSize
  };
}

export default useNotificationHandler;
