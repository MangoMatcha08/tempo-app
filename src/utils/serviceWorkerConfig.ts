
import { browserDetection } from './browserDetection';

/**
 * Centralized configuration for service worker
 * Ensures consistent settings across the application
 */
export const SERVICE_WORKER_CONFIG = {
  // Path to the service worker file
  path: '/firebase-messaging-sw.js',
  
  // Service worker scope (root for iOS)
  scope: '/',
  
  // Update check interval in milliseconds
  updateInterval: 30 * 60 * 1000, // 30 minutes
  
  // Registration options based on platform
  registrationOptions: {
    // iOS requires explicit scope setting
    iosOptions: { scope: '/' },
    
    // Default options for other platforms
    defaultOptions: {}
  },
  
  // Critical timing values in milliseconds
  timing: {
    // Maximum time to wait for registration
    registrationTimeout: 10000,
    
    // Delay after service worker activation
    activationDelay: 300,
    
    // Time to wait for control takeover
    controlTakeoverTimeout: 5000,
    
    // iOS-specific delays
    ios: {
      // Time to wait after service worker registration before requesting permission
      postRegistrationDelay: 500,
      
      // Time to wait after permission granted before requesting token
      postPermissionDelay: 600
    }
  },
  
  // iOS version-specific configurations
  iosVersionConfig: {
    // iOS 16.4-16.5 (first versions with push support)
    '16.4': {
      postRegistrationDelay: 800,
      postPermissionDelay: 1000,
      registrationRetries: 3
    },
    // iOS 16.6-16.7 (improved stability)
    '16.6': {
      postRegistrationDelay: 500,
      postPermissionDelay: 700,
      registrationRetries: 2
    },
    // iOS 17.0+ (best stability)
    '17.0': {
      postRegistrationDelay: 300,
      postPermissionDelay: 500,
      registrationRetries: 1
    }
  },

  // Add features section with configurable flags
  features: {
    useEnhancedImplementation: false,  // Default to false for safety
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
    return SERVICE_WORKER_CONFIG.registrationOptions.iosOptions;
  }
  return SERVICE_WORKER_CONFIG.registrationOptions.defaultOptions;
};

/**
 * Get timing configuration based on iOS version
 */
export const getIOSTimingConfig = () => {
  if (!browserDetection.isIOS()) {
    return null;
  }
  
  const iosVersion = browserDetection.getIOSVersion() || 0;
  
  // Find the appropriate version config
  if (iosVersion >= 17.0) {
    return SERVICE_WORKER_CONFIG.iosVersionConfig['17.0'];
  } else if (iosVersion >= 16.6) {
    return SERVICE_WORKER_CONFIG.iosVersionConfig['16.6'];
  } else if (iosVersion >= 16.4) {
    return SERVICE_WORKER_CONFIG.iosVersionConfig['16.4'];
  }
  
  // Fallback to default iOS timing
  return SERVICE_WORKER_CONFIG.timing.ios;
};
