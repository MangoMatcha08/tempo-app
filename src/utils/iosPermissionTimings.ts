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
 * Sleep utility that returns a promise that resolves after the specified time
 */
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Timeout utility that returns a promise that rejects after the specified time
 */
export const timeout = <T>(promise: Promise<T>, ms: number, errorMessage?: string): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage || `Operation timed out after ${ms}ms`)), ms);
  });
  
  return Promise.race([promise, timeoutPromise]);
};

/**
 * Get retry strategy based on iOS version
 */
export const getRetryStrategy = (iosVersionStr: string) => {
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

/**
 * Execute a function with exponential backoff retry
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    baseDelayMs?: number;
    backoffFactor?: number;
    retryPredicate?: (error: any, attempt: number) => boolean;
  }
): Promise<T> => {
  const iosVersionStr = String(browserDetection.getIOSVersion() || '0');
  const defaultStrategy = getRetryStrategy(iosVersionStr);
  
  const maxRetries = options?.maxRetries ?? defaultStrategy.maxRetries;
  const baseDelayMs = options?.baseDelayMs ?? defaultStrategy.baseDelayMs;
  const backoffFactor = options?.backoffFactor ?? defaultStrategy.backoffFactor;
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Log retry attempt
      if (attempt > 0) {
        const delayMs = baseDelayMs * Math.pow(backoffFactor, attempt - 1);
        iosPushLogger.logPushEvent('retry-attempt', {
          attempt,
          delayMs,
          maxRetries,
          iosVersion: iosVersionStr
        });
        await sleep(delayMs);
      }
      
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) break;
      
      const shouldRetry = options?.retryPredicate 
        ? options.retryPredicate(error, attempt)
        : true;
      
      if (!shouldRetry) {
        iosPushLogger.logPushEvent('retry-aborted', {
          attempt,
          error: error instanceof Error ? error.message : String(error),
          reason: 'retry-predicate-false'
        });
        break;
      }
      
      // Log retry details
      iosPushLogger.logPushEvent('retry-error', {
        attempt,
        error: error instanceof Error ? error.message : String(error),
        nextAttemptDelay: baseDelayMs * Math.pow(backoffFactor, attempt),
        remainingRetries: maxRetries - attempt
      });
    }
  }
  
  // Log final failure
  iosPushLogger.logPushEvent('retry-exhausted', {
    totalAttempts: maxRetries + 1,
    finalError: lastError instanceof Error ? lastError.message : String(lastError)
  });
  
  throw lastError;
};
