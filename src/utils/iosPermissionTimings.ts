
/**
 * iOS Permission Timing Configuration
 * 
 * Provides optimized timing configurations for different iOS versions
 * to improve the reliability of push notification permission requests.
 */

import { browserDetection } from './browserDetection';

/**
 * Timing configuration for iOS permission flow
 */
export interface TimingConfig {
  /** Delay before showing permission prompt (ms) */
  prePermissionDelay: number;
  /** Delay after service worker registration (ms) */
  postServiceWorkerDelay: number;
  /** Delay before requesting FCM token (ms) */
  tokenRequestDelay: number;
  /** Timeout for the entire permission flow (ms) */
  flowTimeout: number;
}

/**
 * Get optimal timing configuration based on iOS version
 * 
 * Different iOS versions have different timing requirements for the
 * push notification permission flow to work reliably.
 */
export const getTimingConfigForIOSVersion = (iosVersionStr: string): TimingConfig => {
  const iosVersion = parseFloat(iosVersionStr);
  
  // iOS 16.4-16.5 requires longer delays
  if (iosVersion >= 16.4 && iosVersion < 16.6) {
    return {
      prePermissionDelay: 500,
      postServiceWorkerDelay: 300,
      tokenRequestDelay: 600,
      flowTimeout: 20000
    };
  }
  // iOS 16.6+ has improved reliability
  else if (iosVersion >= 16.6) {
    return {
      prePermissionDelay: 300,
      postServiceWorkerDelay: 200,
      tokenRequestDelay: 400,
      flowTimeout: 15000
    };
  }
  
  // Default fallback config (conservative timings)
  return {
    prePermissionDelay: 500,
    postServiceWorkerDelay: 400,
    tokenRequestDelay: 600,
    flowTimeout: 20000
  };
};

/**
 * Get timing configuration for current iOS device
 * Returns null for non-iOS devices
 */
export const getCurrentDeviceTimingConfig = (): TimingConfig | null => {
  if (!browserDetection.isIOS()) {
    return null;
  }
  
  const iosVersionStr = String(browserDetection.getIOSVersion() || '0');
  return getTimingConfigForIOSVersion(iosVersionStr);
};

/**
 * Sleep utility that returns a promise that resolves after the specified time
 */
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));
