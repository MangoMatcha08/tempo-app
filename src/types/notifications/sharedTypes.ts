
/**
 * Shared notification type definitions
 * 
 * This module contains type definitions that are shared across
 * multiple notification-related modules.
 * 
 * @module types/notifications/sharedTypes
 */

import { NotificationDeliveryStatus } from './notificationHistoryTypes';

/**
 * Base notification payload structure
 */
export interface BaseNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  timestamp?: number;
  tag?: string;
}

/**
 * Permission request result interface
 * Used for both standard and iOS-specific permission requests
 */
export interface PermissionRequestResult {
  granted: boolean;
  reason?: string;
  token?: string;
  error?: any;
  shouldPromptPwaInstall?: boolean;
  iosVersion?: string;
}

/**
 * Basic message structure for service worker communication
 */
export interface ServiceWorkerMessage {
  type: string;
  payload?: any;
}
