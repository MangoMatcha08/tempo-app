
/**
 * Notification Service
 * 
 * This service handles the delivery of notifications using the strategy pattern,
 * and adapts to different platforms using the platform adapter.
 */

import { NotificationRecord, NotificationDeliveryStatus } from '@/types/notifications';
import { notificationDelivery } from '@/strategies/notification/NotificationStrategy';
import { useNotificationHistory } from '@/contexts/notificationHistory';
import { getPlatformAdapter } from '@/adapters/platform/PlatformAdapter';
import { Reminder } from '@/types/reminderTypes';
import { formatReminderForNotification } from '@/utils/notificationUtils';

export class NotificationService {
  async sendNotification(notification: NotificationRecord): Promise<boolean> {
    try {
      // Update status to sending
      this.updateStatus(notification.id, NotificationDeliveryStatus.SENDING);
      
      // Use the notification strategy to send
      const result = await notificationDelivery.deliverNotification(notification);
      
      if (result.success) {
        this.updateStatus(notification.id, NotificationDeliveryStatus.SENT);
        return true;
      } else {
        this.updateStatus(notification.id, NotificationDeliveryStatus.FAILED);
        return false;
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      this.updateStatus(notification.id, NotificationDeliveryStatus.FAILED);
      return false;
    }
  }
  
  private updateStatus(id: string, status: NotificationDeliveryStatus): void {
    // This would typically use a reactive store or context
    // For now, we'll just log it
    console.log(`Notification ${id} status updated to ${status}`);
  }
  
  async sendReminderNotification(reminder: Reminder): Promise<boolean> {
    const notificationData = formatReminderForNotification(reminder);
    
    if (!notificationData) {
      console.error('Could not format reminder for notification', reminder);
      return false;
    }
    
    const notification: NotificationRecord = {
      id: `reminder-${reminder.id}-${Date.now()}`,
      title: notificationData.title,
      body: notificationData.description || '',
      timestamp: Date.now(),
      type: reminder.type || 'default',
      reminderId: reminder.id,
      priority: reminder.priority,
      status: NotificationDeliveryStatus.CREATED,
      channels: [] // Will be determined by the strategy
    };
    
    return this.sendNotification(notification);
  }
  
  async requestPermission(): Promise<boolean> {
    const adapter = getPlatformAdapter();
    return adapter.requestPermission('notifications');
  }
  
  isPermissionGranted(): boolean {
    const adapter = getPlatformAdapter();
    return adapter.isPermissionGranted('notifications');
  }
  
  getPlatformInfo() {
    return getPlatformAdapter().getPlatformInfo();
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Hook to use the notification service with state management
export function useNotificationService() {
  const history = useNotificationHistory();
  
  const sendNotification = async (notification: NotificationRecord): Promise<boolean> => {
    // Add to history first
    history.addNotification({
      ...notification,
      status: NotificationDeliveryStatus.CREATED
    });
    
    // Then send
    const result = await notificationService.sendNotification(notification);
    
    // Update status based on result
    if (result) {
      history.updateNotificationStatus(notification.id, NotificationDeliveryStatus.SENT);
    } else {
      history.updateNotificationStatus(notification.id, NotificationDeliveryStatus.FAILED);
    }
    
    return result;
  };
  
  return {
    sendNotification,
    sendReminderNotification: notificationService.sendReminderNotification.bind(notificationService),
    requestPermission: notificationService.requestPermission.bind(notificationService),
    isPermissionGranted: notificationService.isPermissionGranted.bind(notificationService),
    getPlatformInfo: notificationService.getPlatformInfo.bind(notificationService)
  };
}
