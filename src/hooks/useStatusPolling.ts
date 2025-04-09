
import { useReducer, useEffect, useCallback } from 'react';

// Status polling state interface
export interface StatusPollingState {
  lastUpdated: number;
  isPolling: boolean;
  pollCount: number;
  pollInterval: number;
  error: string | null;
  manualRefresh: boolean;
}

// Actions for the reducer
export type StatusPollingAction = 
  | { type: 'POLL_START' }
  | { type: 'POLL_SUCCESS' }
  | { type: 'POLL_FAILURE'; payload: string }
  | { type: 'MANUAL_REFRESH' }
  | { type: 'RESET_POLL_INTERVAL' }
  | { type: 'INCREASE_POLL_INTERVAL' };

// Initial state
const initialState: StatusPollingState = {
  lastUpdated: 0,
  isPolling: false,
  pollCount: 0,
  pollInterval: 5000, // Start with 5 seconds
  error: null,
  manualRefresh: false
};

// Reducer function for status polling state
function statusPollingReducer(state: StatusPollingState, action: StatusPollingAction): StatusPollingState {
  switch (action.type) {
    case 'POLL_START':
      return {
        ...state,
        isPolling: true,
        manualRefresh: false
      };
    case 'POLL_SUCCESS':
      return {
        ...state,
        lastUpdated: Date.now(),
        isPolling: false,
        pollCount: state.pollCount + 1,
        error: null
      };
    case 'POLL_FAILURE':
      return {
        ...state,
        isPolling: false,
        error: action.payload
      };
    case 'MANUAL_REFRESH':
      return {
        ...state,
        manualRefresh: true
      };
    case 'RESET_POLL_INTERVAL':
      return {
        ...state,
        pollInterval: 5000 // Reset to initial interval
      };
    case 'INCREASE_POLL_INTERVAL':
      // Exponential backoff - double the interval up to 2 minutes max
      return {
        ...state,
        pollInterval: Math.min(state.pollInterval * 2, 120000)
      };
    default:
      return state;
  }
}

/**
 * Hook for managing status polling with exponential backoff
 * @param pollFn Function to execute when polling
 * @param shouldPoll Boolean to determine if polling should occur
 * @param dependencies Array of dependencies that should trigger a poll when changed
 */
export const useStatusPolling = (
  pollFn: () => Promise<boolean>,
  shouldPoll: boolean = true,
  dependencies: any[] = []
) => {
  const [state, dispatch] = useReducer(statusPollingReducer, initialState);

  // Poll function with state management
  const poll = useCallback(async () => {
    if (state.isPolling) return;
    
    try {
      dispatch({ type: 'POLL_START' });
      
      const success = await pollFn();
      
      if (success) {
        dispatch({ type: 'RESET_POLL_INTERVAL' });
      } else {
        dispatch({ type: 'INCREASE_POLL_INTERVAL' });
      }
      
      dispatch({ type: 'POLL_SUCCESS' });
    } catch (error) {
      dispatch({ 
        type: 'POLL_FAILURE', 
        payload: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
      
      // Increase interval on error
      dispatch({ type: 'INCREASE_POLL_INTERVAL' });
    }
  }, [state.isPolling, pollFn]);
  
  // Manual refresh trigger
  const manualRefresh = useCallback(() => {
    dispatch({ type: 'MANUAL_REFRESH' });
    poll();
  }, [poll]);
  
  // Set up polling interval
  useEffect(() => {
    if (!shouldPoll) return;
    
    const timer = setTimeout(poll, state.pollInterval);
    
    return () => {
      clearTimeout(timer);
    };
  }, [poll, state.pollInterval, state.lastUpdated, shouldPoll, ...dependencies]);

  return {
    state,
    manualRefresh
  };
};

export default useStatusPolling;
