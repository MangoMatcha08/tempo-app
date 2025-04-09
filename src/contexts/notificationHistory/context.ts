
import { createContext, useContext } from 'react';
import { 
  NotificationRecord,
  NotificationAction,
  NotificationHistoryState,
} from '@/types/notifications/notificationHistoryTypes';
import { NotificationCleanupConfig } from '@/types/notifications/sharedTypes';
import { initialState } from './reducer';

// Context for notification history
export interface NotificationHistoryContextType extends NotificationHistoryState {
  addNotification: (notification: NotificationRecord) => void;
  updateNotificationStatus: (id: string, status: string) => void;
  addNotificationAction: (id: string, action: NotificationAction) => void;
  clearHistory: () => void;
  loadHistory: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  cleanupConfig: NotificationCleanupConfig;
  updateCleanupConfig: (config: Partial<NotificationCleanupConfig>) => NotificationCleanupConfig;
  cleanupNotifications: (options?: {
    maxAge?: number;
    maxCount?: number;
    keepHighPriority?: boolean;
    highPriorityMaxAge?: number;
  }) => Promise<{
    totalRemoved: number;
    byAge: number;
    byCount: number;
  }>;
  runAutomaticCleanup: () => Promise<void>;
  isFeatureEnabled: (featureName: string) => boolean;
}

export const NotificationHistoryContext = createContext<NotificationHistoryContextType>({
  ...initialState,
  addNotification: () => {},
  updateNotificationStatus: () => {},
  addNotificationAction: () => {},
  clearHistory: () => {},
  loadHistory: async () => {},
  setPage: () => {},
  setPageSize: () => {},
  cleanupConfig: {
    enabled: true,
    maxAgeDays: 30,
    maxCount: 200,
    excludeHighPriority: true,
    highPriorityMaxAgeDays: 90,
    cleanupInterval: 24
  },
  updateCleanupConfig: () => ({
    enabled: true,
    maxAgeDays: 30,
    maxCount: 200,
    excludeHighPriority: true,
    highPriorityMaxAgeDays: 90,
    cleanupInterval: 24
  }),
  cleanupNotifications: async () => ({ totalRemoved: 0, byAge: 0, byCount: 0 }),
  runAutomaticCleanup: async () => {},
  isFeatureEnabled: () => true
});

export const useNotificationHistory = () => useContext(NotificationHistoryContext);
