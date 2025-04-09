
/**
 * Notification State Management Hook
 * 
 * Handles the state of all notifications in the application
 */
import { useState, useCallback } from 'react';
import {
  NotificationRecord as BaseNotificationRecord,
  NotificationAction as BaseNotificationAction,
  NotificationDeliveryStatus,
  PaginationState
} from '@/types/notifications/notificationHistoryTypes';
import { 
  NotificationRecord,
  NotificationAction,
  PaginationInfo,
  NotificationStateOptions
} from './types';

/**
 * Hook for managing notification state
 */
export function useNotificationState(options: NotificationStateOptions = {}) {
  // Default options
  const {
    initialPage = 1,
    initialPageSize = 10,
    autoLoad = true
  } = options;

  // State for notifications
  const [records, setRecords] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: initialPage,
    pageSize: initialPageSize,
    totalPages: 1,
    totalItems: 0
  });

  // Add a notification to the state
  const addNotification = useCallback((notification: NotificationRecord) => {
    // Ensure the notification has required fields for compatibility
    const completeNotification = {
      ...notification,
      priority: notification.priority || 'normal',
    } as BaseNotificationRecord;
    
    setRecords(prev => [completeNotification, ...prev]);
  }, []);

  // Update notification status
  const updateNotificationStatus = useCallback((id: string, status: NotificationDeliveryStatus) => {
    setRecords(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, status } 
          : notification
      )
    );
  }, []);

  // Add an action to a notification
  const addNotificationAction = useCallback((id: string, action: NotificationAction) => {
    // Map our action type to the base type for compatibility
    let baseAction: BaseNotificationAction = action as BaseNotificationAction;
    
    // Handle special cases
    if (action === 'delete' || action === 'mark_read') {
      baseAction = 'dismiss';
    }
    
    setRecords(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { 
              ...notification, 
              actions: [
                ...(notification.actions || []), 
                { type: baseAction, timestamp: Date.now() }
              ]
            } 
          : notification
      )
    );
  }, []);

  // Clear notification history
  const clearHistory = useCallback(() => {
    setRecords([]);
  }, []);

  // Load notification history
  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      // In a real implementation, this would load from storage or API
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, []);

  // Set current page for pagination
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  }, []);

  // Set page size for pagination
  const setPageSize = useCallback((size: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: size
    }));
  }, []);

  return {
    records,
    loading,
    error,
    pagination,
    addNotification,
    updateNotificationStatus,
    addNotificationAction,
    clearHistory,
    loadHistory,
    setPage,
    setPageSize
  };
}

export default useNotificationState;
