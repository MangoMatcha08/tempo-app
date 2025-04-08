
import { useState, useEffect } from 'react';
import { useNotificationHistory } from '@/contexts/notificationHistory';
import { NotificationRecord, NotificationAction } from '@/types/notifications';

/**
 * Custom hook for displaying and interacting with notifications
 * 
 * @param options Configuration options for notification display
 * @returns Object containing notification data and interaction methods
 */
export const useNotificationDisplay = (options: {
  limit?: number;
  filter?: (notification: NotificationRecord) => boolean;
} = {}) => {
  const { limit = 50, filter } = options;
  const { 
    records,
    loading, 
    error,
    updateNotificationStatus,
    addNotificationAction,
    clearHistory: clearHistoryContext,
    pagination,
    setPage,
    setPageSize
  } = useNotificationHistory();
  
  const [filteredRecords, setFilteredRecords] = useState<NotificationRecord[]>([]);
  
  // Apply filters and limit to records
  useEffect(() => {
    let filtered = [...records];
    
    if (filter) {
      filtered = filtered.filter(filter);
    }
    
    // Sort by timestamp, newest first
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit if specified and pagination not needed
    if (limit && limit < filtered.length) {
      filtered = filtered.slice(0, limit);
    }
    
    setFilteredRecords(filtered);
  }, [records, limit, filter]);
  
  /**
   * Mark a notification as read
   * @param notificationId ID of the notification to mark as read
   */
  const markAsRead = (notificationId: string) => {
    updateNotificationStatus(notificationId, 'received');
  };
  
  /**
   * Handle a notification action
   * @param notificationId ID of the notification
   * @param action The action to perform
   */
  const handleAction = (notificationId: string, action: NotificationAction) => {
    addNotificationAction(notificationId, action);
    
    // Update status based on action
    if (action === 'view' || action === 'dismiss') {
      updateNotificationStatus(notificationId, action === 'view' ? 'clicked' : 'received');
    }
  };
  
  /**
   * Mark all notifications as read
   */
  const markAllAsRead = () => {
    filteredRecords.forEach(record => {
      if (record.status !== 'received' && record.status !== 'clicked') {
        updateNotificationStatus(record.id, 'received');
      }
    });
  };
  
  /**
   * Clear all notification history
   * Asks for confirmation before clearing
   */
  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear all notification history?")) {
      clearHistoryContext();
    }
  };
  
  return {
    notifications: filteredRecords,
    loading,
    error,
    markAsRead,
    handleAction,
    markAllAsRead,
    clearHistory,
    unreadCount: filteredRecords.filter(n => n.status !== 'received' && n.status !== 'clicked').length,
    pagination,
    setPage,
    setPageSize
  };
};

export default useNotificationDisplay;
