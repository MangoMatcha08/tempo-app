
/**
 * The result of a notification permission request.
 * Contains information about the permission status and any errors that occurred.
 */
export interface PermissionRequestResult {
  /** Whether permission was granted */
  granted: boolean;
  /** The FCM token if permission was granted and token was generated */
  token?: string | null;
  /** Any error that occurred during the permission request */
  error?: Error;
}

/**
 * Browser's native notification permission state
 * with additional states for unsupported browsers.
 */
export type BrowserPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

/**
 * Context state for notification permissions
 */
export interface NotificationPermissionContextState {
  /** Whether notification permissions have been granted */
  permissionGranted: boolean;
  /** Whether notifications are supported in the current browser */
  isSupported: boolean;
  /** Function to request notification permission */
  requestPermission: () => Promise<PermissionRequestResult>;
}

/**
 * @deprecated Use BrowserPermissionState instead
 */
export type NotificationPermissionState = BrowserPermissionState;
