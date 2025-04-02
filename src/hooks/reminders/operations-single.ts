
import { doc, updateDoc, collection, addDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { Reminder } from "@/types/reminderTypes";
import { useReminderOperationsCore } from "./operations-core";

/**
 * Provides operations for individual reminders (complete, undo, add, update, delete)
 */
export function useSingleReminderOperations(user: any, db: any, isReady: boolean) {
  const {
    setError,
    cacheReminder,
    invalidateReminder,
    isOfflineMode,
    showErrorToast
  } = useReminderOperationsCore(user, db, isReady);

  const handleCompleteReminder = async (id: string): Promise<boolean> => {
    try {
      const completedAt = new Date();
      
      if (isOfflineMode()) {
        return true;
      }
      
      const reminderRef = doc(db, "reminders", id);
      await updateDoc(reminderRef, { 
        completed: true, 
        completedAt: Timestamp.fromDate(completedAt)
      });
      
      setError(null);
      return true;
    } catch (error: any) {
      console.error("Error completing reminder:", error);
      setError(error);
      
      showErrorToast("Changes were not saved. Please try again later.");
      return false;
    }
  };
  
  const handleUndoComplete = async (id: string): Promise<boolean> => {
    try {
      if (isOfflineMode()) {
        return true;
      }
      
      const reminderRef = doc(db, "reminders", id);
      await updateDoc(reminderRef, { 
        completed: false, 
        completedAt: null 
      });
      
      setError(null);
      return true;
    } catch (error: any) {
      console.error("Error undoing reminder completion:", error);
      setError(error);
      
      showErrorToast("Changes were not saved. Please try again later.");
      return false;
    }
  };

  const addReminder = async (reminder: Reminder): Promise<Reminder> => {
    const tempId = reminder.id || `temp-${Date.now()}`;
    const newReminder = {
      ...reminder,
      id: tempId,
      createdAt: reminder.createdAt || new Date()
    };
    
    try {
      if (isOfflineMode()) {
        console.log("Adding reminder (local only, optimistic):", newReminder);
        cacheReminder(newReminder);
        return newReminder;
      }
      
      console.log("Adding reminder to Firestore:", reminder);
      
      const firestoreReminder = {
        ...reminder,
        userId: user.uid,
        createdAt: Timestamp.fromDate(reminder.createdAt || new Date()),
        dueDate: Timestamp.fromDate(reminder.dueDate),
        completed: reminder.completed || false,
        completedAt: reminder.completedAt ? Timestamp.fromDate(reminder.completedAt) : null
      };
      
      const { id, ...reminderData } = firestoreReminder;
      
      const remindersRef = collection(db, "reminders");
      const docRef = await addDoc(remindersRef, reminderData);
      
      const savedReminder: Reminder = {
        ...reminder,
        id: docRef.id,
        userId: user.uid,
        createdAt: reminder.createdAt || new Date(),
      };
      
      console.log("Successfully added reminder:", savedReminder);
      
      cacheReminder(savedReminder);
      
      setError(null);
      
      return savedReminder;
    } catch (error: any) {
      console.error("Error adding reminder:", error);
      setError(error);
      
      showErrorToast("Your reminder was not saved. Please try again later.");
      
      return reminder;
    }
  };

  const updateReminder = async (updatedReminder: Reminder): Promise<Reminder> => {
    try {
      cacheReminder(updatedReminder);
      
      if (isOfflineMode()) {
        console.log("Updating reminder (local only, optimistic):", updatedReminder);
        return updatedReminder;
      }
      
      console.log("Updating reminder in Firestore:", updatedReminder);
      
      const reminderData = {
        ...updatedReminder,
        dueDate: Timestamp.fromDate(updatedReminder.dueDate),
        createdAt: updatedReminder.createdAt ? Timestamp.fromDate(updatedReminder.createdAt) : Timestamp.now(),
        completedAt: updatedReminder.completedAt ? Timestamp.fromDate(updatedReminder.completedAt) : null
      };
      
      const { id, ...firestoreData } = reminderData;
      
      const reminderRef = doc(db, "reminders", updatedReminder.id);
      await updateDoc(reminderRef, firestoreData);
      
      setError(null);
      
      return updatedReminder;
    } catch (error: any) {
      console.error("Error updating reminder:", error);
      setError(error);
      
      invalidateReminder(updatedReminder.id);
      
      showErrorToast("Your changes were not saved. Please try again later.");
      
      return updatedReminder;
    }
  };

  const deleteReminder = async (id: string): Promise<boolean> => {
    try {
      if (isOfflineMode()) {
        console.log("Deleting reminder (local only, optimistic):", id);
        invalidateReminder(id);
        return true;
      }
      
      console.log("Deleting reminder in Firestore:", id);
      
      const reminderRef = doc(db, "reminders", id);
      await deleteDoc(reminderRef);
      
      invalidateReminder(id);
      
      setError(null);
      return true;
    } catch (error: any) {
      console.error("Error deleting reminder:", error);
      setError(error);
      
      showErrorToast("The reminder could not be removed. Please try again later.");
      return false;
    }
  };

  return {
    handleCompleteReminder,
    handleUndoComplete,
    addReminder,
    updateReminder,
    deleteReminder
  };
}
