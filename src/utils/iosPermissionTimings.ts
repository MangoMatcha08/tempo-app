import { browserDetection } from './browserDetection';
import { sleep, withRetry, type RetryOptions } from './retryUtils';

/**
 * iOS Permission Timing Configuration
 * 
 * Provides optimized timing configurations for different iOS versions
 * to improve the reliability of push notification permission requests.
 */

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
  /** Additional polling interval for status checks (ms) */
  statusPollingInterval: number;
  /** Service worker registration retry delay (ms) */
  serviceWorkerRetryDelay: number;
  /** Delay after permission is granted before requesting token (ms) */
  postPermissionDelay: number;
  /** Maximum retries for service worker registration */
  registrationRetries: number;
}

/**
 * Get optimal timing configuration based on iOS version
 */
export const getTimingConfigForIOSVersion = (iosVersionStr: string): TimingConfig => {
  const iosVersion = parseFloat(iosVersionStr);
  
  // iOS 16.4-16.5 requires longer delays
  if (iosVersion >= 16.4 && iosVersion < 16.6) {
    return {
      prePermissionDelay: 500,
      postServiceWorkerDelay: 800,
      tokenRequestDelay: 1000,
      flowTimeout: 30000,
      statusPollingInterval: 3000,
      serviceWorkerRetryDelay: 800,
      postPermissionDelay: 1000,
      registrationRetries: 3
    };
  }
  
  // iOS 16.6+ has improved reliability
  if (iosVersion >= 16.6 && iosVersion < 17.0) {
    return {
      prePermissionDelay: 300,
      postServiceWorkerDelay: 500,
      tokenRequestDelay: 700,
      flowTimeout: 20000,
      statusPollingInterval: 2000,
      serviceWorkerRetryDelay: 500,
      postPermissionDelay: 700,
      registrationRetries: 2
    };
  }
  
  // iOS 17.0+ has further improvements
  if (iosVersion >= 17.0) {
    return {
      prePermissionDelay: 200,
      postServiceWorkerDelay: 300,
      tokenRequestDelay: 500,
      flowTimeout: 15000,
      statusPollingInterval: 1500,
      serviceWorkerRetryDelay: 400,
      postPermissionDelay: 500,
      registrationRetries: 1
    };
  }
  
  // Default fallback config for older versions (conservative timings)
  return {
    prePermissionDelay: 500,
    postServiceWorkerDelay: 800,
    tokenRequestDelay: 1000,
    flowTimeout: 30000,
    statusPollingInterval: 3000,
    serviceWorkerRetryDelay: 800,
    postPermissionDelay: 1000,
    registrationRetries: 3
  };
};

/**
 * Get timing configuration for current iOS device
 */
export const getCurrentDeviceTimingConfig = (): TimingConfig | null => {
  if (!browserDetection.isIOS()) {
    return null;
  }
  
  const iosVersionStr = String(browserDetection.getIOSVersion() || '0');
  return getTimingConfigForIOSVersion(iosVersionStr);
};

/**
 * Get retry strategy based on iOS version
 */
export const getRetryStrategy = (iosVersionStr: string): RetryOptions => {
  const iosVersion = parseFloat(iosVersionStr);
  
  // iOS 16.4-16.5 needs more retries with longer backoff
  if (iosVersion >= 16.4 && iosVersion < 16.6) {
    return {
      maxRetries: 3,
      baseDelayMs: 1000,
      backoffFactor: 1.5
    };
  }
  
  // iOS 16.6+ is more reliable
  if (iosVersion >= 16.6) {
    return {
      maxRetries: 2,
      baseDelayMs: 800,
      backoffFactor: 1.3
    };
  }
  
  // Default fallback
  return {
    maxRetries: 3,
    baseDelayMs: 1000,
    backoffFactor: 1.5
  };
};

// Re-export the timeout utility
export { timeout } from './retryUtils';
