import React, { useReducer, useCallback, useEffect, useState } from 'react';
import { NotificationHistoryContext } from './context';
import { reducer, initialState } from './reducer';
import { NotificationAction } from '@/types/notifications/notificationHistoryTypes';
import { 
  DEFAULT_CLEANUP_CONFIG, 
  NotificationCleanupConfig 
} from '@/types/notifications/serviceWorkerTypes';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';

const LOCAL_STORAGE_KEY = 'notification_history';
const CLEANUP_CONFIG_KEY = 'notification_cleanup_config';

export interface NotificationHistoryProviderProps {
  children: React.ReactNode;
}

export const NotificationHistoryProvider: React.FC<NotificationHistoryProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [cleanupConfig, setCleanupConfig] = useState<NotificationCleanupConfig>(DEFAULT_CLEANUP_CONFIG);
  const { flags } = useFeatureFlags();

  useEffect(() => {
    loadHistory();
    
    try {
      const storedConfig = localStorage.getItem(CLEANUP_CONFIG_KEY);
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        setCleanupConfig({
          ...DEFAULT_CLEANUP_CONFIG,
          ...parsedConfig
        });
      }
    } catch (error) {
      console.error('Error loading cleanup configuration:', error);
    }
  }, []);

  useEffect(() => {
    if (state.records.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.records));
      } catch (error) {
        console.error('Error saving notification history:', error);
      }
    }
  }, [state.records]);

  useEffect(() => {
    try {
      localStorage.setItem(CLEANUP_CONFIG_KEY, JSON.stringify(cleanupConfig));
    } catch (error) {
      console.error('Error saving cleanup configuration:', error);
    }
  }, [cleanupConfig]);
  
  const addNotification = useCallback((notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  }, []);

  const updateNotificationStatus = useCallback((id, status) => {
    dispatch({ type: 'UPDATE_STATUS', payload: { id, status } });
  }, []);

  const addNotificationAction = useCallback((id, action) => {
    dispatch({ type: 'ADD_ACTION', payload: { id, action } });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        dispatch({ type: 'LOAD_HISTORY', payload: parsedHistory });
      }
    } catch (error) {
      console.error('Error loading notification history:', error);
    }
  }, []);

  const setPage = useCallback((page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page });
  }, []);

  const setPageSize = useCallback((size: number) => {
    dispatch({ type: 'SET_PAGE_SIZE', payload: size });
  }, []);

  const updateCleanupConfig = useCallback((config: Partial<NotificationCleanupConfig>): NotificationCleanupConfig => {
    setCleanupConfig(prev => {
      const newConfig = { ...prev, ...config };
      return newConfig;
    });
    
    return cleanupConfig;
  }, [cleanupConfig]);

  const cleanupNotifications = useCallback(async (options?: {
    maxAge?: number;
    maxCount?: number;
    keepHighPriority?: boolean;
    highPriorityMaxAge?: number;
  }) => {
    const now = Date.now();
    const config = { ...cleanupConfig, ...options };
    
    if (!config.enabled && !options) {
      return { totalRemoved: 0, byAge: 0, byCount: 0 };
    }

    const maxAgeMs = (config.maxAge || 30) * 24 * 60 * 60 * 1000;
    const highPriorityMaxAgeMs = (config.highPriorityMaxAge || 90) * 24 * 60 * 60 * 1000;
    
    let byAge = 0;
    let removedIds: string[] = [];
    
    state.records.forEach(notification => {
      const age = now - notification.timestamp;
      const isHighPriority = notification.priority === 'high';
      
      if (isHighPriority && config.keepHighPriority) {
        if (age > highPriorityMaxAgeMs) {
          removedIds.push(notification.id);
          byAge++;
        }
      } else if (age > maxAgeMs) {
        removedIds.push(notification.id);
        byAge++;
      }
    });
    
    let remainingRecords = state.records.filter(
      record => !removedIds.includes(record.id)
    );
    
    let byCount = 0;
    if (remainingRecords.length > (config.maxCount || 200)) {
      remainingRecords.sort((a, b) => b.timestamp - a.timestamp);
      
      const toRemove = remainingRecords.slice(config.maxCount || 200);
      byCount = toRemove.length;
      
      removedIds = [...removedIds, ...toRemove.map(r => r.id)];
    }
    
    if (removedIds.length > 0) {
      dispatch({ 
        type: 'REMOVE_NOTIFICATIONS', 
        payload: { ids: removedIds } 
      });
    }
    
    if (removedIds.length > 0 || options) {
      updateCleanupConfig({
        lastCleanup: now
      });
    }
    
    return {
      totalRemoved: removedIds.length,
      byAge,
      byCount
    };
  }, [state.records, cleanupConfig, updateCleanupConfig]);

  const runAutomaticCleanup = useCallback(async () => {
    if (!flags.AUTO_CLEANUP || !cleanupConfig.enabled) {
      return;
    }
    
    const now = Date.now();
    const lastCleanup = cleanupConfig.lastCleanup || 0;
    const cleanupIntervalMs = (cleanupConfig.cleanupInterval || 24) * 60 * 60 * 1000;
    
    if (now - lastCleanup > cleanupIntervalMs) {
      console.log("Running automatic notification cleanup...");
      const result = await cleanupNotifications();
      console.log(`Cleanup complete: removed ${result.totalRemoved} notifications`);
    }
  }, [cleanupConfig, cleanupNotifications, flags.AUTO_CLEANUP]);
  
  const isFeatureEnabled = useCallback((featureName: string): boolean => {
    return flags[featureName as keyof typeof flags] ?? false;
  }, [flags]);

  return (
    <NotificationHistoryContext.Provider value={{
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
      runAutomaticCleanup,
      isFeatureEnabled
    }}>
      {children}
    </NotificationHistoryContext.Provider>
  );
};

export default NotificationHistoryProvider;
