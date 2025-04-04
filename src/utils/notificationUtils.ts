
import { Reminder, ReminderPriority } from '@/types/reminderTypes';
import { shouldSendNotification, NotificationSettings } from '@/services/notificationService';

// Show notification based on reminder priority and user settings
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
      duration: 3000, // Consistently use 3 seconds
    });
  }

  // Log information about push and email notifications
  console.log('Should send push notification:', 
    shouldSendNotification(reminderPriority, notificationSettings, 'push'));
  console.log('Should send email notification:', 
    shouldSendNotification(reminderPriority, notificationSettings, 'email'));
};
