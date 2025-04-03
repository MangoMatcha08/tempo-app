import { Reminder, ReminderPriority } from '@/types/reminderTypes';
import { shouldSendNotification, NotificationSettings } from '@/services/notificationService';
import { getMessaging, getToken } from 'firebase/messaging';
import { initializeFirebase } from '@/services/notifications/firebase';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("NotificationUtils");

// Show notification based on reminder priority and user settings
export const showNotification = async (
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

  // Check if push notification should be sent
  if (shouldSendNotification(reminderPriority, notificationSettings, 'push')) {
    try {
      await sendPushNotification(reminder);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Log information about push and email notifications
  debugLog('Should send push notification:', 
    shouldSendNotification(reminderPriority, notificationSettings, 'push'));
  debugLog('Should send email notification:', 
    shouldSendNotification(reminderPriority, notificationSettings, 'email'));
};

// Schedule a notification for a specific time
export const scheduleNotification = async (reminder: Reminder): Promise<boolean> => {
  try {
    // Get the due date from the reminder
    const dueDate = reminder.dueDate;
    
    if (!dueDate) {
      debugLog('No due date found for reminder:', reminder.id);
      return false;
    }
    
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    
    // If the due date is in the past, don't schedule
    if (timeDiff <= 0) {
      debugLog('Due date is in the past, not scheduling notification');
      return false;
    }
    
    // Schedule the notification
    debugLog(`Scheduling notification for ${dueDate.toLocaleString()} (in ${Math.round(timeDiff/1000/60)} minutes)`);
    
    // Use setTimeout to trigger the notification at the right time
    setTimeout(async () => {
      try {
        // Get user settings to check if notifications are enabled
        const userId = localStorage.getItem('userId') || 'anonymous';
        const firestore = getFirestore();
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const notificationSettings = userData.notificationSettings || { enabled: true, push: true };
          
          if (notificationSettings.enabled && notificationSettings.push) {
            await sendPushNotification(reminder);
            debugLog('Push notification sent for scheduled reminder');
          } else {
            debugLog('Push notifications disabled in user settings');
          }
        } else {
          // If no user document exists, default to sending notification
          await sendPushNotification(reminder);
          debugLog('Push notification sent for scheduled reminder (no user settings found)');
        }
      } catch (error) {
        console.error('Error sending scheduled notification:', error);
      }
    }, timeDiff);
    
    debugLog('Notification scheduled successfully');
    return true;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return false;
  }
};

// Send a push notification for a reminder
export const sendPushNotification = async (reminder: Reminder): Promise<boolean> => {
  try {
    debugLog('Attempting to send push notification for reminder:', reminder.id);
    
    // Initialize Firebase
    await initializeFirebase();
    
    // Check if we have permission
    if (Notification.permission !== 'granted') {
      debugLog('Notification permission not granted');
      return false;
    }
    
    // For PWA, we can use the Notification API directly
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        // Create notification content
        const notificationTitle = reminder.title || 'Tempo Reminder';
        const notificationOptions = {
          body: reminder.description || `Reminder for ${reminder.periodId ? `${getPeriodName(reminder.periodId)}` : 'today'}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `tempo-reminder-${reminder.id}`,
          data: {
            reminderId: reminder.id,
            url: '/dashboard',
            timestamp: new Date().getTime()
          },
          actions: [
            {
              action: 'view',
              title: 'View'
            },
            {
              action: 'complete',
              title: 'Mark Complete'
            }
          ]
        };
        
        // Show the notification
        await registration.showNotification(notificationTitle, notificationOptions);
        debugLog('Local notification sent successfully');
        return true;
      } else {
        debugLog('No service worker registration found');
      }
    }
    
    // Fallback to FCM for cross-device notifications
    try {
      const messaging = getMessaging();
      const currentToken = await getToken(messaging);
      
      if (currentToken) {
        // In a real app, you would send this to your server
        // For now, we'll just log it
        debugLog('FCM token available, would send to server:', currentToken.substring(0, 10) + '...');
        
        // Simulate sending to FCM
        debugLog('Simulating FCM notification send for:', reminder.title);
        return true;
      } else {
        debugLog('No FCM token available');
      }
    } catch (fcmError) {
      console.error('Error with FCM:', fcmError);
    }
    
    return false;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

// Helper function to get period name
const getPeriodName = (periodId: string): string => {
  // Import dynamically to avoid circular dependencies
  const { mockPeriods } = require('./reminderUtils');
  const period = mockPeriods.find(p => p.id === periodId);
  return period ? period.name : 'Unknown Period';
};
