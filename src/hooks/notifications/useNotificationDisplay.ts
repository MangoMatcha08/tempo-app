
/**
 * Notification Display Hook
 * 
 * Provides functions for displaying notifications to the user
 * using a standardized toast interface.
 * 
 * @module hooks/notifications/useNotificationDisplay
 */

import { useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { 
  NotificationDisplay, 
  NotificationDisplayOptions,
  ToastOptions,
  NotificationStateInterface
} from './types';
import { NotificationRecord, NotificationChannel, NotificationDeliveryStatus, NotificationAction } from '@/types/notifications';
import { Reminder } from '@/types/reminderTypes';
import { formatReminderForNotification, getPriorityToastVariant } from '@/utils/notificationUtils';
import { useNotificationState } from './useNotificationState';
import { useNotificationHistory } from '@/contexts/notificationHistory';
import { NOTIFICATION_FEATURES } from '@/types/notifications';
import { useFeature } from '@/contexts/FeatureFlagContext';

/**
 * Hook for filtered notification display
 * 
 * @param options Display options like limit and filters
 * @param state Optional notification state, if not provided will use internal state
 * @returns Filtered notifications and display functions
 */
export function useNotificationDisplay(
  options: NotificationDisplayOptions = {},
  state?: NotificationStateInterface
) {
  // Use provided state or get from context
  const notificationState = useNotificationState();
  const records = state?.records || notificationState.records;
  const loading = state?.loading || notificationState.loading;
  const error = state?.error || notificationState.error;
  const pagination = state?.pagination || notificationState.pagination;
  
  const { limit = 50, filter } = options;
  const { 
    updateNotificationStatus,
    addNotificationAction,
    clearHistory: clearHistoryContext,
    setPage,
    setPageSize
  } = useNotificationHistory();
  
  const [filteredRecords, setFilteredRecords] = useState<NotificationRecord[]>([]);
  
  // Feature flags
  const virtualizedListsEnabled = useFeature("VIRTUALIZED_LISTS");
  const paginatedLoading = useFeature("PAGINATED_LOADING");
  
  // Apply filters and limit to records
  useEffect(() => {
    let filtered = [...records];
    
    if (filter) {
      filtered = filtered.filter(filter);
    }
    
    // Sort by timestamp, newest first
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit if specified and pagination not needed
    if (limit && limit < filtered.length && !paginatedLoading) {
      filtered = filtered.slice(0, limit);
    }
    
    setFilteredRecords(filtered);
  }, [records, limit, filter, paginatedLoading]);
  
  /**
   * Mark a notification as read
   * @param notificationId ID of the notification to mark as read
   */
  const markAsRead = useCallback((notificationId: string) => {
    updateNotificationStatus(notificationId, 'received');
  }, [updateNotificationStatus]);
  
  /**
   * Handle a notification action
   * @param notificationId ID of the notification
   * @param action The action to perform
   */
  const handleAction = useCallback((notificationId: string, action: NotificationAction) => {
    addNotificationAction(notificationId, action);
    
    // Update status based on action
    if (action === 'view' || action === 'dismiss') {
      updateNotificationStatus(notificationId, action === 'view' ? 'clicked' : 'received');
    }
  }, [addNotificationAction, updateNotificationStatus]);
  
  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    filteredRecords.forEach(record => {
      if (record.status !== 'received' && record.status !== 'clicked') {
        updateNotificationStatus(record.id, 'received');
      }
    });
  }, [filteredRecords, updateNotificationStatus]);
  
  /**
   * Clear all notification history
   * Asks for confirmation before clearing
   */
  const clearHistory = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all notification history?")) {
      clearHistoryContext();
    }
  }, [clearHistoryContext]);
  
  // Count unread notifications
  const unreadCount = filteredRecords.filter(
    n => n.status !== 'received' && n.status !== 'clicked'
  ).length;
  
  return {
    notifications: filteredRecords,
    loading,
    error,
    markAsRead,
    handleAction,
    markAllAsRead,
    clearHistory,
    unreadCount,
    pagination,
    setPage,
    setPageSize,
    virtualizedListsEnabled
  };
}

/**
 * Hook for notification display functionality
 * 
 * Provides methods to display notifications through toasts
 * 
 * @returns Notification display functions
 */
export function useNotificationToast(): NotificationDisplay {
  const { toast: uiToast } = useToast();
  const { updateNotificationStatus } = useNotificationHistory();
  
  /**
   * Show a standardized toast notification
   * @param options Toast configuration options
   */
  const showToast = useCallback((options: ToastOptions) => {
    const { 
      title, 
      description, 
      type = 'default',
      duration = 5000,
      action,
      onDismiss,
      onAutoClose
    } = options;
    
    // For shadcn/ui toast
    uiToast({
      title,
      description,
      variant: type,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick
      } : undefined,
    });
    
    // For Sonner toast
    toast(title, {
      description,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick
      } : undefined,
      onDismiss,
      onAutoClose
    });
  }, [uiToast]);
  
  /**
   * Show notification based on reminder
   * @param reminder The reminder to show notification for
   */
  const showNotification = useCallback((reminder: Reminder) => {
    const formattedNotification = formatReminderForNotification(reminder);
    
    if (formattedNotification) {
      showToast({
        title: formattedNotification.title,
        description: formattedNotification.description,
        type: getPriorityToastVariant(reminder.priority),
        duration: 5000
      });
    }
  }, [showToast]);
  
  /**
   * Show a toast notification with actions
   * @param notification The notification record to display
   */
  const showToastNotification = useCallback((notification: NotificationRecord) => {
    // Mark notification as displayed
    updateNotificationStatus(notification.id, 'sent');
    
    // Display toast
    showToast({
      title: notification.title,
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
  }, [updateNotificationStatus, showToast]);
  
  return {
    showToast,
    showNotification,
    showToastNotification
  };
}
