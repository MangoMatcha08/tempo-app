import { useEffect, useState, useCallback } from 'react';
import { Reminder } from '@/types/reminderTypes';
import { scheduleNotification } from '@/utils/notificationUtils';
import { createDebugLogger } from '@/utils/debugUtils';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { mockPeriods } from '@/utils/reminderUtils';

const debugLog = createDebugLogger("ReminderNotifications");

export const useReminderNotifications = (reminders: Reminder[]) => {
  const [scheduledReminders, setScheduledReminders] = useState<Record<string, boolean>>({});
  const { permissionStatus, deviceInfo } = useNotificationPermission();
  
  // Schedule notifications for reminders
  const scheduleReminders = useCallback(async () => {
    if (permissionStatus !== 'granted') {
      debugLog('Notification permission not granted, cannot schedule reminders');
      return;
    }
    
    debugLog(`Checking ${reminders.length} reminders for scheduling`);
    
    const newScheduledReminders: Record<string, boolean> = { ...scheduledReminders };
    
    for (const reminder of reminders) {
      // Skip if already scheduled or completed
      if (scheduledReminders[reminder.id] || reminder.completed) {
        continue;
      }
      
      // Get the due date
      let dueDate = reminder.dueDate;
      
      // If we have a period ID but no specific time, use the period start time
      if (reminder.periodId && (!dueDate || dueDate.getHours() === 0 && dueDate.getMinutes() === 0)) {
        const period = mockPeriods.find(p => p.id === reminder.periodId);
        if (period && period.startTime) {
          // Parse the start time (handle both 24-hour and 12-hour formats)
          let [hours, minutes] = period.startTime.split(':').map(part => {
            // Handle cases like "1:14" (convert to 13:14)
            if (part.includes(":")) return part;
            
            const num = parseInt(part, 10);
            // If it's a single-digit hour in the afternoon (1-9), convert to 24-hour format
            if (num >= 1 && num <= 9 && period.startTime.indexOf(":") > 1) {
              return (num + 12).toString();
            }
            return part;
          });
          
          // Convert hours to number, handling 12-hour format
          let hoursNum = parseInt(hours, 10);
          if (hoursNum < 8 && period.startTime.indexOf(":") > 1) {
            hoursNum += 12; // Convert afternoon hours to 24-hour format
          }
          
          // Create a new date with the period start time
          dueDate = new Date(dueDate || new Date());
          dueDate.setHours(hoursNum, parseInt(minutes, 10), 0, 0);
          
          debugLog(`Using period start time for reminder ${reminder.id}: ${dueDate.toLocaleTimeString()}`);
        }
      }
      
      if (!dueDate) {
        debugLog(`Reminder ${reminder.id} has no due date, skipping`);
        continue;
      }
      
      // Check if due date is in the future
      const now = new Date();
      if (dueDate <= now) {
        debugLog(`Reminder ${reminder.id} due date is in the past, skipping`);
        continue;
      }
      
      // Schedule the notification
      debugLog(`Scheduling notification for reminder ${reminder.id} at ${dueDate.toLocaleString()}`);
      const success = await scheduleNotification(reminder);
      
      if (success) {
        debugLog(`Successfully scheduled notification for reminder ${reminder.id}`);
        newScheduledReminders[reminder.id] = true;
      } else {
        debugLog(`Failed to schedule notification for reminder ${reminder.id}`);
      }
    }
    
    setScheduledReminders(newScheduledReminders);
  }, [reminders, scheduledReminders, permissionStatus]);
  
  // Schedule notifications when reminders change or permission is granted
  useEffect(() => {
    if (permissionStatus === 'granted' && reminders.length > 0) {
      scheduleReminders();
    }
  }, [reminders, permissionStatus, scheduleReminders]);
  
  return {
    scheduledReminders,
    deviceInfo,
    permissionStatus,
    scheduleReminders
  };
};

export default useReminderNotifications;
