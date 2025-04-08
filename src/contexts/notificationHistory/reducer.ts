
import { 
  NotificationRecord,
  NotificationHistoryState,
  NotificationAction
} from '@/types/notifications/notificationHistoryTypes';

// Actions for notification history reducer
export type NotificationHistoryAction = 
  | { type: 'LOAD_HISTORY_START' }
  | { type: 'LOAD_HISTORY_SUCCESS'; payload: NotificationRecord[] }
  | { type: 'LOAD_HISTORY_ERROR'; payload: Error }
  | { type: 'ADD_NOTIFICATION'; payload: NotificationRecord }
  | { type: 'UPDATE_NOTIFICATION_STATUS'; payload: { id: string; status: string } }
  | { type: 'ADD_NOTIFICATION_ACTION'; payload: { id: string; action: { type: NotificationAction; timestamp: number } } }
  | { type: 'CLEAR_HISTORY' };

// Initial state for notification history
export const initialState: NotificationHistoryState = {
  records: [],
  loading: false,
  error: null
};

// Reducer for notification history
export const notificationHistoryReducer = (
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
