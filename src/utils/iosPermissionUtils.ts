
import { browserDetection } from './browserDetection';
import { iosPushLogger } from './iosPushLogger';
import { PermissionRequestResult } from '@/types/notifications/permissionTypes';
import { sleep, getCurrentDeviceTimingConfig } from './iosPermissionTimings';
import { 
  PermissionFlowStep, 
  saveFlowState, 
  getFlowState, 
  clearFlowState, 
  shouldResumeFlow 
} from './iosPermissionFlowState';
import { setupIOSServiceWorker } from './iosServiceWorkerUtils';
import { initializeFirebase, messaging } from '@/services/notifications/firebase';
import { getToken } from 'firebase/messaging';
import { ensureFirebaseInitialized } from '@/lib/firebase';

/**
 * Request push permission specifically for iOS devices
 * This handles the special requirements for iOS 16.4+ web push
 */
export async function requestIOSPushPermission(): Promise<PermissionRequestResult> {
  // Check if we should resume a previous flow
  if (shouldResumeFlow()) {
    return resumePermissionFlow();
  }
  
  try {
    // Check if we're on iOS first
    if (!browserDetection.isIOS()) {
      return { granted: false, reason: 'Not an iOS device' };
    }
    
    // Start the permission flow and save initial state
    saveFlowState(PermissionFlowStep.INITIAL, {
      iosVersion: String(browserDetection.getIOSVersion() || '0'),
      startTime: Date.now()
    });
    
    // Log the attempt
    iosPushLogger.logPermissionEvent('ios-permission-request-start');
    
    // Check iOS version - Push requires 16.4 or higher
    const iosVersionString = String(browserDetection.getIOSVersion() || '0');
    const iosVersion = parseFloat(iosVersionString);
    
    if (iosVersion < 16.4) {
      iosPushLogger.logPermissionEvent('ios-version-too-low', { 
        version: iosVersionString 
      });
      
      saveFlowState(PermissionFlowStep.ERROR, {
        error: 'iOS version too low',
        iosVersion: iosVersionString
      });
      
      return { 
        granted: false, 
        reason: 'ios-version-unsupported',
        iosVersion: iosVersionString
      };
    }
    
    // Check if we're in PWA mode, which is required for iOS push
    const isPwa = browserDetection.isIOSPWA();
    if (!isPwa) {
      iosPushLogger.logPermissionEvent('not-in-pwa-mode');
      
      saveFlowState(PermissionFlowStep.ERROR, {
        error: 'Not in PWA mode'
      });
      
      return { 
        granted: false, 
        reason: 'pwa-required',
        shouldPromptPwaInstall: true
      };
    }
    
    // Get timing configuration for this iOS version
    const timingConfig = getCurrentDeviceTimingConfig();
    if (!timingConfig) {
      iosPushLogger.logPermissionEvent('timing-config-unavailable');
      return {
        granted: false,
        reason: 'configuration-error',
        error: new Error('Timing configuration unavailable for this device')
      };
    }
    
    // Register service worker with iOS-specific optimizations
    iosPushLogger.logPermissionEvent('registering-service-worker');
    const swResult = await setupIOSServiceWorker();
    
    if (!swResult.success) {
      saveFlowState(PermissionFlowStep.ERROR, {
        error: `Service worker registration failed: ${swResult.error}`
      });
      
      return {
        granted: false,
        reason: 'service-worker-failed',
        error: new Error(swResult.error || 'Unknown service worker error')
      };
    }
    
    // Service worker registered successfully
    saveFlowState(PermissionFlowStep.SERVICE_WORKER_REGISTERED, {
      swScope: swResult.registration?.scope,
      registrationTime: Date.now()
    });
    
    // Add critical delay after service worker registration
    await sleep(timingConfig.postServiceWorkerDelay || 300);
    
    // Now we can proceed with the actual permission request
    saveFlowState(PermissionFlowStep.PERMISSION_REQUESTED, {
      requestTime: Date.now()
    });
    iosPushLogger.logPermissionEvent('requesting-system-permission');
    
    // Request notification permission
    const permissionResult = await Notification.requestPermission();
    iosPushLogger.logPermissionEvent('system-permission-result', { 
      result: permissionResult 
    });
    
    if (permissionResult === 'granted') {
      // Permission granted
      saveFlowState(PermissionFlowStep.PERMISSION_GRANTED, {
        grantedTime: Date.now()
      });
      
      // Wait for Firebase to initialize
      try {
        await ensureFirebaseInitialized();
      } catch (fbError) {
        iosPushLogger.logPermissionEvent('firebase-init-error', {
          error: fbError instanceof Error ? fbError.message : String(fbError)
        });
        // Continue anyway, we'll try to get a token
      }
      
      // Add delay before token request
      await sleep(timingConfig.tokenRequestDelay || 400);
      
      // Request FCM token
      saveFlowState(PermissionFlowStep.TOKEN_REQUESTED, {
        tokenRequestTime: Date.now()
      });
      
      try {
        if (!messaging) {
          throw new Error('Firebase messaging not available');
        }
        
        // Request FCM token with the service worker
        const token = await getToken(messaging, { 
          vapidKey: process.env.VITE_VAPID_KEY,
          serviceWorkerRegistration: swResult.registration
        });
        
        // Flow complete with token
        saveFlowState(PermissionFlowStep.COMPLETE, {
          token: token ? `${token.substring(0, 5)}...` : null,
          completeTime: Date.now()
        });
        
        // Clear flow state as we've completed successfully
        setTimeout(() => clearFlowState(), 1000);
        
        return { 
          granted: true,
          token
        };
      } catch (tokenError) {
        saveFlowState(PermissionFlowStep.ERROR, {
          error: tokenError instanceof Error ? tokenError.message : String(tokenError),
          step: 'token-request',
          errorTime: Date.now()
        });
        
        return {
          granted: true,  // Permission was granted, but token request failed
          error: tokenError instanceof Error ? tokenError : new Error(String(tokenError)),
          reason: 'token-request-failed'
        };
      }
    } else {
      // Permission denied by user
      saveFlowState(PermissionFlowStep.ERROR, {
        error: `Permission ${permissionResult} by user`,
        errorTime: Date.now()
      });
      
      return { 
        granted: false, 
        reason: `permission-${permissionResult}` 
      };
    }
  } catch (error) {
    // Log any errors
    iosPushLogger.logPermissionEvent('ios-permission-error', {
      error: error instanceof Error ? error.message : String(error),
      errorTime: Date.now()
    });
    
    // Save error state
    saveFlowState(PermissionFlowStep.ERROR, {
      error: error instanceof Error ? error.message : String(error),
      errorTime: Date.now()
    });
    
    // Return error information
    return { 
      granted: false, 
      error: error instanceof Error ? error : new Error(String(error)),
      reason: 'permission-flow-error'
    };
  }
}

/**
 * Resume a permission flow that was interrupted
 */
export async function resumePermissionFlow(): Promise<PermissionRequestResult> {
  try {
    const { step, data } = getFlowState();
    
    iosPushLogger.logPermissionEvent('resuming-flow', {
      step,
      data: {
        ...data,
        resumeTime: Date.now()
      }
    });
    
    // Handle each potential step
    switch (step) {
      case PermissionFlowStep.SERVICE_WORKER_REGISTERED:
        // We registered the service worker but didn't request permission yet
        // Start from permission request
        return requestPermissionAfterServiceWorker();
        
      case PermissionFlowStep.PERMISSION_REQUESTED:
      case PermissionFlowStep.PERMISSION_GRANTED:
        // We already requested or were granted permission
        // Check the current permission status
        if (Notification.permission === 'granted') {
          // Permission was granted, continue with token request
          return requestFCMTokenAfterPermission();
        } else {
          // Permission was not granted, start over
          clearFlowState();
          return requestIOSPushPermission();
        }
        
      case PermissionFlowStep.TOKEN_REQUESTED:
        // We were in the process of requesting an FCM token
        return requestFCMTokenAfterPermission();
        
      case PermissionFlowStep.COMPLETE:
        // Flow was already completed successfully
        clearFlowState();
        return { granted: true };
        
      case PermissionFlowStep.ERROR:
      default:
        // There was an error or unknown state, start fresh
        clearFlowState();
        return requestIOSPushPermission();
    }
  } catch (error) {
    // Error in resuming flow, start fresh
    clearFlowState();
    iosPushLogger.logPermissionEvent('resume-flow-error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return { 
      granted: false,
      error: error instanceof Error ? error : new Error(String(error)),
      reason: 'resume-flow-failed'
    };
  }
}

// The rest of the helper functions remain mostly the same

/**
 * Helper function to request permission after service worker is registered
 */
async function requestPermissionAfterServiceWorker(): Promise<PermissionRequestResult> {
  try {
    // Get timing config
    const timingConfig = getCurrentDeviceTimingConfig();
    if (!timingConfig) {
      throw new Error('Timing configuration unavailable');
    }
    
    // Add delay before permission request
    await sleep(timingConfig.postServiceWorkerDelay || 300);
    
    // Request permission
    saveFlowState(PermissionFlowStep.PERMISSION_REQUESTED, {
      requestTime: Date.now()
    });
    iosPushLogger.logPermissionEvent('resuming-permission-request');
    
    const permissionResult = await Notification.requestPermission();
    
    if (permissionResult === 'granted') {
      saveFlowState(PermissionFlowStep.PERMISSION_GRANTED, {
        grantedTime: Date.now()
      });
      return requestFCMTokenAfterPermission();
    } else {
      saveFlowState(PermissionFlowStep.ERROR, {
        error: `Permission ${permissionResult} by user`,
        errorTime: Date.now()
      });
      
      return { 
        granted: false, 
        reason: `permission-${permissionResult}` 
      };
    }
  } catch (error) {
    saveFlowState(PermissionFlowStep.ERROR, {
      error: error instanceof Error ? error.message : String(error),
      errorTime: Date.now()
    });
    
    return {
      granted: false,
      error: error instanceof Error ? error : new Error(String(error)),
      reason: 'permission-request-error'
    };
  }
}

/**
 * Helper function to request FCM token after permission is granted
 */
async function requestFCMTokenAfterPermission(): Promise<PermissionRequestResult> {
  try {
    // Wait for Firebase to initialize
    try {
      await ensureFirebaseInitialized();
    } catch (fbError) {
      iosPushLogger.logPermissionEvent('firebase-init-error', {
        error: fbError instanceof Error ? fbError.message : String(fbError)
      });
      // Continue anyway, we'll try to get a token
    }
    
    // Get timing config
    const timingConfig = getCurrentDeviceTimingConfig();
    if (!timingConfig) {
      throw new Error('Timing configuration unavailable');
    }
    
    await sleep(timingConfig.tokenRequestDelay || 400);
    
    // Request FCM token
    saveFlowState(PermissionFlowStep.TOKEN_REQUESTED, {
      tokenRequestTime: Date.now()
    });
    
    if (!messaging) {
      throw new Error('Firebase messaging not available');
    }
    
    const { step, data } = getFlowState();
    let swRegistration;
    
    // Get service worker registration
    if (data?.swScope) {
      swRegistration = await navigator.serviceWorker.getRegistration(data.swScope);
    }
    
    if (!swRegistration) {
      // Try to get any service worker registration
      swRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    }
    
    if (!swRegistration) {
      throw new Error('Service worker registration not found');
    }
    
    // Request FCM token
    const token = await getToken(messaging, {
      vapidKey: process.env.VITE_VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    });
    
    // Flow complete with token
    saveFlowState(PermissionFlowStep.COMPLETE, {
      token: token ? `${token.substring(0, 5)}...` : null,
      completeTime: Date.now()
    });
    
    // Clear flow state as we've completed successfully
    setTimeout(() => clearFlowState(), 1000);
    
    return { 
      granted: true,
      token
    };
  } catch (tokenError) {
    saveFlowState(PermissionFlowStep.ERROR, {
      error: tokenError instanceof Error ? tokenError.message : String(tokenError),
      step: 'token-request',
      errorTime: Date.now()
    });
    
    return {
      granted: true,  // Permission was granted, but token request failed
      error: tokenError instanceof Error ? tokenError : new Error(String(tokenError)),
      reason: 'token-request-error'
    };
  }
}

/**
 * Check if the current iOS environment supports push notifications
 */
export function checkIOSPushSupport() {
  // We're not on iOS
  if (!browserDetection.isIOS()) {
    return { 
      supported: false,
      reason: 'Not an iOS device'
    };
  }
  
  // Check iOS version
  const iosVersionString = String(browserDetection.getIOSVersion() || '0');
  const iosVersion = parseFloat(iosVersionString);
  
  // iOS 16.4+ is required for web push
  if (iosVersion < 16.4) {
    return { 
      supported: false,
      reason: 'iOS version too low',
      minimumVersion: '16.4',
      currentVersion: iosVersionString
    };
  }
  
  // Check if we're in a PWA
  if (!browserDetection.isIOSPWA()) {
    return {
      supported: false,
      reason: 'Not running as PWA',
      needsInstallation: true
    };
  }
  
  // Everything looks good
  return { supported: true };
}
