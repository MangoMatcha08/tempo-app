/**
 * iOS Permission Resume Utilities
 * 
 * Handles resumption of interrupted permission flows for iOS devices
 */

import { browserDetection } from './browserDetection';
import { iosPushLogger } from './iosPushLogger';
import { 
  PermissionFlowStep, 
  getFlowState, 
  clearFlowState, 
  shouldResumeFlow 
} from './iosPermissionFlowState';
import { requestIOSPushPermission } from './iosPermissionRequest';
import { PermissionRequestResult, PermissionErrorReason } from '@/types/notifications';

/**
 * Resume an interrupted permission flow
 * This handles cases where the user refreshed the page during the flow
 */
export async function resumePermissionFlow(): Promise<PermissionRequestResult> {
  try {
    // Check if there's a flow to resume
    if (!shouldResumeFlow()) {
      iosPushLogger.logPermissionStep('no-flow-to-resume', {});
      return { 
        granted: false, 
        reason: 'No flow to resume'
      };
    }
    
    // Get the current flow state
    const { step, data } = getFlowState();
    
    iosPushLogger.logPermissionStep('resuming-flow', {
      fromStep: step,
      data
    });
    
    // If we're in an error state, clear and restart
    if (step === PermissionFlowStep.ERROR) {
      clearFlowState();
      return requestIOSPushPermission();
    }
    
    // Check if permission is already granted
    if (Notification.permission === 'granted') {
      iosPushLogger.logPermissionStep('permission-already-granted', {});
      
      // If we were past the permission step, continue from there
      if (step >= PermissionFlowStep.PERMISSION_GRANTED) {
        // Continue with token request
        return requestIOSPushPermission();
      }
      
      // Otherwise update state and continue
      return requestIOSPushPermission();
    }
    
    // If we were in the middle of requesting permission
    if (step === PermissionFlowStep.PERMISSION_REQUESTED) {
      // Start over from service worker registration
      return requestIOSPushPermission();
    }
    
    // For other states, restart from the beginning
    return requestIOSPushPermission();
    
  } catch (error) {
    iosPushLogger.logPermissionStep('resume-flow-error', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Clear the flow state to avoid getting stuck
    clearFlowState();
    
    return {
      granted: false,
      error: error instanceof Error ? error : new Error('Error resuming permission flow'),
      reason: PermissionErrorReason.RESUME_FAILED
    };
  }
}
