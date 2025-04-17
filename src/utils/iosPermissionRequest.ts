/**
 * iOS Permission Request Utilities
 * 
 * Core permission request functionality for iOS devices
 */

import { browserDetection } from './browserDetection';
import { iosPushLogger } from './iosPushLogger';
import { iosPwaDetection } from './iosPwaDetection';
import { 
  PermissionFlowStep, 
  saveFlowState, 
  clearFlowState 
} from './iosPermissionFlowState';
import { sleep, timeout, getCurrentDeviceTimingConfig } from './iosPermissionTimings';
import { registerServiceWorker } from '../pwa-registration';
import { initializeFirebase, vapidKey } from '../services/notifications/firebase';
import { SERVICE_WORKER_CONFIG } from './serviceWorkerConfig';
import { PermissionRequestResult, PermissionErrorReason } from '@/types/notifications';
import { getToken } from 'firebase/messaging';
import { saveTokenToFirestore } from '../services/notifications/messaging';
import { checkIOSPushSupport } from './iosPermissionHelper';

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

// Export from iosPermissionHelper for convenience
export { checkIOSPushSupport } from './iosPermissionHelper';
