import { Reminder, ReminderPriority } from '@/types/reminderTypes';
import { NotificationSettings } from '@/types/notifications';
import { shouldSendNotification } from '@/services/notifications/settings';
import { NotificationCleanupConfig, DEFAULT_CLEANUP_CONFIG } from '@/types/notifications/serviceWorkerTypes';

/**
 * Show notification based on reminder priority and user settings
 * @param reminder The reminder to show notification for
 * @param notificationSettings User notification settings
 * @param toast Toast function to display notifications
 */
export const showNotification = (
  reminder: Reminder, 
  notificationSettings: NotificationSettings,
  toast: (props: any) => void
) => {
  if (!notificationSettings.enabled) return;
  
  // Handle the priority type conversion properly
  const reminderPriority = reminder.priority as ReminderPriority;

  // Check if in-app notification should be shown
  if (shouldSendNotification(reminderPriority, notificationSettings, 'inApp')) {
    toast({
      title: reminder.title,
      description: reminder.description || 'Reminder',
      duration: 3000,
      variant: getPriorityToastVariant(reminderPriority),
    });
  }

  // Log information about push and email notifications
  console.log('Should send push notification:', 
    shouldSendNotification(reminderPriority, notificationSettings, 'push'));
  console.log('Should send email notification:', 
    shouldSendNotification(reminderPriority, notificationSettings, 'email'));
};

/**
 * Get toast variant based on reminder priority
 * @param priority The priority level of the reminder
 * @returns The appropriate toast variant
 */
export const getPriorityToastVariant = (priority: ReminderPriority): "default" | "destructive" => {
  if (priority === ReminderPriority.HIGH) {
    return "destructive";
  }
  return "default";
};

/**
 * Format reminder data for notification display
 * @param reminder The reminder to format
 * @returns Formatted notification data or null if reminder is invalid
 */
export const formatReminderForNotification = (reminder: Reminder) => {
  if (!reminder) return null;
  
  // Format due date to readable string
  const formattedDueDate = reminder.dueDate instanceof Date 
    ? reminder.dueDate.toLocaleString() 
    : 'Unknown date';
  
  return {
    title: reminder.title,
    description: `${reminder.description || ''}\nDue: ${formattedDueDate}`,
    priority: reminder.priority,
  };
};

/**
 * Ensures both primary and compatibility properties remain in sync
 * @param config Partial configuration to normalize
 * @returns Fully normalized configuration with all properties
 */
export function normalizeCleanupConfig(
  config: Partial<NotificationCleanupConfig>
): NotificationCleanupConfig {
  const normalized = { ...DEFAULT_CLEANUP_CONFIG, ...config };
  
  // Handle the logical inversion between keepHighPriority and excludeHighPriority
  if ('keepHighPriority' in config && config.keepHighPriority !== undefined) {
    normalized.excludeHighPriority = !config.keepHighPriority;
  } else if ('excludeHighPriority' in config && config.excludeHighPriority !== undefined) {
    normalized.keepHighPriority = !config.excludeHighPriority;
  }
  
  // Sync maxAge and maxAgeDays
  if ('maxAge' in config && config.maxAge !== undefined) {
    normalized.maxAgeDays = config.maxAge;
  } else if ('maxAgeDays' in config && config.maxAgeDays !== undefined) {
    normalized.maxAge = config.maxAgeDays;
  }
  
  // Sync highPriorityMaxAge and highPriorityMaxAgeDays
  if ('highPriorityMaxAge' in config && config.highPriorityMaxAge !== undefined) {
    normalized.highPriorityMaxAgeDays = config.highPriorityMaxAge;
  } else if ('highPriorityMaxAgeDays' in config && config.highPriorityMaxAgeDays !== undefined) {
    normalized.highPriorityMaxAge = config.highPriorityMaxAgeDays;
  }
  
  return normalized;
}
