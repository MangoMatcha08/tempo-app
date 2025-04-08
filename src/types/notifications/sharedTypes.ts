
/**
 * Shared Type Definitions Between Reminders and Notifications
 * 
 * This file documents and re-exports types that are shared between
 * the reminder and notification domains. It aims to clarify the relationship
 * between these domains and provide a single source of truth for shared types.
 * 
 * @module types/notifications/sharedTypes
 */

import { 
  NotificationType, 
  ReminderPriority,
  Reminder
} from '@/types/reminderTypes';

// Re-export from reminderTypes for now, but consider moving these
// to this file in a future refactoring
export { 
  NotificationType, 
  ReminderPriority 
};

/**
 * Maps reminder priorities to notification importance levels
 * Used to determine how notifications should be displayed
 */
export enum NotificationImportance {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}

/**
 * Maps reminder priorities to notification importance
 * @param priority - The reminder priority to map
 * @returns The corresponding notification importance
 */
export function mapPriorityToImportance(priority: ReminderPriority): NotificationImportance {
  switch (priority) {
    case ReminderPriority.HIGH:
      return NotificationImportance.HIGH;
    case ReminderPriority.MEDIUM:
      return NotificationImportance.MEDIUM;
    case ReminderPriority.LOW:
      return NotificationImportance.LOW;
    default:
      return NotificationImportance.MEDIUM;
  }
}

/**
 * Reminder-notification relationship type
 * Defines how a reminder relates to notifications
 */
export interface ReminderNotificationMapping {
  reminderId: string;
  notificationIds: string[];
  lastNotified?: number; // timestamp
}

/**
 * @note This documents the relationship between reminders and notifications.
 * In our current architecture:
 * - Reminders are the source data for notifications
 * - NotificationType enum (from reminderTypes.ts) defines types of notifications
 * - ReminderPriority (from reminderTypes.ts) determines notification urgency
 * 
 * Future refactoring should consider:
 * 1. Moving shared enums to this file
 * 2. Creating a clear separation between domains
 * 3. Developing a consistent approach to type organization
 */
