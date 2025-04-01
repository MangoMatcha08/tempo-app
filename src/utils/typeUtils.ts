
import { Reminder as ReminderType, ReminderPriority } from '@/types/reminderTypes';
import { Reminder as UIReminder } from '@/types/reminder';

/**
 * Converts a backend Reminder to a UI-compatible Reminder
 */
export const convertToUIReminder = (reminder: ReminderType): UIReminder => {
  let uiPriority: "high" | "medium" | "low";
  
  // Handle both string and enum cases
  if (typeof reminder.priority === 'string') {
    const priority = reminder.priority.toLowerCase();
    uiPriority = (priority === 'high' || priority === ReminderPriority.HIGH) ? 'high' :
                 (priority === 'medium' || priority === ReminderPriority.MEDIUM) ? 'medium' : 'low';
  } else {
    uiPriority = reminder.priority === ReminderPriority.HIGH ? 'high' :
                 reminder.priority === ReminderPriority.MEDIUM ? 'medium' : 'low';
  }
  
  return {
    ...reminder,
    priority: uiPriority
  } as UIReminder;
};

/**
 * Converts a UI Reminder to a backend-compatible Reminder
 */
export const convertToBackendReminder = (reminder: UIReminder): ReminderType => {
  let backendPriority: ReminderPriority;
  
  switch (reminder.priority) {
    case 'high':
      backendPriority = ReminderPriority.HIGH;
      break;
    case 'medium':
      backendPriority = ReminderPriority.MEDIUM;
      break;
    case 'low':
      backendPriority = ReminderPriority.LOW;
      break;
    default:
      backendPriority = ReminderPriority.MEDIUM;
  }
  
  return {
    ...reminder,
    priority: backendPriority
  } as ReminderType;
};
