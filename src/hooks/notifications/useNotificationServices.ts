
import { useCallback } from 'react';
import { sendTestNotification } from '@/services/notificationService';

/**
 * Hook for notification services like sending test notifications
 */
export function useNotificationServices() {
  // Send a test notification
  const sendTestNotification = useCallback(async (options: { 
    type: 'push' | 'email'; 
    email?: string; 
    includeDeviceInfo?: boolean 
  }) => {
    try {
      if (options.type === 'email' && !options.email) {
        throw new Error('Email is required for sending email notifications');
      }
      
      return await sendTestNotification(options);
    } catch (err) {
      console.error('Error sending test notification:', err);
      throw err;
    }
  }, []);
  
  return {
    sendTestNotification
  };
}

export default useNotificationServices;
