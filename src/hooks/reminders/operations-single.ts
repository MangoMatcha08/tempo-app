
import { doc, updateDoc, collection, addDoc, Timestamp } from "firebase/firestore";
import { Reminder } from "@/types/reminderTypes";
import { useReminderOperationsCore } from "./operations-core";

/**
 * Provides operations for individual reminders (complete, undo, add, update)
 */
export function useSingleReminderOperations(user: any, db: any, isReady: boolean) {
  const {
    setError,
    cacheReminder,
    invalidateReminder,
    isOfflineMode,
    showErrorToast
  } = useReminderOperationsCore(user, db, isReady);

  const handleCompleteReminder = async (id: string, setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>): Promise<boolean> => {
    try {
      const completedAt = new Date();
      
      setReminders(prev => {
        const newReminders = prev.map(reminder => 
          reminder.id === id 
            ? { ...reminder, completed: true, completedAt } 
            : reminder
        );
        
        const updatedReminder = newReminders.find(r => r.id === id);
        if (updatedReminder) {
          cacheReminder(updatedReminder);
        }
        
        return newReminders;
      });
      
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
      
      setReminders(prev => {
        const newReminders = prev.map(reminder => 
          reminder.id === id 
            ? { ...reminder, completed: false, completedAt: undefined } 
            : reminder
        );
        
        const revertedReminder = newReminders.find(r => r.id === id);
        if (revertedReminder) {
          cacheReminder(revertedReminder);
        }
        
        return newReminders;
      });
      
      showErrorToast("Changes were not saved. Please try again later.");
      return false;
    }
  };
  
  const handleUndoComplete = async (id: string, setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>): Promise<boolean> => {
    try {
      setReminders(prev => {
        const newReminders = prev.map(reminder => 
          reminder.id === id 
            ? { ...reminder, completed: false, completedAt: undefined } 
            : reminder
        );
        
        const updatedReminder = newReminders.find(r => r.id === id);
        if (updatedReminder) {
          cacheReminder(updatedReminder);
        }
        
        return newReminders;
      });
      
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
      
      setReminders(prev => {
        const newReminders = prev.map(reminder => 
          reminder.id === id 
            ? { ...reminder, completed: true, completedAt: new Date() } 
            : reminder
        );
        
        const revertedReminder = newReminders.find(r => r.id === id);
        if (revertedReminder) {
          cacheReminder(revertedReminder);
        }
        
        return newReminders;
      });
      
      showErrorToast("Changes were not saved. Please try again later.");
      return false;
    }
  };

  const addReminder = async (
    reminder: Reminder, 
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
    setTotalCount: React.Dispatch<React.SetStateAction<number>>
  ): Promise<Reminder> => {
    const tempId = reminder.id || `temp-${Date.now()}`;
    const newReminder = {
      ...reminder,
      id: tempId,
      createdAt: reminder.createdAt || new Date()
    };
    
    try {
      setReminders(prev => {
        const updatedReminders = [newReminder, ...prev];
        return updatedReminders;
      });
      
      setTotalCount(prev => prev + 1);
      
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
      
      setReminders(prev => {
        const updatedReminders = prev.map(item => 
          item.id === tempId ? savedReminder : item
        );
        
        cacheReminder(savedReminder);
        
        return updatedReminders;
      });
      
      setError(null);
      
      return savedReminder;
    } catch (error: any) {
      console.error("Error adding reminder:", error);
      setError(error);
      
      setReminders(prev => prev.filter(item => item.id !== tempId));
      setTotalCount(prev => prev - 1);
      
      showErrorToast("Your reminder was not saved. Please try again later.");
      
      return reminder;
    }
  };

  const updateReminder = async (
    updatedReminder: Reminder, 
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>
  ): Promise<Reminder> => {
    let originalReminder: Reminder | undefined;
    
    try {
      setReminders(prev => {
        originalReminder = prev.find(r => r.id === updatedReminder.id);
        
        const newReminders = prev.map(reminder => 
          reminder.id === updatedReminder.id 
            ? { ...updatedReminder } 
            : reminder
        );
        
        cacheReminder(updatedReminder);
        
        return newReminders;
      });
      
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
      
      if (originalReminder) {
        setReminders(prev => {
          const newReminders = prev.map(reminder => 
            reminder.id === updatedReminder.id 
              ? originalReminder! 
              : reminder
          );
          
          cacheReminder(originalReminder);
          
          return newReminders;
        });
      }
      
      invalidateReminder(updatedReminder.id);
      
      showErrorToast("Your changes were not saved. Please try again later.");
      
      return updatedReminder;
    }
  };

  return {
    handleCompleteReminder,
    handleUndoComplete,
    addReminder,
    updateReminder
  };
}
