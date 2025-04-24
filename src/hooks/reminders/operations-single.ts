import { doc, updateDoc, collection, addDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { Reminder } from "@/types/reminderTypes";
import { useReminderOperationsCore } from "./operations-core";
import { convertToUtc, convertToLocal } from "@/utils/dateTimeUtils";

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

  const handleCompleteReminder = async (id: string, setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>): Promise<boolean> => {
    try {
      // Convert completedAt to UTC before Firestore
      const completedAt = convertToUtc(new Date());
      
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
    const createdAtUtc = convertToUtc(reminder.createdAt ? new Date(reminder.createdAt) : new Date());
    const dueDateUtc = convertToUtc(reminder.dueDate);
    const completedAtUtc = reminder.completedAt ? convertToUtc(reminder.completedAt) : undefined;
    const newReminder = {
      ...reminder,
      id: tempId,
      createdAt: createdAtUtc
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
      
      // Create a clean Firestore document without location
      const firestoreReminder = {
        title: reminder.title,
        description: reminder.description,
        userId: user.uid,
        createdAt: Timestamp.fromDate(createdAtUtc),
        dueDate: Timestamp.fromDate(dueDateUtc),
        completed: reminder.completed || false,
        completedAt: completedAtUtc ? Timestamp.fromDate(completedAtUtc) : null,
        priority: reminder.priority,
        type: reminder.type,
        periodId: reminder.periodId,
        category: reminder.category,
        checklist: reminder.checklist
      };
      
      const remindersRef = collection(db, "reminders");
      const docRef = await addDoc(remindersRef, firestoreReminder);
      
      const savedReminder: Reminder = {
        ...firestoreReminder,
        id: docRef.id,
        dueDate: dueDateUtc,
        createdAt: createdAtUtc,
        completedAt: completedAtUtc
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
    const createdAtUtc = updatedReminder.createdAt ? convertToUtc(new Date(updatedReminder.createdAt)) : convertToUtc(new Date());
    const dueDateUtc = convertToUtc(updatedReminder.dueDate);
    const completedAtUtc = updatedReminder.completedAt ? convertToUtc(updatedReminder.completedAt) : undefined;
    
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
      
      // Create a clean Firestore document without location
      const reminderData = {
        title: updatedReminder.title,
        description: updatedReminder.description,
        dueDate: Timestamp.fromDate(dueDateUtc),
        createdAt: Timestamp.fromDate(createdAtUtc),
        completedAt: completedAtUtc ? Timestamp.fromDate(completedAtUtc) : null,
        completed: updatedReminder.completed || false,
        priority: updatedReminder.priority,
        type: updatedReminder.type,
        periodId: updatedReminder.periodId,
        category: updatedReminder.category,
        checklist: updatedReminder.checklist
      };
      
      const reminderRef = doc(db, "reminders", updatedReminder.id);
      await updateDoc(reminderRef, reminderData);
      
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

  const deleteReminder = async (
    id: string,
    setReminders?: React.Dispatch<React.SetStateAction<Reminder[]>>,
    setTotalCount?: React.Dispatch<React.SetStateAction<number>>
  ): Promise<boolean> => {
    let deletedReminder: Reminder | undefined;
    
    try {
      if (setReminders) {
        setReminders(prev => {
          deletedReminder = prev.find(r => r.id === id);
          
          return prev.filter(r => r.id !== id);
        });
        
        if (setTotalCount) {
          setTotalCount(prev => prev - 1);
        }
      }
      
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
      
      if (setReminders && deletedReminder) {
        setReminders(prev => {
          return [...prev, deletedReminder!];
        });
        
        if (setTotalCount) {
          setTotalCount(prev => prev + 1);
        }
        
        if (deletedReminder) {
          cacheReminder(deletedReminder);
        }
      }
      
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
