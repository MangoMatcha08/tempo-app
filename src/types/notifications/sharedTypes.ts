
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
  /** Whether automatic cleanup is enabled */
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
  
  /** @deprecated Use maxAgeDays instead */
  maxAge?: number;
  
  /** @deprecated Use excludeHighPriority instead (note: inverse logic) */
  keepHighPriority?: boolean;
  
  /** @deprecated Use highPriorityMaxAgeDays instead */
  highPriorityMaxAge?: number;
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
  cleanupInterval: 24,
  lastCleanup: 0,
  
  // Deprecated properties with matching values
  maxAge: 30,
  keepHighPriority: false, // Inverse of excludeHighPriority
  highPriorityMaxAge: 90
};
