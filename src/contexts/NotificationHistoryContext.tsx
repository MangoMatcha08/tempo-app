import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { 
  NotificationRecord,
  NotificationHistoryState,
  NotificationAction
} from '@/types/notifications/notificationHistoryTypes';
import { NOTIFICATION_FEATURES } from '@/types/notifications/index';

// Actions for notification history reducer
type NotificationHistoryAction = 
  | { type: 'LOAD_HISTORY_START' }
  | { type: 'LOAD_HISTORY_SUCCESS'; payload: NotificationRecord[] }
  | { type: 'LOAD_HISTORY_ERROR'; payload: Error }
  | { type: 'ADD_NOTIFICATION'; payload: NotificationRecord }
  | { type: 'UPDATE_NOTIFICATION_STATUS'; payload: { id: string; status: string } }
  | { type: 'ADD_NOTIFICATION_ACTION'; payload: { id: string; action: { type: NotificationAction; timestamp: number } } }
  | { type: 'CLEAR_HISTORY' };

// Initial state for notification history
const initialState: NotificationHistoryState = {
  records: [],
  loading: false,
  error: null
};

// Reducer for notification history
const notificationHistoryReducer = (
  state: NotificationHistoryState,
  action: NotificationHistoryAction
): NotificationHistoryState => {
  switch (action.type) {
    case 'LOAD_HISTORY_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOAD_HISTORY_SUCCESS':
      return {
        ...state,
        records: action.payload,
        loading: false,
        error: null
      };
    case 'LOAD_HISTORY_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        records: [action.payload, ...state.records]
      };
    case 'UPDATE_NOTIFICATION_STATUS':
      return {
        ...state,
        records: state.records.map(record => 
          record.id === action.payload.id
            ? { ...record, status: action.payload.status as any }
            : record
        )
      };
    case 'ADD_NOTIFICATION_ACTION':
      return {
        ...state,
        records: state.records.map(record => 
          record.id === action.payload.id
            ? { 
                ...record, 
                actions: [...(record.actions || []), action.payload.action] 
              }
            : record
        )
      };
    case 'CLEAR_HISTORY':
      return {
        ...state,
        records: []
      };
    default:
      return state;
  }
};

// Context for notification history
interface NotificationHistoryContextType extends NotificationHistoryState {
  addNotification: (notification: NotificationRecord) => void;
  updateNotificationStatus: (id: string, status: string) => void;
  addNotificationAction: (id: string, action: NotificationAction) => void;
  clearHistory: () => void;
  loadHistory: () => Promise<void>;
}

const NotificationHistoryContext = createContext<NotificationHistoryContextType>({
  ...initialState,
  addNotification: () => {},
  updateNotificationStatus: () => {},
  addNotificationAction: () => {},
  clearHistory: () => {},
  loadHistory: async () => {},
});

export const useNotificationHistory = () => useContext(NotificationHistoryContext);

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
  }, [userId]);

  // Load notification history
  const loadHistory = async () => {
    if (!userId || !NOTIFICATION_FEATURES.HISTORY_ENABLED) return;

    dispatch({ type: 'LOAD_HISTORY_START' });
    
    try {
      // This will be implemented in a future phase with actual Firebase integration
      // For now, we're just returning an empty array
      const records: NotificationRecord[] = [];
      dispatch({ type: 'LOAD_HISTORY_SUCCESS', payload: records });
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

  const value: NotificationHistoryContextType = {
    ...state,
    addNotification,
    updateNotificationStatus,
    addNotificationAction,
    clearHistory,
    loadHistory
  };

  return (
    <NotificationHistoryContext.Provider value={value}>
      {children}
    </NotificationHistoryContext.Provider>
  );
};
