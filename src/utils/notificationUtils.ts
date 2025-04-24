
import { Reminder, ReminderPriority, ReminderCategory, NotificationType } from '@/types/reminderTypes';
import { NotificationSettings } from '@/types/notifications';
import { shouldSendNotification } from '@/services/notifications/settings';
import { NotificationCleanupConfig, DEFAULT_CLEANUP_CONFIG } from '@/types/notifications/sharedTypes';

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
 * Determine notification type based on reminder category
 * @param reminder The reminder to determine type for
 * @returns The appropriate notification type
 */
export const determineNotificationType = (reminder: Reminder): NotificationType => {
  if (!reminder) return NotificationType.TEST;
  
  // If reminder is overdue
  if (reminder.dueDate < new Date() && !reminder.completed) {
    return NotificationType.OVERDUE;
  }
  
  // If reminder is upcoming (due within 24 hours)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (reminder.dueDate <= tomorrow && !reminder.completed) {
    return NotificationType.UPCOMING;
  }
  
  // Default to test notification
  return NotificationType.TEST;
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
    type: determineNotificationType(reminder)
  };
};

/**
 * Normalize notification cleanup config to ensure compatibility 
 * between different property names
 * 
 * @param config Partial cleanup configuration
 * @returns Complete normalized configuration with all required fields
 */
export function normalizeCleanupConfig(config: any): NotificationCleanupConfig {
  const result: NotificationCleanupConfig = {
    ...DEFAULT_CLEANUP_CONFIG
  };
  
  if (config) {
    // Apply standard properties
    if ('enabled' in config) result.enabled = config.enabled;
    if ('maxCount' in config) result.maxCount = config.maxCount;
    if ('cleanupInterval' in config) result.cleanupInterval = config.cleanupInterval;
    if ('lastCleanup' in config) result.lastCleanup = config.lastCleanup;
    
    // Handle property name differences with priority to new names
    result.maxAgeDays = config.maxAgeDays ?? config.maxAge ?? result.maxAgeDays;
    
    // Handle the logical inversion between keepHighPriority and excludeHighPriority
    if ('excludeHighPriority' in config) {
      result.excludeHighPriority = config.excludeHighPriority;
      result.keepHighPriority = !config.excludeHighPriority;
    } else if ('keepHighPriority' in config) {
      result.keepHighPriority = config.keepHighPriority;
      result.excludeHighPriority = !config.keepHighPriority;
    }
    
    result.highPriorityMaxAgeDays = config.highPriorityMaxAgeDays ?? 
                                   config.highPriorityMaxAge ?? 
                                   result.highPriorityMaxAgeDays;
    
    // Ensure deprecated properties match their new counterparts
    result.maxAge = result.maxAgeDays;
    result.highPriorityMaxAge = result.highPriorityMaxAgeDays;
  }
  
  return result;
}
