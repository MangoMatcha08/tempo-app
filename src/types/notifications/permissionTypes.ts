
/**
 * Response from notification permission request
 */
export interface PermissionRequestResult {
  granted: boolean;
  token?: string | null;
  error?: Error;
}

/**
 * Notification permission state
 */
export interface NotificationPermissionState {
  permissionGranted: boolean;
  isSupported: boolean;
  requestPermission: () => Promise<PermissionRequestResult>;
}
