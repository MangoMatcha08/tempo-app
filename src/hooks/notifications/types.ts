
/**
 * Notification Hooks Type Definitions
 * 
 * This file contains TypeScript interfaces for all notification hook return values.
 * These interfaces ensure consistent behavior across the notification system and
 * provide clear documentation for hook consumers.
 * 
 * @module hooks/notifications/types
 */

import { 
  NotificationRecord as NotificationRecordBase, 
  NotificationAction as NotificationActionBase,
  NotificationSettings as NotificationSettingsBase,
  NotificationDeliveryStatus as NotificationDeliveryStatusBase,
  NotificationCleanupConfig,
  PermissionRequestResult,
  ServiceWorkerMessage as ServiceWorkerMessageBase
} from '@/types/notifications';
import { Reminder } from '@/types/reminderTypes';

// Re-export the base types to avoid direct imports from multiple places
export type NotificationRecord = NotificationRecordBase;
export type NotificationAction = NotificationActionBase;
export type NotificationDeliveryStatus = NotificationDeliveryStatusBase;
export type NotificationSettings = NotificationSettingsBase;
export type ServiceWorkerMessage = ServiceWorkerMessageBase;

/**
 * Core notification state interface
 * Contains the fundamental state needed for notifications
 */
export interface NotificationStateInterface {
  records: NotificationRecord[];
  loading: boolean;
  error: Error | null;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

/**
 * Options for notification state
 */
export interface NotificationStateOptions {
  pageSize?: number;
  autoCleanup?: boolean;
}

/**
 * State management functions interface
 */
export interface NotificationStateActions {
  addNotification: (notification: NotificationRecord) => void;
  updateNotificationStatus: (id: string, status: NotificationDeliveryStatus) => void;
  addNotificationAction: (id: string, action: NotificationAction) => void;
  clearHistory: () => void;
  loadHistory: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

/**
 * Combined state interface
 */
export interface NotificationState extends NotificationStateInterface, NotificationStateActions {}

/**
 * Service-related notification operations
 */
export interface NotificationServices {
  cleanupNotifications: (options?: {
    maxAge?: number;
    maxCount?: number;
    keepHighPriority?: boolean;
    highPriorityMaxAge?: number;
  }) => Promise<{
    totalRemoved: number;
    byAge: number;
    byCount: number;
  }>;
  runAutomaticCleanup: () => Promise<void>;
  updateCleanupConfig: (config: Partial<NotificationCleanupConfig>) => NotificationCleanupConfig;
  sendTestNotification: (options: { 
    type: "push" | "email"; 
    email?: string; 
    includeDeviceInfo?: boolean 
  }) => Promise<any>;
  cleanupConfig: NotificationCleanupConfig;
}

/**
 * Toast display options abstraction
 * Compatible with both Sonner and shadcn/ui toast libraries
 */
export interface ToastOptions {
  title: string;
  description?: string;
  type?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
}

/**
 * Notification display functions
 */
export interface NotificationDisplay {
  showToast: (options: ToastOptions) => void;
  showNotification: (reminder: Reminder) => void;
  showToastNotification: (notification: NotificationRecord) => void;
}

/**
 * Options for notification display
 */
export interface NotificationDisplayOptions {
  limit?: number;
  filter?: (notification: NotificationRecord) => boolean;
}

/**
 * Notification action handling
 */
export interface NotificationActions {
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  handleAction: (notificationId: string, action: NotificationAction) => void;
  handleServiceWorkerMessage: (message: ServiceWorkerMessage) => void;
}

/**
 * Permission management interface
 */
export interface NotificationPermission {
  permissionGranted: boolean;
  isSupported: boolean;
  requestPermission: () => Promise<PermissionRequestResult>;
}

/**
 * Settings management interface
 */
export interface NotificationSettingsManagement {
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

/**
 * Feature flag interface
 */
export interface NotificationFeatures {
  isFeatureEnabled: (featureName: string) => boolean;
}

/**
 * Complete notification API (facade)
 */
export interface NotificationsAPI extends 
  NotificationState, 
  NotificationDisplay,
  NotificationActions,
  NotificationPermission,
  NotificationSettingsManagement,
  NotificationServices,
  NotificationFeatures {
  
  /**
   * Computed count of unread notifications
   */
  unreadCount: number;
}
