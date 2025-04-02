
import { doc, collection, addDoc, Timestamp, writeBatch } from "firebase/firestore";
import { Reminder } from "@/types/reminderTypes";
import { useReminderOperationsCore } from "./operations-core";

/**
 * Provides batch operations for reminders (complete multiple, add multiple, update multiple, delete multiple)
 */
export function useBatchReminderOperations(user: any, db: any, isReady: boolean) {
  const {
    setError,
    cacheReminder,
    invalidateReminder,
    isOfflineMode,
    showErrorToast
  } = useReminderOperationsCore(user, db, isReady);

  const batchCompleteReminders = async (
    ids: string[], 
    completed: boolean
  ): Promise<boolean> => {
    let originalReminders: Reminder[] = [];
    const completedAt = completed ? new Date() : undefined;
    
    try {
      if (isOfflineMode()) {
        return true;
      }
      
      const batch = writeBatch(db);
      
      ids.forEach(id => {
        const reminderRef = doc(db, "reminders", id);
        batch.update(reminderRef, { 
          completed, 
          completedAt: completed ? Timestamp.fromDate(completedAt!) : null 
        });
      });
      
      await batch.commit();
      console.log(`Batch ${completed ? 'completed' : 'uncompleted'} ${ids.length} reminders`);
      
      setError(null);
      return true;
    } catch (error: any) {
      console.error(`Error batch ${completed ? 'completing' : 'uncompleting'} reminders:`, error);
      setError(error);
      
      showErrorToast("Changes were not saved. Please try again later.");
      
      return false;
    }
  };
  
  const batchAddReminders = async (
    reminders: Omit<Reminder, 'id'>[]
  ): Promise<Reminder[]> => {
    const tempIds: string[] = [];
    const tempReminders: Reminder[] = [];
    
    try {
      reminders.forEach(reminder => {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        tempIds.push(tempId);
        tempReminders.push({
          ...reminder,
          id: tempId,
          createdAt: reminder.createdAt || new Date()
        } as Reminder);
      });
      
      if (isOfflineMode()) {
        console.log("Adding reminders (local only, optimistic):", tempReminders);
        tempReminders.forEach(reminder => cacheReminder(reminder));
        return tempReminders;
      }
      
      console.log("Adding reminders to Firestore batch:", reminders.length);
      
      const batch = writeBatch(db);
      const remindersRef = collection(db, "reminders");
      const reminderDocRefs: any[] = [];
      
      reminders.forEach(reminder => {
        const firestoreReminder = {
          ...reminder,
          userId: user.uid,
          createdAt: Timestamp.fromDate(reminder.createdAt || new Date()),
          dueDate: Timestamp.fromDate(reminder.dueDate),
          completed: reminder.completed || false,
          completedAt: reminder.completedAt ? Timestamp.fromDate(reminder.completedAt) : null
        };
        
        const newDocRef = doc(remindersRef);
        reminderDocRefs.push(newDocRef);
        batch.set(newDocRef, firestoreReminder);
      });
      
      await batch.commit();
      
      const savedReminders = tempReminders.map((reminder, index) => {
        const savedReminder = {
          ...reminder,
          id: reminderDocRefs[index].id,
          userId: user.uid
        };
        
        cacheReminder(savedReminder);
        return savedReminder;
      });
      
      setError(null);
      
      return savedReminders;
    } catch (error: any) {
      console.error("Error batch adding reminders:", error);
      setError(error);
      
      showErrorToast("Your reminders were not saved. Please try again later.");
      
      return [];
    }
  };

  const batchUpdateReminders = async (
    updatedReminders: Reminder[]
  ): Promise<boolean> => {
    let originalReminders: Reminder[] = [];
    const reminderIds = updatedReminders.map(r => r.id);
    
    try {
      if (isOfflineMode()) {
        console.log("Updating reminders (local only, optimistic):", updatedReminders);
        return true;
      }
      
      console.log("Updating reminders in Firestore batch:", updatedReminders.length);
      
      const batch = writeBatch(db);
      
      updatedReminders.forEach(reminder => {
        const reminderData = {
          ...reminder,
          dueDate: Timestamp.fromDate(reminder.dueDate),
          createdAt: reminder.createdAt ? Timestamp.fromDate(reminder.createdAt) : Timestamp.now(),
          completedAt: reminder.completedAt ? Timestamp.fromDate(reminder.completedAt) : null
        };
        
        const { id, ...firestoreData } = reminderData;
        const reminderRef = doc(db, "reminders", reminder.id);
        batch.update(reminderRef, firestoreData);
      });
      
      await batch.commit();
      console.log("Batch update successful");
      
      setError(null);
      return true;
    } catch (error: any) {
      console.error("Error batch updating reminders:", error);
      setError(error);
      
      reminderIds.forEach(id => invalidateReminder(id));
      
      showErrorToast("Your changes were not saved. Please try again later.");
      
      return false;
    }
  };

  const batchDeleteReminders = async (
    ids: string[]
  ): Promise<boolean> => {
    try {
      if (isOfflineMode()) {
        console.log("Deleting reminders (local only, optimistic):", ids);
        return true;
      }
      
      console.log("Deleting reminders in Firestore batch:", ids.length);
      
      const batch = writeBatch(db);
      
      ids.forEach(id => {
        const reminderRef = doc(db, "reminders", id);
        batch.delete(reminderRef);
      });
      
      await batch.commit();
      console.log("Batch delete successful");
      
      ids.forEach(id => invalidateReminder(id));
      
      setError(null);
      return true;
    } catch (error: any) {
      console.error("Error batch deleting reminders:", error);
      setError(error);
      
      showErrorToast("Your reminders were not deleted. Please try again later.");
      
      return false;
    }
  };

  return {
    batchCompleteReminders,
    batchAddReminders,
    batchUpdateReminders,
    batchDeleteReminders
  };
}
