
/**
 * iOS Permission Utilities
 * 
 * Specialized utilities for iOS push notification permission flow
 * 
 * This file now serves as the main entry point for iOS permission utilities
 * with the implementation split across multiple modules for better organization.
 */

// Re-export everything from the specialized modules
export { 
  requestIOSPushPermission 
} from './iosPermissionRequest';

export { 
  resumePermissionFlow 
} from './iosPermissionResume';

export { 
  checkIOSPushSupport, 
  checkBrowserCapabilities,
  recordPushTelemetry
} from './iosPermissionHelper';

