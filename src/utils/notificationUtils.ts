
import { Reminder, ReminderPriority } from '@/types/reminderTypes';
import { NotificationSettings } from '@/types/notifications/settingsTypes';
import { shouldSendNotification } from '@/services/notifications/settings';

/**
 * Show notification based on reminder priority and user settings
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
 */
export const getPriorityToastVariant = (priority: ReminderPriority): "default" | "destructive" => {
  if (priority === ReminderPriority.HIGH) {
    return "destructive";
  }
  return "default";
};

/**
 * Format reminder data for notification display
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
