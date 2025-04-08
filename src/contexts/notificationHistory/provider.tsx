
import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { NotificationRecord, NotificationAction } from '@/types/notifications/notificationHistoryTypes';
import { NOTIFICATION_FEATURES } from '@/types/notifications/index';
import { notificationHistoryReducer, initialState } from './reducer';
import { NotificationHistoryContext } from './context';

interface NotificationHistoryProviderProps {
  children: React.ReactNode;
}

export const NotificationHistoryProvider: React.FC<NotificationHistoryProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationHistoryReducer, initialState);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from local storage
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Load notification history when user ID is available
  useEffect(() => {
    if (userId && NOTIFICATION_FEATURES.HISTORY_ENABLED) {
      loadHistory();
    }
  }, [userId, state.pagination.currentPage, state.pagination.pageSize]);

  // Load notification history
  const loadHistory = async () => {
    if (!userId || !NOTIFICATION_FEATURES.HISTORY_ENABLED) return;

    dispatch({ type: 'LOAD_HISTORY_START' });
    
    try {
      // This will be implemented in a future phase with actual Firebase integration
      // For now, we're just simulating paginated data
      
      // Simulate pagination in development by generating mock data
      const startIndex = (state.pagination.currentPage - 1) * state.pagination.pageSize;
      const endIndex = startIndex + state.pagination.pageSize;
      
      // In a real implementation, you'd fetch only the current page from Firebase
      // For now, we're simulating with either an empty array or mock data
      const mockRecords: NotificationRecord[] = [];
      const totalItems = mockRecords.length;
      
      dispatch({ 
        type: 'LOAD_HISTORY_SUCCESS', 
        payload: { 
          records: mockRecords.slice(startIndex, endIndex), 
          totalItems 
        }
      });
    } catch (error) {
      console.error('Error loading notification history:', error);
      dispatch({ 
        type: 'LOAD_HISTORY_ERROR', 
        payload: error instanceof Error ? error : new Error('Failed to load notification history') 
      });
    }
  };

  // Add a notification to history
  const addNotification = (notification: NotificationRecord) => {
    if (!NOTIFICATION_FEATURES.HISTORY_ENABLED) return;
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    
    // In a future phase, we would persist this to Firebase
  };

  // Update notification status
  const updateNotificationStatus = (id: string, status: string) => {
    if (!NOTIFICATION_FEATURES.HISTORY_ENABLED) return;
    dispatch({ type: 'UPDATE_NOTIFICATION_STATUS', payload: { id, status } });
    
    // In a future phase, we would persist this to Firebase
  };

  // Add action to notification
  const addNotificationAction = (id: string, actionType: NotificationAction) => {
    if (!NOTIFICATION_FEATURES.HISTORY_ENABLED) return;
    dispatch({ 
      type: 'ADD_NOTIFICATION_ACTION', 
      payload: { 
        id, 
        action: { 
          type: actionType, 
          timestamp: Date.now() 
        } 
      } 
    });
    
    // In a future phase, we would persist this to Firebase
  };

  // Clear notification history
  const clearHistory = () => {
    if (!NOTIFICATION_FEATURES.HISTORY_ENABLED) return;
    dispatch({ type: 'CLEAR_HISTORY' });
    
    // In a future phase, we would persist this to Firebase
  };

  // Set current page
  const setPage = useCallback((page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page });
  }, []);

  // Set page size
  const setPageSize = useCallback((size: number) => {
    dispatch({ type: 'SET_PAGE_SIZE', payload: size });
  }, []);

  const value = {
    ...state,
    addNotification,
    updateNotificationStatus,
    addNotificationAction,
    clearHistory,
    loadHistory,
    setPage,
    setPageSize
  };

  return (
    <NotificationHistoryContext.Provider value={value}>
      {children}
    </NotificationHistoryContext.Provider>
  );
};

