
import { createContext, useContext } from 'react';
import { NotificationHistoryState, NotificationAction } from '@/types/notifications/notificationHistoryTypes';
import { initialState } from './reducer';

// Context for notification history
export interface NotificationHistoryContextType extends NotificationHistoryState {
  addNotification: (notification: NotificationHistoryState['records'][0]) => void;
  updateNotificationStatus: (id: string, status: string) => void;
  addNotificationAction: (id: string, action: NotificationAction) => void;
  clearHistory: () => void;
  loadHistory: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export const NotificationHistoryContext = createContext<NotificationHistoryContextType>({
  ...initialState,
  addNotification: () => {},
  updateNotificationStatus: () => {},
  addNotificationAction: () => {},
  clearHistory: () => {},
  loadHistory: async () => {},
  setPage: () => {},
  setPageSize: () => {}
});

export const useNotificationHistory = () => useContext(NotificationHistoryContext);

