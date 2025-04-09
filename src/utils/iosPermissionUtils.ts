
import { browserDetection } from './browserDetection';
import { iosPushLogger } from './iosPushLogger';
import { PermissionRequestResult } from '@/types/notifications';
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
      iosVersion: String(browserDetection.getIOSVersion() || '0')
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
        reason: 'iOS version must be 16.4 or higher for push notifications',
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
        reason: 'Push notifications on iOS require PWA mode',
        shouldPromptPwaInstall: true
      };
    }
    
    // Get timing configuration for this iOS version
    const timingConfig = getCurrentDeviceTimingConfig();
    
    // Register service worker with iOS-specific optimizations
    iosPushLogger.logPermissionEvent('registering-service-worker');
    const swResult = await setupIOSServiceWorker();
    
    if (!swResult.success) {
      saveFlowState(PermissionFlowStep.ERROR, {
        error: `Service worker registration failed: ${swResult.error}`
      });
      
      return {
        granted: false,
        reason: 'Service worker registration failed',
        error: swResult.error
      };
    }
    
    // Service worker registered successfully
    saveFlowState(PermissionFlowStep.SERVICE_WORKER_REGISTERED, {
      swScope: swResult.registration?.scope
    });
    
    // Add critical delay after service worker registration
    await sleep(timingConfig?.postServiceWorkerDelay || 300);
    
    // Now we can proceed with the actual permission request
    saveFlowState(PermissionFlowStep.PERMISSION_REQUESTED);
    iosPushLogger.logPermissionEvent('requesting-system-permission');
    
    // Request notification permission
    const permissionResult = await Notification.requestPermission();
    iosPushLogger.logPermissionEvent('system-permission-result', { 
      result: permissionResult 
    });
    
    if (permissionResult === 'granted') {
      // Permission granted
      saveFlowState(PermissionFlowStep.PERMISSION_GRANTED);
      
      // Wait for Firebase to initialize
      await ensureFirebaseInitialized();
      
      // Add delay before token request
      await sleep(timingConfig?.tokenRequestDelay || 400);
      
      // Request FCM token
      saveFlowState(PermissionFlowStep.TOKEN_REQUESTED);
      
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
          token: token ? `${token.substring(0, 5)}...` : null
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
          step: 'token-request'
        });
        
        return {
          granted: true,  // Permission was granted, but token request failed
          error: tokenError instanceof Error ? tokenError.message : String(tokenError),
          reason: 'Error requesting FCM token'
        };
      }
    } else {
      // Permission denied by user
      saveFlowState(PermissionFlowStep.ERROR, {
        error: `Permission ${permissionResult} by user`
      });
      
      return { 
        granted: false, 
        reason: `Permission ${permissionResult} by user` 
      };
    }
  } catch (error) {
    // Log any errors
    iosPushLogger.logPermissionEvent('ios-permission-error', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Save error state
    saveFlowState(PermissionFlowStep.ERROR, {
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Return error information
    return { 
      granted: false, 
      error: error instanceof Error ? error : String(error),
      reason: 'Error requesting permission'
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
        timings: data.timings // Include timing data for analysis
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
    return requestIOSPushPermission();
  }
}

/**
 * Helper function to request permission after service worker is registered
 */
async function requestPermissionAfterServiceWorker(): Promise<PermissionRequestResult> {
  try {
    // Get timing config
    const timingConfig = getCurrentDeviceTimingConfig();
    
    // Add delay before permission request
    await sleep(timingConfig?.postServiceWorkerDelay || 300);
    
    // Request permission
    saveFlowState(PermissionFlowStep.PERMISSION_REQUESTED);
    iosPushLogger.logPermissionEvent('resuming-permission-request');
    
    const permissionResult = await Notification.requestPermission();
    
    if (permissionResult === 'granted') {
      saveFlowState(PermissionFlowStep.PERMISSION_GRANTED);
      return requestFCMTokenAfterPermission();
    } else {
      saveFlowState(PermissionFlowStep.ERROR, {
        error: `Permission ${permissionResult} by user`
      });
      
      return { 
        granted: false, 
        reason: `Permission ${permissionResult} by user` 
      };
    }
  } catch (error) {
    saveFlowState(PermissionFlowStep.ERROR, {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      granted: false,
      error: error instanceof Error ? error : String(error),
      reason: 'Error resuming permission request'
    };
  }
}

/**
 * Helper function to request FCM token after permission is granted
 */
async function requestFCMTokenAfterPermission(): Promise<PermissionRequestResult> {
  try {
    // Wait for Firebase to initialize
    await ensureFirebaseInitialized();
    
    // Get timing config
    const timingConfig = getCurrentDeviceTimingConfig();
    await sleep(timingConfig?.tokenRequestDelay || 400);
    
    // Request FCM token
    saveFlowState(PermissionFlowStep.TOKEN_REQUESTED);
    
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
      token: token ? `${token.substring(0, 5)}...` : null
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
      step: 'token-request'
    });
    
    return {
      granted: true,  // Permission was granted, but token request failed
      error: tokenError instanceof Error ? tokenError : String(tokenError),
      reason: 'Error requesting FCM token'
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
