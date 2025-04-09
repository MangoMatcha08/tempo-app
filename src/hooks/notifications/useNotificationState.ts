
/**
 * Notification State Management Hook
 * 
 * Manages the core state of notifications, including records, pagination,
 * and CRUD operations.
 * 
 * @module hooks/notifications/useNotificationState
 */

import { useCallback } from 'react';
import { useNotificationHistory } from '@/contexts/notificationHistory';
import { 
  NotificationState, 
  NotificationStateOptions,
  NotificationRecord,
  NotificationAction,
  NotificationDeliveryStatus
} from './types';

/**
 * Hook for managing notification state
 * 
 * @param options Configuration options
 * @returns Notification state and actions
 */
export function useNotificationState(options: NotificationStateOptions = {}): NotificationState {
  const history = useNotificationHistory();
  
  // Forward methods from context with appropriate typing
  const addNotification = useCallback((notification: NotificationRecord) => {
    history.addNotification(notification);
  }, [history]);
  
  const updateNotificationStatus = useCallback((id: string, status: NotificationDeliveryStatus) => {
    history.updateNotificationStatus(id, status as string);
  }, [history]);
  
  const addNotificationAction = useCallback((id: string, action: NotificationAction) => {
    history.addNotificationAction(id, action);
  }, [history]);
  
  const clearHistory = useCallback(() => {
    history.clearHistory();
  }, [history]);
  
  const loadHistory = useCallback(async () => {
    await history.loadHistory();
  }, [history]);
  
  const setPage = useCallback((page: number) => {
    history.setPage(page);
  }, [history]);
  
  const setPageSize = useCallback((size: number) => {
    history.setPageSize(size);
  }, [history]);

  // Return the combined state and actions
  return {
    // State
    records: history.records || [],
    loading: history.loading || false,
    error: history.error || null,
    pagination: history.pagination || {
      currentPage: 1,
      pageSize: 20,
      totalPages: 1,
      totalItems: 0
    },
    
    // Actions
    addNotification,
    updateNotificationStatus,
    addNotificationAction,
    clearHistory,
    loadHistory,
    setPage,
    setPageSize
  };
}
