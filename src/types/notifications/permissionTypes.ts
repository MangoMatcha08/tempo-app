
/**
 * Notification Permission Type Definitions
 * 
 * This module contains all type definitions related to notification permissions,
 * including browser permission states and request results.
 * 
 * @module types/notifications/permissionTypes
 */

/**
 * The result of a notification permission request.
 * Contains information about the permission status and any errors that occurred.
 * 
 * @interface PermissionRequestResult
 */
export interface PermissionRequestResult {
  /** Whether permission was granted */
  granted: boolean;
  /** The FCM token if permission was granted and token was generated */
  token?: string | null;
  /** Any error that occurred during the permission request */
  error?: Error | string;
  /** Reason why permission was not granted, if applicable */
  reason?: string;
  /** Whether to show PWA installation prompt (iOS specific) */
  shouldPromptPwaInstall?: boolean;
  /** iOS version if relevant */
  iosVersion?: string;
}

/**
 * Well-known reason codes for permission request failures
 * Used to standardize error reporting across the application
 */
export enum PermissionErrorReason {
  // Browser support issues
  BROWSER_UNSUPPORTED = 'browser-unsupported',
  SERVICE_WORKER_UNSUPPORTED = 'service-worker-unsupported',
  
  // Permission state issues
  PERMISSION_DENIED = 'permission-denied',
  PERMISSION_DISMISSED = 'permission-dismissed',
  
  // iOS-specific issues
  IOS_VERSION_UNSUPPORTED = 'ios-version-unsupported',
  PWA_REQUIRED = 'pwa-required',
  
  // Token issues
  TOKEN_REQUEST_FAILED = 'token-request-failed',
  
  // Service worker issues
  SERVICE_WORKER_FAILED = 'service-worker-failed',
  
  // Generic errors
  UNKNOWN_ERROR = 'unknown-error',
  TIMEOUT = 'timeout',
  CONFIGURATION_ERROR = 'configuration-error'
}

/**
 * Browser's native notification permission state
 * with additional states for unsupported browsers.
 * 
 * @type {string}
 */
export type BrowserPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

/**
 * Context state for notification permissions
 * Used in the NotificationPermissionContext
 * 
 * @interface NotificationPermissionContextState
 */
export interface NotificationPermissionContextState {
  /** Whether notification permissions have been granted */
  permissionGranted: boolean;
  /** Whether notifications are supported in the current browser */
  isSupported: boolean;
  /** Function to request notification permission */
  requestPermission: () => Promise<PermissionRequestResult>;
  /** Function to check if permission is granted */
  hasPermission: () => boolean;
}

/**
 * @deprecated Use BrowserPermissionState instead
 */
export type NotificationPermissionState = BrowserPermissionState;
