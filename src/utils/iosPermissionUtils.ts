
import { browserDetection } from './browserDetection';
import { iosPushLogger } from './iosPushLogger';
import { getToken, getMessaging } from 'firebase/messaging';
import { initializeFirebase, vapidKey } from '@/services/notifications/firebase';
import { PermissionRequestResult } from '@/types/notifications/permissionTypes';
import { setupIOSServiceWorker } from './iosServiceWorkerUtils';

/**
 * Request push notification permission on iOS devices
 * 
 * This function handles the iOS-specific flow for requesting push notification
 * permission, including checking iOS version compatibility, service worker
 * registration, and FCM token generation.
 * 
 * @returns PermissionRequestResult object with granted status and additional info
 */
export const requestIOSPushPermission = async (): Promise<PermissionRequestResult> => {
  // Must be called from a user gesture handler
  try {
    // First, check if this is an iOS device
    if (!browserDetection.isIOS()) {
      console.log('Not an iOS device, using standard permission flow');
      return { granted: false, reason: 'not-ios-device' };
    }
    
    // Check iOS version
    const iosVersion = parseFloat(browserDetection.getIOSVersion() || '0');
    if (iosVersion < 16.4) {
      iosPushLogger.logPermissionEvent('ios-version-unsupported', { iosVersion });
      return { 
        granted: false, 
        reason: 'ios-version-unsupported',
        error: new Error(`iOS version ${iosVersion} doesn't support web push notifications (16.4+ required)`)
      };
    }
    
    // Log the attempt
    iosPushLogger.logPermissionEvent('ios-request-start', { 
      iosVersion,
      isIOSSafari: browserDetection.isIOSSafari(),
      isPWA: browserDetection.isIOSPWA()
    });
    
    // Step 1: Setup service worker (cleaned up existing workers and registered new one)
    const swResult = await setupIOSServiceWorker();
    if (!swResult.success) {
      return { 
        granted: false, 
        reason: 'service-worker-failed',
        error: new Error(swResult.error) 
      };
    }
    
    // Step 2: Initialize Firebase if needed
    await initializeFirebase();
    
    // Step 3: Request permission from browser
    const permissionResult = await Notification.requestPermission();
    iosPushLogger.logPermissionEvent('browser-permission-result', { permissionResult });
    
    if (permissionResult !== 'granted') {
      return { granted: false, reason: 'user-denied' };
    }
    
    // Step 4: Get FCM token
    try {
      const messaging = getMessaging();
      
      // For iOS, we pass the service worker registration explicitly
      const tokenOptions = {
        vapidKey,
        serviceWorkerRegistration: swResult.registration
      };
      
      iosPushLogger.logPermissionEvent('requesting-token', { tokenOptions });
      
      const token = await getToken(messaging, tokenOptions);
      
      if (token) {
        iosPushLogger.logPermissionEvent('token-received', { 
          tokenPreview: token.substring(0, 5) + '...' + token.substring(token.length - 5) 
        });
        
        return { 
          granted: true, 
          token
        };
      } else {
        iosPushLogger.logPermissionEvent('token-empty');
        return { granted: false, reason: 'empty-token' };
      }
    } catch (fcmError) {
      console.error('FCM token error:', fcmError);
      iosPushLogger.logPermissionEvent('token-error', { 
        error: fcmError instanceof Error ? fcmError.message : String(fcmError) 
      });
      
      return { 
        granted: false, 
        reason: 'fcm-token-error',
        error: fcmError instanceof Error ? fcmError : new Error(String(fcmError))
      };
    }
  } catch (error) {
    console.error('Error in iOS permission flow:', error);
    iosPushLogger.logPermissionEvent('general-error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return { 
      granted: false, 
      reason: 'general-error',
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
};

/**
 * Check if the current environment supports iOS push notifications
 */
export const isIOSPushSupported = (): boolean => {
  // Must be iOS
  if (!browserDetection.isIOS()) {
    return false;
  }
  
  // Must be iOS 16.4+
  const iosVersion = parseFloat(browserDetection.getIOSVersion() || '0');
  if (iosVersion < 16.4) {
    return false;
  }
  
  // Must have service worker support
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  // Must have notification support
  if (!('Notification' in window)) {
    return false;
  }
  
  return true;
};

/**
 * Determine if the app should show iOS installation instructions
 */
export const shouldShowIOSInstallGuide = (): boolean => {
  // Only show on iOS Safari, not in PWA mode
  return browserDetection.isIOSSafari() && 
         !browserDetection.isIOSPWA() &&
         isIOSPushSupported();
};
