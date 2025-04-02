
import { useState } from "react";
import { Reminder } from "@/types/reminderTypes";
import { 
  doc, updateDoc, collection, addDoc, Timestamp,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useReminderCache } from "./use-reminder-cache";

export function useReminderOperations(user: any, db: any, isReady: boolean) {
  const { toast } = useToast();
  const [error, setError] = useState<Error | null>(null);
  const { 
    cacheReminder, 
    invalidateReminder 
  } = useReminderCache();

  const handleCompleteReminder = async (id: string, setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>) => {
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
      
      if (!user || !isReady || !db) {
        console.log("No Firestore connection, only updated UI optimistically");
        return;
      }
      
      const reminderRef = doc(db, "reminders", id);
      await updateDoc(reminderRef, { 
        completed: true, 
        completedAt: Timestamp.fromDate(completedAt)
      });
      
      setError(null);
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
      
      toast({
        title: "Error updating reminder",
        description: "Changes were not saved. Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  const handleUndoComplete = async (id: string, setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>) => {
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
      
      if (!user || !isReady || !db) {
        console.log("No Firestore connection, only updated UI optimistically");
        return;
      }
      
      const reminderRef = doc(db, "reminders", id);
      await updateDoc(reminderRef, { 
        completed: false, 
        completedAt: null 
      });
      
      setError(null);
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
      
      toast({
        title: "Error updating reminder",
        description: "Changes were not saved. Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  const addReminder = async (reminder: Reminder, setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>, setTotalCount: React.Dispatch<React.SetStateAction<number>>) => {
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
      
      if (!user || !isReady || !db) {
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
      
      toast({
        title: "Error saving reminder",
        description: "Your reminder was not saved. Please try again later.",
        variant: "destructive",
      });
      
      return reminder;
    }
  };

  const updateReminder = async (updatedReminder: Reminder, setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>) => {
    // Fix: Declare originalReminder outside the try block
    let originalReminder: Reminder | undefined;
    
    try {
      // First find the original reminder before updating state
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
      
      if (!user || !isReady || !db) {
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
      
      // Now originalReminder is accessible here
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
      
      toast({
        title: "Error updating reminder",
        description: "Your changes were not saved. Please try again later.",
        variant: "destructive",
      });
      
      return updatedReminder;
    }
  };

  return {
    handleCompleteReminder,
    handleUndoComplete,
    addReminder,
    updateReminder,
    error
  };
}
