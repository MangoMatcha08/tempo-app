import { useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNotificationState } from './useNotificationState';
import { useNotificationActions } from './useNotificationActions';
import { 
  NotificationRecord, 
  NotificationAction,
  NotificationDisplayOptions,
  ToastOptions as InternalToastOptions
} from './types';
import { Reminder } from '@/types/reminderTypes';
import { NotificationDeliveryStatus } from '@/types/notifications/notificationHistoryTypes';
import { browserDetection } from '@/utils/browserDetection';
import { ToastActionElement } from "@/components/ui/toast";

// This function handles mapping between different toast variant systems
function mapToastVariant(variant: InternalToastOptions['variant'] = 'default'): "default" | "destructive" {
  // Map from our internal type to shadcn/ui type
  switch (variant) {
    case 'error':
      return 'destructive';
    case 'success':
    case 'warning':
    case 'info':
      return 'default';
    default:
      return variant as "default" | "destructive";
  }
}

/**
 * Hook for displaying notifications as toasts
 */
export function useNotificationToast() {
  const { toast } = useToast();
  
  // Show toast with proper variant mapping
  const showToast = useCallback(
    ({ variant = 'default', title, description, duration, action }) => {
      // Convert the action object to a ToastActionElement if it exists
      let toastAction: ToastActionElement | undefined = action;
      
      // Use toast with properly mapped variant
      toast({
        variant: mapToastVariant(variant as "default" | "destructive" | "success" | "error" | "warning" | "info"),
        title,
        description,
        duration,
        action: toastAction
      });
    },
    [toast]
  );
  
  // Show notification based on a reminder object
  const showNotification = useCallback((reminder: Reminder) => {
    // Format the reminder as a notification
    const title = reminder.title || 'Reminder';
    const description = reminder.description || '';
    
    // Show as toast
    showToast({
      title,
      description,
      duration: 5000,
      variant: reminder.priority === 'high' ? 'error' : 'default',
      action: undefined
    });
  }, [showToast]);
  
  // Show toast notification from a notification record
  const showToastNotification = useCallback((notification: NotificationRecord) => {
    // Map priority to variant
    let variant: "default" | "error" | "warning" = 'default';
    
    if (notification.priority === 'high') {
      variant = 'error';
    } else if (notification.priority === 'medium') {
      variant = 'warning';
    }
    
    // Show toast with mapped variant
    showToast({
      title: notification.title,
      description: notification.body,
      variant,
      duration: 5000,
      action: undefined
    });
  }, [showToast]);
  
  return {
    showToast,
    showNotification,
    showToastNotification
  };
}

/**
 * Hook for displaying notifications with filtering and pagination
 * 
 * @param options Display options
 * @param stateOverride Optional state override for testing
 */
export function useNotificationDisplay(
  options: NotificationDisplayOptions = {},
  stateOverride?: ReturnType<typeof useNotificationState>
) {
  // Get notification state and actions
  const state = stateOverride || useNotificationState();
  const actions = useNotificationActions();
  const toast = useNotificationToast();
  
  // Extract options with defaults
  const {
    maxCount = 100,
    limit,
    filter,
    iOS = {
      useNativeInPWA: true,
      groupByType: true
    }
  } = options;
  
  // Apply filters and limits to notifications
  const notifications = useMemo(() => {
    let filtered = state.records;
    
    // Apply custom filter if provided
    if (filter) {
      filtered = filtered.filter(filter);
    }
    
    // Apply limit if provided
    if (limit && limit > 0) {
      filtered = filtered.slice(0, limit);
    }
    
    return filtered;
  }, [state.records, filter, limit]);
  
  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => 
      n.status !== NotificationDeliveryStatus.RECEIVED && 
      n.status !== NotificationDeliveryStatus.CLICKED
    ).length;
  }, [notifications]);
  
  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    state.updateNotificationStatus(notificationId, NotificationDeliveryStatus.RECEIVED);
  }, [state]);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    notifications.forEach(notification => {
      if (notification.status !== NotificationDeliveryStatus.RECEIVED &&
          notification.status !== NotificationDeliveryStatus.CLICKED) {
        state.updateNotificationStatus(notification.id, NotificationDeliveryStatus.RECEIVED);
      }
    });
  }, [notifications, state]);
  
  // Handle notification action
  const handleAction = useCallback((
    notificationId: string, 
    action: NotificationAction
  ) => {
    // Cast the action to the correct type if needed
    const historyAction = action === 'view' || action === 'dismiss' 
      ? action 
      : (action === 'delete' || action === 'mark_read' ? 'dismiss' : action);
    
    // Add the action to the notification
    state.addNotificationAction(notificationId, historyAction);
    
    // Update status based on action
    if (action === 'view') {
      state.updateNotificationStatus(notificationId, NotificationDeliveryStatus.CLICKED);
    } else if (action === 'dismiss' || action === 'delete' || action === 'mark_read') {
      state.updateNotificationStatus(notificationId, NotificationDeliveryStatus.RECEIVED);
    }
    
    // If this is a view action, find the notification and handle navigation
    if (action === 'view') {
      const notification = notifications.find(n => n.id === notificationId);
      if (notification?.reminderId) {
        // In a real app, this would navigate to the reminder
        console.log(`Navigate to reminder: ${notification.reminderId}`);
      }
    }
  }, [notifications, state]);
  
  // Determine if virtualized lists should be used
  const virtualizedListsEnabled = useMemo(() => {
    // Use virtualization for large lists or on mobile devices
    const isMobile = browserDetection.isIOS() || /Android/i.test(navigator.userAgent);
    return notifications.length > 20 || isMobile;
  }, [notifications.length]);
  
  return {
    ...state,
    ...toast,
    ...actions,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    handleAction,
    virtualizedListsEnabled
  };
}

export default useNotificationDisplay;
