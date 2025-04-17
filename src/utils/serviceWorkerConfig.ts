
/**
 * Service Worker Configuration
 * 
 * Configuration for service worker behavior and timing
 */

import { browserDetection } from './browserDetection';

/**
 * Service worker registration configuration
 */
export const SERVICE_WORKER_CONFIG = {
  path: '/firebase-messaging-sw.js',
  scope: '/',
  // Restore updateInterval
  updateInterval: 30 * 60 * 1000, // 30 minutes
  timing: {
    // Add back general timing properties
    registrationTimeout: 15000,
    activationDelay: 300,
    controlTakeoverTimeout: 5000,
    ios: {
      postRegistrationDelay: 800,
      postPermissionDelay: 1000,
      registrationTimeout: 15000,
      registrationRetries: 3
    }
  },
  // Restore features property
  features: {
    useEnhancedImplementation: false,
    backgroundSync: true,
    notificationActions: true,
    offlineSupport: true
  }
};

/**
 * Get registration options based on current platform
 */
export const getRegistrationOptions = () => {
  if (browserDetection.isIOS()) {
    return { scope: SERVICE_WORKER_CONFIG.scope };
  }
  return {};
};

/**
 * Get timing configuration for iOS push notification flow
 */
export const getIOSTimingConfig = () => {
  if (!browserDetection.isIOS()) {
    return null;
  }

  const iosVersion = browserDetection.getIOSVersion() || 0;
  
  // iOS 16.4-16.5 requires longer delays
  if (iosVersion >= 16.4 && iosVersion < 16.6) {
    return {
      postRegistrationDelay: 800,
      postPermissionDelay: 1000,
      registrationTimeout: 15000,
      registrationRetries: 3
    };
  }
  
  // iOS 16.6+ has improved reliability
  if (iosVersion >= 16.6) {
    return {
      postRegistrationDelay: 500,
      postPermissionDelay: 700,
      registrationTimeout: 10000,
      registrationRetries: 2
    };
  }
  
  // Default fallback config
  return SERVICE_WORKER_CONFIG.timing.ios;
};
