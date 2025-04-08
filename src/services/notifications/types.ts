
/**
 * Notification Service Type Definitions
 * 
 * @deprecated Import types directly from '@/types/notifications' instead
 * This file is maintained for backward compatibility.
 */

import { ReminderPriority } from '@/types/reminderTypes';
import { NotificationSettings } from '@/types/notifications/settingsTypes';

// Re-export the notification settings type
export type { NotificationSettings };

// We're now using the defaultNotificationSettings from settingsTypes.ts
// This file can be removed if it's not needed for other purposes
