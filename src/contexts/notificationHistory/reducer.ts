
import { 
  NotificationRecord,
  NotificationHistoryState,
  NotificationAction,
  PaginationState
} from '@/types/notifications/notificationHistoryTypes';

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 20;

// Actions for notification history reducer
export type NotificationHistoryAction = 
  | { type: 'LOAD_HISTORY_START' }
  | { type: 'LOAD_HISTORY_SUCCESS'; payload: { records: NotificationRecord[]; totalItems: number } }
  | { type: 'LOAD_HISTORY_ERROR'; payload: Error }
  | { type: 'ADD_NOTIFICATION'; payload: NotificationRecord }
  | { type: 'UPDATE_NOTIFICATION_STATUS'; payload: { id: string; status: string } }
  | { type: 'ADD_NOTIFICATION_ACTION'; payload: { id: string; action: { type: NotificationAction; timestamp: number } } }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number };

// Initial state for notification history
export const initialState: NotificationHistoryState = {
  records: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalItems: 0,
    totalPages: 1
  }
};

// Calculate total pages based on total items and page size
const calculateTotalPages = (totalItems: number, pageSize: number): number => {
  return Math.max(1, Math.ceil(totalItems / pageSize));
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
    case 'LOAD_HISTORY_SUCCESS': {
      const { records, totalItems } = action.payload;
      const totalPages = calculateTotalPages(totalItems, state.pagination.pageSize);
      
      return {
        ...state,
        records,
        loading: false,
        error: null,
        pagination: {
          ...state.pagination,
          totalItems,
          totalPages
        }
      };
    }
    case 'LOAD_HISTORY_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        records: [action.payload, ...state.records],
        pagination: {
          ...state.pagination,
          totalItems: state.pagination.totalItems + 1,
          totalPages: calculateTotalPages(state.pagination.totalItems + 1, state.pagination.pageSize)
        }
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
        records: [],
        pagination: {
          ...state.pagination,
          currentPage: 1,
          totalItems: 0,
          totalPages: 1
        }
      };
    case 'SET_PAGE':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          currentPage: Math.min(Math.max(1, action.payload), state.pagination.totalPages)
        }
      };
    case 'SET_PAGE_SIZE': {
      const newPageSize = action.payload;
      const newTotalPages = calculateTotalPages(state.pagination.totalItems, newPageSize);
      
      return {
        ...state,
        pagination: {
          ...state.pagination,
          pageSize: newPageSize,
          totalPages: newTotalPages,
          currentPage: Math.min(state.pagination.currentPage, newTotalPages)
        }
      };
    }
    default:
      return state;
  }
};

