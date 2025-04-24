/**
 * iOS Permission Error Types
 * 
 * Detailed categorization of permission-related errors on iOS
 */

/**
 * Specific error types for iOS permission flow
 */
export enum PermissionErrorType {
  // Permission response errors
  PERMISSION_DENIED = 'permission-denied',
  PERMISSION_DISMISSED = 'permission-dismissed',
  
  // iOS environment errors
  NOT_IOS_DEVICE = 'not-ios-device',
  VERSION_UNSUPPORTED = 'version-unsupported',
  NOT_PWA = 'not-pwa',
  
  // Service worker errors
  SW_REGISTRATION_FAILED = 'sw-registration-failed',
  SW_TIMEOUT = 'sw-timeout',
  
  // Network-related errors
  NETWORK_OFFLINE = 'network-offline',
  NETWORK_TIMEOUT = 'network-timeout',
  SERVER_ERROR = 'server-error',
  
  // Token-related errors
  TOKEN_FETCH_FAILED = 'token-fetch-failed',
  TOKEN_EXPIRED = 'token-expired',
  
  // Flow state errors
  FLOW_INTERRUPTED = 'flow-interrupted',
  FLOW_TIMEOUT = 'flow-timeout',
  
  // Other errors
  INITIALIZATION_FAILED = 'initialization-failed',
  MULTIPLE_ATTEMPTS_FAILED = 'multiple-attempts-failed',
  UNKNOWN_ERROR = 'unknown-error'
}

/**
 * Device capability information for error context
 */
export interface DeviceCapabilities {
  serviceWorkerSupported: boolean;
  notificationsSupported: boolean;
  pushManagerSupported: boolean;
  isIOS: boolean;
  iosVersion?: number;
  isPWA: boolean;
  isOnline: boolean;
  connectionType?: string;
}

/**
 * Attempt history tracking
 */
export interface AttemptHistory {
  count: number;
  lastAttempt: number;
  failures: Array<{
    timestamp: number;
    errorType: PermissionErrorType;
    errorMessage: string;
  }>;
}

/**
 * Enhanced error metadata for permission requests
 */
export interface PermissionErrorMetadata {
  errorType: PermissionErrorType;
  deviceCapabilities?: DeviceCapabilities;
  attemptHistory?: AttemptHistory;
  flowStep?: string;
  recoverable: boolean;
  retryAfter?: number;
  transient: boolean;
}
