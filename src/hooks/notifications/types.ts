
import { PermissionRequestResult } from '@/types/notifications/permissionTypes';
import { Reminder, ReminderPriority } from '@/types/reminderTypes';
import { NotificationType, NotificationChannel } from '@/types/notifications';

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
 * Notification record interface
 */
export interface NotificationRecord {
  /** Unique identifier */
  id: string;
  
  /** Title of the notification */
  title: string;
  
  /** Body content of the notification */
  body: string;
  
  /** Timestamp when the notification was created */
  timestamp: number;
  
  /** Type of notification */
  type: NotificationType;
  
  /** Related reminder ID if applicable */
  reminderId?: string;
  
  /** Priority of the notification */
  priority?: ReminderPriority;
  
  /** Current delivery status */
  status: NotificationDeliveryStatus;
  
  /** Channels this notification was sent through */
  channels: NotificationChannel[];
  
  /** Additional metadata */
  meta?: Record<string, any>;
}

/**
 * Action that can be taken on a notification
 */
export type NotificationAction = 'view' | 'dismiss' | 'snooze' | 'delete' | 'mark_read';

/**
 * Notification delivery status
 */
export enum NotificationDeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  RECEIVED = 'received',
  CLICKED = 'clicked',
  FAILED = 'failed'
}

/**
 * Service worker message interface
 */
export interface ServiceWorkerMessage {
  /** Type of message */
  type: string;
  
  /** Message payload */
  payload?: {
    reminderId?: string;
    action?: string;
    notification?: {
      id: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

/**
 * Toast options for notification display
 */
export interface ToastOptions {
  /** Title of the toast */
  title: string;
  
  /** Description/content of the toast */
  description?: string;
  
  /** Type of toast (styling) */
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
  
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
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
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
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}
