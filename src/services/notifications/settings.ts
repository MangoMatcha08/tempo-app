import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ReminderPriority } from '@/types/reminderTypes';
import { initializeFirebase, firestore } from './core/initialization';
import { NotificationSettings, defaultNotificationSettings } from '@/types/notifications/settingsTypes';

// Get user's notification settings
export const getUserNotificationSettings = async (userId: string): Promise<NotificationSettings> => {
  await initializeFirebase();
  if (!firestore) return defaultNotificationSettings;
  
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists() && userDoc.data().notificationSettings) {
      const settings = userDoc.data().notificationSettings as NotificationSettings;
      
      // Ensure dailySummary settings exist
      if (!settings.email.dailySummary) {
        settings.email.dailySummary = defaultNotificationSettings.email.dailySummary;
      }
      
      return settings;
    }
    
    return defaultNotificationSettings;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return defaultNotificationSettings;
  }
};

// Update user's notification settings
export const updateUserNotificationSettings = async (
  userId: string, 
  settings: Partial<NotificationSettings>
): Promise<void> => {
  await initializeFirebase();
  if (!firestore) return;
  
  try {
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const currentSettings = userDoc.data().notificationSettings || defaultNotificationSettings;
      const updatedSettings = { ...currentSettings, ...settings };
      
      await updateDoc(userDocRef, {
        notificationSettings: updatedSettings,
        updatedAt: new Date()
      });
    } else {
      await setDoc(userDocRef, {
        notificationSettings: { ...defaultNotificationSettings, ...settings },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error updating notification settings:', error);
  }
};

// Check if notification should be sent based on priority and user settings
export const shouldSendNotification = (
  priority: ReminderPriority,
  settings: NotificationSettings,
  notificationType: 'email' | 'push' | 'inApp'
): boolean => {
  if (!settings.enabled) return false;
  
  const typeSettings = settings[notificationType];
  if (!typeSettings.enabled) return false;
  
  // Convert priority to numeric value for comparison
  const priorityValues = {
    [ReminderPriority.LOW]: 1,
    [ReminderPriority.MEDIUM]: 2,
    [ReminderPriority.HIGH]: 3
  };
  
  const reminderPriorityValue = priorityValues[priority];
  const minPriorityValue = priorityValues[typeSettings.minPriority];
  
  return reminderPriorityValue >= minPriorityValue;
};
