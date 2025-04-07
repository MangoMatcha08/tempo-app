
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
      duration: 5000,
      variant: getPriorityToastVariant(reminderPriority),
      action: reminder.id ? (
        <div>View</div>
      ) : undefined
      /* This will be replaced by the ToastAction component */
    });
  }

  // Log information about push and email notifications
  console.log('Should send push notification:', 
    shouldSendNotification(reminderPriority, notificationSettings, 'push'));
  console.log('Should send email notification:', 
    shouldSendNotification(reminderPriority, notificationSettings, 'email'));
};

// Get toast variant based on priority
export const getPriorityToastVariant = (priority: ReminderPriority): "default" | "destructive" => {
  return priority === ReminderPriority.HIGH ? "destructive" : "default";
};

// Format reminder for notification
export const formatReminderForNotification = (reminder: Reminder) => {
  // Format due date to readable string
  const formattedDueDate = reminder.dueDate instanceof Date 
    ? reminder.dueDate.toLocaleString() 
    : 'Unknown date';
  
  // Get time remaining text
  const timeRemaining = getTimeRemainingText(reminder.dueDate);
  
  return {
    title: reminder.title,
    description: `${reminder.description || ''}\n${timeRemaining}`,
    priority: reminder.priority,
    data: {
      reminderId: reminder.id,
      priority: reminder.priority,
      userId: reminder.userId
    }
  };
};

// Format time remaining in a user-friendly way
export const getTimeRemainingText = (date: Date | any): string => {
  if (!(date instanceof Date)) {
    if (date?.toDate && typeof date.toDate === 'function') {
      date = date.toDate();
    } else {
      return 'Date not available';
    }
  }
  
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 0) {
    return `Overdue by ${formatTimeDifference(-diffMins)}`;
  } else if (diffMins === 0) {
    return 'Due now';
  } else {
    return `Due in ${formatTimeDifference(diffMins)}`;
  }
};

// Format time difference in minutes to a readable string
const formatTimeDifference = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours !== 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ''}`;
  } else {
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    return `${days} day${days !== 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours} hr` : ''}`;
  }
};

// Create a notification badge component
export const getNotificationBadgeContent = (count: number): string => {
  if (count <= 0) return '';
  if (count > 99) return '99+';
  return count.toString();
};
