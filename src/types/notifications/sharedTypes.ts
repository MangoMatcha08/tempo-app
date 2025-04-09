/**
 * Shared notification type definitions
 * 
 * This module contains type definitions that are shared across
 * multiple notification-related modules.
 * 
 * @module types/notifications/sharedTypes
 */

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
  token?: string | null;
  error?: Error | string; // Accept both Error objects and strings
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

/**
 * Notification cleanup configuration
 * Centralized definition to avoid conflicts
 */
export interface NotificationCleanupConfig {
  /** Whether to automatically clean up notifications */
  enabled: boolean;
  
  /** Maximum age of notifications to keep (in days) */
  maxAgeDays: number;
  
  /** Maximum number of notifications to keep */
  maxCount: number;
  
  /** Whether to exclude high priority notifications from cleanup */
  excludeHighPriority: boolean;
  
  /** Maximum age for high priority notifications (in days) */
  highPriorityMaxAgeDays: number;
  
  /** How often to run cleanup (in hours) */
  cleanupInterval?: number;
  
  /** Timestamp of last cleanup */
  lastCleanup?: number;
  
  /** Maximum age in hours (for backward compatibility) */
  maxAge?: number;
}

/**
 * Default notification cleanup configuration
 */
export const DEFAULT_CLEANUP_CONFIG: NotificationCleanupConfig = {
  enabled: true,
  maxAgeDays: 30,
  maxCount: 200,
  excludeHighPriority: true,
  highPriorityMaxAgeDays: 90,
  cleanupInterval: 24
};

/**
 * Notification delivery manager interface
 * Handles the delivery of notifications through different channels
 */
export interface NotificationDeliveryManager {
  deliver: (notification: any, channel: string) => Promise<NotificationDeliveryResult>;
  getBestAvailableMethod: (notification: any) => string;
}

/**
 * Result of a notification delivery attempt
 */
export interface NotificationDeliveryResult {
  success: boolean;
  id: string;
  channel: string;
  timestamp: number;
  error?: string | null;
}

/**
 * Extended interface for NotificationServices
 */
export interface NotificationServices {
  // Existing properties will be kept
  
  // Add missing properties
  deliveryManager: NotificationDeliveryManager;
  services: Record<string, any>;
}

/**
 * Extended interface for NotificationPermission
 */
export interface NotificationPermission {
  // Existing properties
  permissionGranted: boolean;
  isSupported: boolean;
  requestPermission: () => Promise<PermissionRequestResult>;
  
  // Add missing property
  hasPermission: (type: string) => boolean;
}
