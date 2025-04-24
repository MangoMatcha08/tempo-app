
/**
 * iOS Permission Flow State Management
 */

export enum PermissionFlowStep {
  INITIAL = 'initial',
  SERVICE_WORKER_REGISTERED = 'sw-registered',
  PERMISSION_REQUESTED = 'permission-requested',
  PERMISSION_GRANTED = 'permission-granted',
  TOKEN_REQUESTED = 'token-requested',
  COMPLETE = 'complete',
  ERROR = 'error'
}

interface FlowState {
  step: PermissionFlowStep;
  timestamp: number;
  data?: Record<string, any>;
}

const FLOW_STATE_KEY = 'ios-push-flow-state';
const FLOW_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function saveFlowState(
  step: PermissionFlowStep, 
  data?: Record<string, any>
): void {
  const state: FlowState = {
    step,
    timestamp: Date.now(),
    data
  };
  
  localStorage.setItem(FLOW_STATE_KEY, JSON.stringify(state));
}

export function getFlowState(): FlowState | null {
  const stored = localStorage.getItem(FLOW_STATE_KEY);
  if (!stored) return null;
  
  try {
    const state = JSON.parse(stored) as FlowState;
    
    // Check if flow state has expired
    if (Date.now() - state.timestamp > FLOW_TIMEOUT) {
      clearFlowState();
      return null;
    }
    
    return state;
  } catch {
    return null;
  }
}

export function clearFlowState(): void {
  localStorage.removeItem(FLOW_STATE_KEY);
}

export function shouldResumeFlow(): boolean {
  const state = getFlowState();
  if (!state) return false;
  
  return state.step !== PermissionFlowStep.COMPLETE && 
         state.step !== PermissionFlowStep.ERROR;
}
