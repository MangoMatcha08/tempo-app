
/**
 * iOS Permission Utilities
 * 
 * Specialized utilities for iOS push notification permission flow
 */

import { browserDetection } from './browserDetection';
import { iosPushLogger } from './iosPushLogger';
import { iosPwaDetection } from './iosPwaDetection';
import { 
  PermissionFlowStep, 
  saveFlowState, 
  getFlowState, 
  clearFlowState, 
  shouldResumeFlow,
  isFlowStale
} from './iosPermissionFlowState';
import { sleep, timeout, getCurrentDeviceTimingConfig } from './iosPermissionTimings';
import { registerServiceWorker } from '../pwa-registration';
import { initializeFirebase, vapidKey } from '../services/notifications/firebase';
import { SERVICE_WORKER_CONFIG, getIOSTimingConfig } from './serviceWorkerConfig';
import { PermissionRequestResult, PermissionErrorReason } from '@/types/notifications';
import { getToken } from 'firebase/messaging';
import { saveTokenToFirestore } from '../services/notifications/messaging';

/**
 * Check if the current iOS device supports push notifications
 */
export const checkIOSPushSupport = (): { 
  supported: boolean; 
  reason?: string;
  currentVersion?: number;
  minimumVersion?: number;
} => {
  // Not iOS
  if (!browserDetection.isIOS()) {
    return { supported: false, reason: 'Not an iOS device' };
  }
  
  // Check version - iOS 16.4+ required
  const iosVersion = browserDetection.getIOSVersion();
  if (!iosVersion || iosVersion < 16.4) {
    return { 
      supported: false, 
      reason: 'iOS version too low',
      currentVersion: iosVersion,
      minimumVersion: 16.4
    };
  }
  
  // Must be installed as PWA
  if (!iosPwaDetection.isRunningAsPwa()) {
    return { supported: false, reason: 'Not running as PWA' };
  }
  
  // All checks passed
  return { supported: true };
};

/**
 * Request iOS push notification permission with optimized flow
 * This handles the complex sequence required for iOS
 */
export async function requestIOSPushPermission(): Promise<PermissionRequestResult> {
  try {
    // Check if iOS push is supported
    const support = checkIOSPushSupport();
    if (!support.supported) {
      iosPushLogger.logPermissionStep('ios-support-check-failed', { reason: support.reason });
      return { 
        granted: false, 
        reason: support.reason === 'iOS version too low' 
          ? PermissionErrorReason.IOS_VERSION_UNSUPPORTED 
          : PermissionErrorReason.NOT_PWA
      };
    }
    
    // Start the flow and save initial state
    iosPushLogger.logPermissionStep('flow-started', {});
    saveFlowState(PermissionFlowStep.INITIAL, {
      iosVersion: String(browserDetection.getIOSVersion())
    });
    
    // Get timing configuration for this iOS version
    const timingConfig = getCurrentDeviceTimingConfig();
    if (!timingConfig) {
      throw new Error('Failed to get timing configuration');
    }
    
    // Initialize Firebase first
    iosPushLogger.logPermissionStep('initializing-firebase', {});
    const { messaging } = await initializeFirebase();
    if (!messaging) {
      iosPushLogger.logPermissionStep('firebase-init-failed', {});
      saveFlowState(PermissionFlowStep.ERROR, {
        error: 'Firebase messaging initialization failed'
      });
      return { 
        granted: false, 
        error: new Error('Firebase messaging initialization failed'),
        reason: PermissionErrorReason.INITIALIZATION_FAILED
      };
    }
    
    // Register service worker with retries
    iosPushLogger.logPermissionStep('registering-service-worker', {});
    let serviceWorkerRegistration;
    try {
      serviceWorkerRegistration = await timeout(
        registerServiceWorker(),
        timingConfig.flowTimeout,
        'Service worker registration timed out'
      );
      
      if (!serviceWorkerRegistration) {
        throw new Error('Service worker registration failed');
      }
      
      iosPushLogger.logPermissionStep('service-worker-registered', {
        scope: serviceWorkerRegistration.scope
      });
      
      // Update flow state
      saveFlowState(PermissionFlowStep.SERVICE_WORKER_REGISTERED, {
        swScope: serviceWorkerRegistration.scope
      });
      
      // Wait after service worker registration (critical for iOS)
      await sleep(timingConfig.postServiceWorkerDelay);
      
    } catch (swError) {
      iosPushLogger.logPermissionStep('service-worker-failed', {
        error: swError instanceof Error ? swError.message : String(swError)
      });
      
      saveFlowState(PermissionFlowStep.ERROR, {
        error: swError instanceof Error ? swError.message : String(swError)
      });
      
      return {
        granted: false,
        error: swError instanceof Error ? swError : new Error('Service worker registration failed'),
        reason: PermissionErrorReason.SERVICE_WORKER_FAILED
      };
    }
    
    // Request notification permission
    iosPushLogger.logPermissionStep('requesting-permission', {
      currentPermission: Notification.permission
    });
    
    saveFlowState(PermissionFlowStep.PERMISSION_REQUESTED);
    
    // Small delay before permission request (helps on iOS)
    await sleep(timingConfig.prePermissionDelay);
    
    try {
      const permissionResult = await timeout(
        Notification.requestPermission(),
        timingConfig.flowTimeout,
        'Permission request timed out'
      );
      
      iosPushLogger.logPermissionStep('permission-response', {
        result: permissionResult
      });
      
      if (permissionResult !== 'granted') {
        saveFlowState(PermissionFlowStep.ERROR, {
          permissionResult
        });
        
        return {
          granted: false,
          reason: PermissionErrorReason.PERMISSION_DENIED
        };
      }
      
      // Permission granted, update state
      saveFlowState(PermissionFlowStep.PERMISSION_GRANTED);
      
      // Wait after permission is granted (critical for iOS)
      await sleep(timingConfig.postPermissionDelay);
      
    } catch (permError) {
      iosPushLogger.logPermissionStep('permission-request-error', {
        error: permError instanceof Error ? permError.message : String(permError)
      });
      
      saveFlowState(PermissionFlowStep.ERROR, {
        error: permError instanceof Error ? permError.message : String(permError)
      });
      
      return {
        granted: false,
        error: permError instanceof Error ? permError : new Error('Permission request failed'),
        reason: PermissionErrorReason.PERMISSION_REQUEST_FAILED
      };
    }
    
    // Request FCM token
    iosPushLogger.logPermissionStep('requesting-token', {});
    saveFlowState(PermissionFlowStep.TOKEN_REQUESTED);
    
    try {
      // Wait before token request (critical for iOS)
      await sleep(timingConfig.tokenRequestDelay);
      
      // Get token with explicit service worker registration
      const tokenOptions = {
        vapidKey,
        serviceWorkerRegistration
      };
      
      const token = await timeout(
        getToken(messaging, tokenOptions),
        timingConfig.flowTimeout,
        'FCM token request timed out'
      );
      
      if (!token) {
        throw new Error('Failed to get FCM token despite permission granted');
      }
      
      iosPushLogger.logPermissionStep('token-received', {
        tokenPreview: token.substring(0, 5) + '...'
      });
      
      // Save token to user's document in Firestore
      const userId = localStorage.getItem('userId') || 'anonymous';
      await saveTokenToFirestore(userId, token);
      
      // Flow complete
      saveFlowState(PermissionFlowStep.COMPLETE, {
        tokenReceived: true
      });
      
      return {
        granted: true,
        token
      };
      
    } catch (tokenError) {
      iosPushLogger.logPermissionStep('token-request-error', {
        error: tokenError instanceof Error ? tokenError.message : String(tokenError)
      });
      
      saveFlowState(PermissionFlowStep.ERROR, {
        error: tokenError instanceof Error ? tokenError.message : String(tokenError),
        stage: 'token-request'
      });
      
      return {
        granted: true, // Permission was granted, but token failed
        error: tokenError instanceof Error ? tokenError : new Error('Token request failed'),
        reason: PermissionErrorReason.TOKEN_REQUEST_FAILED
      };
    }
    
  } catch (error) {
    // Handle any unexpected errors
    iosPushLogger.logPermissionStep('unexpected-error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    saveFlowState(PermissionFlowStep.ERROR, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return {
      granted: false,
      error: error instanceof Error ? error : new Error('Unexpected error in permission flow'),
      reason: PermissionErrorReason.UNKNOWN_ERROR
    };
  }
}

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
      saveFlowState(PermissionFlowStep.PERMISSION_GRANTED);
      return requestIOSPushPermission();
    }
    
    // If we were in the middle of requesting permission
    if (step === PermissionFlowStep.PERMISSION_REQUESTED) {
      // Start over from service worker registration
      saveFlowState(PermissionFlowStep.INITIAL);
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

/**
 * Check if the browser has the required capabilities for push notifications
 */
export function checkBrowserCapabilities() {
  const capabilities = {
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    notification: 'Notification' in window,
    permissions: 'permissions' in navigator
  };
  
  const supported = capabilities.serviceWorker && 
                    capabilities.pushManager && 
                    capabilities.notification;
  
  return {
    supported,
    capabilities,
    isIOS: browserDetection.isIOS(),
    iosVersion: browserDetection.getIOSVersion(),
    isPWA: iosPwaDetection.isRunningAsPwa()
  };
}

/**
 * Record telemetry for iOS push notification events
 */
export function recordPushTelemetry(event: string, data: any = {}) {
  // Only record for iOS devices
  if (!browserDetection.isIOS()) return;
  
  try {
    // Get existing telemetry
    const telemetryKey = 'ios-push-telemetry';
    const existingDataStr = localStorage.getItem(telemetryKey);
    const existingData = existingDataStr ? JSON.parse(existingDataStr) : { events: [] };
    
    // Add new event with timestamp
    existingData.events.push({
      event,
      timestamp: Date.now(),
      data: {
        ...data,
        iosVersion: browserDetection.getIOSVersion(),
        isPWA: iosPwaDetection.isRunningAsPwa()
      }
    });
    
    // Limit number of events
    if (existingData.events.length > 100) {
      existingData.events = existingData.events.slice(-100);
    }
    
    // Save back to storage
    localStorage.setItem(telemetryKey, JSON.stringify(existingData));
  } catch (error) {
    console.error('Error recording push telemetry:', error);
  }
}
