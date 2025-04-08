
import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { NotificationRecord, NotificationAction } from '@/types/notifications/notificationHistoryTypes';
import { NOTIFICATION_FEATURES } from '@/types/notifications/index';
import { 
  notificationHistoryReducer, 
  initialState, 
  cleanupByAge, 
  cleanupByCount 
} from './reducer';
import { NotificationHistoryContext } from './context';
import { 
  DEFAULT_CLEANUP_CONFIG, 
  NotificationCleanupConfig 
} from '@/types/notifications/serviceWorkerTypes';
import { serviceWorkerManager } from '@/services/notifications/ServiceWorkerManager';

interface NotificationHistoryProviderProps {
  children: React.ReactNode;
}

export const NotificationHistoryProvider: React.FC<NotificationHistoryProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationHistoryReducer, initialState);
  const [userId, setUserId] = useState<string | null>(null);
  const [cleanupConfig, setCleanupConfig] = useState<NotificationCleanupConfig>(DEFAULT_CLEANUP_CONFIG);

  // Get user ID and cleanup config from local storage
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
    
    // Load cleanup config from local storage
    const storedCleanupConfig = localStorage.getItem('notificationCleanupConfig');
    if (storedCleanupConfig) {
      try {
        const parsedConfig = JSON.parse(storedCleanupConfig);
        setCleanupConfig({
          ...DEFAULT_CLEANUP_CONFIG,
          ...parsedConfig
        });
      } catch (error) {
        console.error('Error parsing cleanup config:', error);
        setCleanupConfig(DEFAULT_CLEANUP_CONFIG);
      }
    }
  }, []);

  // Load notification history when user ID is available
  useEffect(() => {
    if (userId && NOTIFICATION_FEATURES.HISTORY_ENABLED) {
      loadHistory();
    }
  }, [userId, state.pagination.currentPage, state.pagination.pageSize]);
  
  // Schedule automated cleanup based on interval
  useEffect(() => {
    if (!userId || !cleanupConfig.enabled || !NOTIFICATION_FEATURES.HISTORY_ENABLED) return;
    
    const lastCleanup = cleanupConfig.lastCleanup || 0;
    const now = Date.now();
    const cleanupIntervalMs = cleanupConfig.cleanupInterval * 60 * 60 * 1000;
    
    // Check if cleanup is due
    if (now - lastCleanup > cleanupIntervalMs) {
      runAutomaticCleanup();
    }
    
    // Schedule next cleanup
    const nextCleanupTime = Math.max(0, cleanupIntervalMs - (now - lastCleanup));
    const cleanupTimer = setTimeout(() => runAutomaticCleanup(), nextCleanupTime);
    
    return () => clearTimeout(cleanupTimer);
  }, [userId, cleanupConfig, state.records.length]);

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
  
  // Run automatic cleanup based on configured rules
  const runAutomaticCleanup = async () => {
    if (!NOTIFICATION_FEATURES.HISTORY_ENABLED || !cleanupConfig.enabled) return;
    
    console.log('Running automatic notification cleanup');
    
    try {
      // Apply age-based cleanup
      const { keptRecords: afterAgeCleanup, removedRecords: removedByAge } = cleanupByAge(
        state.records,
        cleanupConfig.maxAge,
        cleanupConfig.highPriorityMaxAge,
        cleanupConfig.keepHighPriority
      );
      
      // Apply count-based cleanup to the remaining notifications
      const { keptRecords: finalRecords, removedRecords: removedByCount } = cleanupByCount(
        afterAgeCleanup,
        cleanupConfig.maxCount
      );
      
      // Combine removed IDs from both cleanups
      const removedIds = [
        ...removedByAge.map(n => n.id),
        ...removedByCount.map(n => n.id)
      ];
      
      if (removedIds.length > 0) {
        // Log cleanup stats
        console.log(`Cleaned up ${removedIds.length} notifications:`, {
          byAge: removedByAge.length,
          byCount: removedByCount.length
        });
        
        // Update state
        dispatch({ type: 'CLEANUP_NOTIFICATIONS', payload: { removedIds } });
        
        // In a future phase, we would persist this cleanup to Firebase
        
        // Update last cleanup timestamp
        const updatedConfig = {
          ...cleanupConfig,
          lastCleanup: Date.now()
        };
        
        setCleanupConfig(updatedConfig);
        localStorage.setItem('notificationCleanupConfig', JSON.stringify(updatedConfig));
        
        // Also inform service worker about the cleanup
        serviceWorkerManager.sendMessage({
          type: 'CLEANUP_NOTIFICATIONS', 
          payload: {
            cleanupOptions: {
              maxAge: cleanupConfig.maxAge,
              maxCount: cleanupConfig.maxCount
            }
          }
        });
      }
    } catch (error) {
      console.error('Error during automatic cleanup:', error);
    }
  };
  
  // Manual cleanup with options
  const cleanupNotifications = async (options: {
    maxAge?: number;
    maxCount?: number;
    keepHighPriority?: boolean;
    highPriorityMaxAge?: number;
  } = {}) => {
    if (!NOTIFICATION_FEATURES.HISTORY_ENABLED) return;
    
    const cleanupMaxAge = options.maxAge ?? cleanupConfig.maxAge;
    const cleanupMaxCount = options.maxCount ?? cleanupConfig.maxCount;
    const keepHighPriority = options.keepHighPriority ?? cleanupConfig.keepHighPriority;
    const highPriorityMaxAge = options.highPriorityMaxAge ?? cleanupConfig.highPriorityMaxAge;
    
    // Apply age-based cleanup
    const { keptRecords: afterAgeCleanup, removedRecords: removedByAge } = cleanupByAge(
      state.records,
      cleanupMaxAge,
      highPriorityMaxAge,
      keepHighPriority
    );
    
    // Apply count-based cleanup
    const { keptRecords: finalRecords, removedRecords: removedByCount } = cleanupByCount(
      afterAgeCleanup,
      cleanupMaxCount
    );
    
    // Combine removed IDs
    const removedIds = [
      ...removedByAge.map(n => n.id),
      ...removedByCount.map(n => n.id)
    ];
    
    if (removedIds.length > 0) {
      dispatch({ type: 'CLEANUP_NOTIFICATIONS', payload: { removedIds } });
      
      // In a future phase, we would persist this to Firebase
    }
    
    return {
      totalRemoved: removedIds.length,
      byAge: removedByAge.length,
      byCount: removedByCount.length
    };
  };
  
  // Update cleanup configuration
  const updateCleanupConfig = (newConfig: Partial<NotificationCleanupConfig>) => {
    const updatedConfig = {
      ...cleanupConfig,
      ...newConfig
    };
    
    setCleanupConfig(updatedConfig);
    localStorage.setItem('notificationCleanupConfig', JSON.stringify(updatedConfig));
    
    // Also inform service worker about the updated config
    serviceWorkerManager.updateCacheConfig({
      cleanupConfig: updatedConfig
    });
    
    return updatedConfig;
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
    setPageSize,
    cleanupConfig,
    updateCleanupConfig,
    cleanupNotifications,
    runAutomaticCleanup
  };

  return (
    <NotificationHistoryContext.Provider value={value}>
      {children}
    </NotificationHistoryContext.Provider>
  );
};
