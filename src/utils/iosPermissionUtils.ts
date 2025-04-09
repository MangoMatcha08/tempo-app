
import { browserDetection } from './browserDetection';
import { iosPushLogger } from './iosPushLogger';

/**
 * Request push permission specifically for iOS devices
 * This handles the special requirements for iOS 16.4+ web push
 */
export async function requestIOSPushPermission() {
  try {
    // Check if we're on iOS first
    if (!browserDetection.isIOS()) {
      return { granted: false, reason: 'Not an iOS device' };
    }
    
    // Log the attempt
    iosPushLogger.logPermissionEvent('ios-permission-request-start');
    
    // Check iOS version - Push requires 16.4 or higher
    const iosVersionString = browserDetection.getIOSVersion() || '0';
    const iosVersion = parseFloat(iosVersionString);
    
    if (iosVersion < 16.4) {
      iosPushLogger.logPermissionEvent('ios-version-too-low', { 
        version: iosVersionString 
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
      return { 
        granted: false, 
        reason: 'Push notifications on iOS require PWA mode',
        shouldPromptPwaInstall: true
      };
    }
    
    // Now we can proceed with the actual permission request
    iosPushLogger.logPermissionEvent('requesting-system-permission');
    
    // Request notification permission
    const permissionResult = await Notification.requestPermission();
    iosPushLogger.logPermissionEvent('system-permission-result', { 
      result: permissionResult 
    });
    
    if (permissionResult === 'granted') {
      // Permission granted, we'd normally register with FCM here
      // but that's handled elsewhere to avoid circular dependencies
      
      // For now, we just return success
      return { granted: true };
    } else {
      // Permission denied by user
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
    
    // Return error information
    return { 
      granted: false, 
      error: error instanceof Error ? error.message : String(error),
      reason: 'Error requesting permission'
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
  const iosVersionString = browserDetection.getIOSVersion() || '0';
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
