
// This file is maintained for backward compatibility
// New code should import directly from src/contexts/notificationHistory
import { 
  NotificationHistoryProvider,
  useNotificationHistory,
  NotificationHistoryContextType
} from './notificationHistory';

export { NotificationHistoryProvider, useNotificationHistory };
export type { NotificationHistoryContextType };

// For default imports
export default {
  Provider: NotificationHistoryProvider,
  useNotificationHistory
};
