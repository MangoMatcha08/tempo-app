
/**
 * Unified notification type definitions
 * 
 * @module hooks/notifications/types
 */

import { 
  NotificationRecord as BaseNotificationRecord,
  NotificationAction as BaseNotificationAction,
  NotificationDeliveryStatus,
  PaginationState
} from '@/types/notifications/notificationHistoryTypes';
import { Reminder, ReminderPriority } from '@/types/reminderTypes';
import { NotificationType, NotificationChannel } from '@/types/notifications';
import { PermissionRequestResult } from '@/types/notifications/permissionTypes';
import { AppMessage } from '@/types/notifications/serviceWorkerTypes';

// Re-export key types
export { 
  NotificationDeliveryStatus,
  NotificationType,
  NotificationChannel
};

// Extend the base notification record to maintain compatibility
export type NotificationRecord = BaseNotificationRecord;

// Extend base notification action to include additional actions
export type NotificationAction = BaseNotificationAction | 'delete' | 'mark_read';

/**
 * Service worker message interface
 */
export interface ServiceWorkerMessage {
  /** Type of message being sent from service worker to app */
  type: 'NOTIFICATION_CLICKED' | 'NOTIFICATION_CLOSED' | 'NOTIFICATION_ACTION' | 
        'READY' | 'SYNC_COMPLETE' | 'SYNC_FAILED' | 'CACHE_MAINTENANCE_COMPLETE' |
        'CACHE_STATS' | 'CLEANUP_COMPLETE';
  /** Additional data associated with the message */
  payload?: {
    /** Associated reminder ID */
    reminderId?: string;
    /** Action taken on the notification */
    action?: BaseNotificationAction;
    /** The notification record */
    notification?: NotificationRecord;
    /** Whether the operation was successful */
    success?: boolean;
    /** Error message if operation failed */
    error?: string;
    /** Service worker version */
    version?: string;
    /** Timestamp of the operation */
    timestamp?: number;
  };
}

/**
 * Notification permission interface
 */
export interface NotificationPermission {
  /** Whether notification permissions have been granted */
  permissionGranted: boolean;
  
  /** Whether notifications are supported in the current browser */
  isSupported: boolean;
  
  /** Whether a permission request is currently in progress */
  isRequesting?: boolean;
  
  /** Function to request notification permission */
  requestPermission: () => Promise<PermissionRequestResult>;
}

/**
 * Options for notification display
 */
export interface NotificationDisplayOptions {
  /** Maximum number of notifications to show */
  maxCount?: number;
  
  /** Whether to automatically close notifications */
  autoClose?: boolean;
  
  /** Duration before auto-closing notifications (in ms) */
  duration?: number;
  
  /** Whether to show notifications when the app is in the foreground */
  showInForeground?: boolean;
  
  /** iOS-specific display options */
  iOS?: {
    /** Whether to use native iOS notifications when in PWA mode */
    useNativeInPWA?: boolean;
    
    /** Whether to group notifications by type */
    groupByType?: boolean;
  };

  /** Limit the number of notifications to display */
  limit?: number;
  
  /** Filter function for notifications */
  filter?: (notification: NotificationRecord) => boolean;
}

/**
 * Toast options for notification display
 * Compatible with both shadcn/ui and sonner
 */
export interface ToastOptions {
  /** Title of the toast */
  title: string;
  
  /** Description/content of the toast */
  description?: string;
  
  /** Type of toast (styling) */
  variant?: 'default' | 'destructive' | 'success' | 'error' | 'warning' | 'info';
  
  /** Duration in milliseconds */
  duration?: number;
  
  /** Action that can be taken from the toast */
  action?: {
    label: string;
    onClick: () => void;
  };
  
  /** Called when toast is dismissed */
  onDismiss?: () => void;
  
  /** Called when toast auto-closes */
  onAutoClose?: () => void;
}

/**
 * Notification interface for displaying notifications
 */
export interface NotificationDisplay {
  /** Show a toast notification with provided options */
  showToast: (options: ToastOptions) => void;
  
  /** Show notification based on a reminder object */
  showNotification: (reminder: Reminder) => void;
  
  /** Show toast notification from a notification record */
  showToastNotification: (notification: NotificationRecord) => void;
}

/**
 * Pagination interface compatible with both formats
 */
export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

/**
 * Notification state interface for the hook result
 */
export interface NotificationStateInterface {
  /** List of notification records */
  records: NotificationRecord[];
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: Error | null;
  
  /** Pagination information */
  pagination: PaginationInfo;
}

/**
 * Notification cleanup configuration
 */
export interface NotificationCleanupConfig {
  /** Whether cleanup is enabled */
  enabled: boolean;
  
  /** Maximum age of notifications in milliseconds */
  maxAge: number;
  
  /** Maximum number of notifications to keep */
  maxCount: number;
  
  /** Whether to keep high priority notifications */
  keepImportant: boolean;
}

/**
 * Result of a notification cleanup operation
 */
export interface CleanupResult {
  /** Total number of notifications removed */
  totalRemoved: number;
  
  /** Number removed due to age */
  byAge: number;
  
  /** Number removed due to count limit */
  byCount: number;
}

/**
 * Notification state management interface
 */
export interface NotificationState extends NotificationStateInterface {
  /** Add a notification to the state */
  addNotification: (notification: NotificationRecord) => void;
  
  /** Update the status of a notification */
  updateNotificationStatus: (id: string, status: NotificationDeliveryStatus) => void;
  
  /** Add an action to a notification */
  addNotificationAction: (id: string, action: NotificationAction) => void;
  
  /** Clear notification history */
  clearHistory: () => void;
  
  /** Load notification history */
  loadHistory: () => Promise<void>;
  
  /** Set current page for pagination */
  setPage: (page: number) => void;
  
  /** Set page size for pagination */
  setPageSize: (size: number) => void;
}

/**
 * Options for notification state
 */
export interface NotificationStateOptions {
  /** Initial page */
  initialPage?: number;
  
  /** Initial page size */
  initialPageSize?: number;
  
  /** Whether to load history automatically */
  autoLoad?: boolean;
}

/**
 * Notification action handlers
 */
export interface NotificationActions {
  /** Mark a notification as read */
  markAsRead: (notificationId: string) => void;
  
  /** Mark all notifications as read */
  markAllAsRead: (notifications?: NotificationRecord[]) => void;
  
  /** Handle a notification action */
  handleAction: (notificationId: string, action: NotificationAction) => void;
  
  /** Handle messages from service worker */
  handleServiceWorkerMessage: (message: ServiceWorkerMessage) => void;
}

/**
 * Notification feature flags
 */
export interface NotificationFeatures {
  /** Check if a notification feature is enabled */
  isFeatureEnabled: (featureName: string) => boolean;
}

/**
 * Notification services for admin/utility operations
 */
export interface NotificationServices {
  /** Current cleanup configuration */
  cleanupConfig: {
    enabled: boolean;
    maxAge: number;
    maxCount: number;
    keepImportant: boolean;
  };
  
  /** Update cleanup config */
  updateCleanupConfig: (config: Partial<NotificationServices['cleanupConfig']>) => void;
  
  /** Manually trigger cleanup */
  cleanupNotifications: () => Promise<number>;
  
  /** Run automatic cleanup based on config */
  runAutomaticCleanup: () => Promise<void>;
  
  /** Send a test notification */
  sendTestNotification: (options: { type: "push" | "email"; email?: string; includeDeviceInfo?: boolean }) => Promise<any>;
}

/**
 * Notification settings management
 */
export interface NotificationSettingsManagement {
  /** Current notification settings */
  settings: any;
  
  /** Update notification settings */
  updateSettings: (newSettings: Partial<any>) => void;
  
  /** Reset settings to defaults */
  resetToDefaults: () => void;
}

/**
 * Complete notification API surface
 */
export interface NotificationsAPI extends NotificationPermission {
  // State properties
  unreadCount: number;
  
  // Includes methods from all specialized hooks
  showNotification: (reminder: Reminder) => void;
  handleServiceWorkerMessage: (message: ServiceWorkerMessage) => void;
  showToastNotification: (notification: NotificationRecord) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (notifications?: NotificationRecord[]) => void;
  records: NotificationRecord[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationInfo;
}
