import { useState } from "react";
import { Reminder } from "@/types/reminderTypes";
import { 
  doc, updateDoc, collection, addDoc, Timestamp,
  writeBatch, getDocs, query, where
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
  
  const batchCompleteReminders = async (ids: string[], completed: boolean, setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>) => {
    let originalReminders: Reminder[] = [];
    const completedAt = completed ? new Date() : undefined;
    
    try {
      setReminders(prev => {
        const newReminders = prev.map(reminder => {
          if (ids.includes(reminder.id)) {
            originalReminders.push({ ...reminder });
            return { 
              ...reminder, 
              completed, 
              completedAt: completed ? completedAt : undefined 
            };
          }
          return reminder;
        });
        
        newReminders
          .filter(r => ids.includes(r.id))
          .forEach(updatedReminder => cacheReminder(updatedReminder));
        
        return newReminders;
      });
      
      if (!user || !isReady || !db) {
        console.log("No Firestore connection, only updated UI optimistically");
        return;
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
    } catch (error: any) {
      console.error(`Error batch ${completed ? 'completing' : 'uncompleting'} reminders:`, error);
      setError(error);
      
      if (originalReminders.length > 0) {
        setReminders(prev => {
          const newReminders = prev.map(reminder => {
            const original = originalReminders.find(r => r.id === reminder.id);
            return original || reminder;
          });
          
          originalReminders.forEach(reminder => cacheReminder(reminder));
          
          return newReminders;
        });
      }
      
      toast({
        title: "Error updating reminders",
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

  const batchAddReminders = async (
    reminders: Omit<Reminder, 'id'>[],
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
    setTotalCount: React.Dispatch<React.SetStateAction<number>>
  ) => {
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
      
      setReminders(prev => {
        const updatedReminders = [...tempReminders, ...prev];
        return updatedReminders;
      });
      
      setTotalCount(prev => prev + reminders.length);
      
      if (!user || !isReady || !db) {
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
      
      setReminders(prev => {
        const withoutTempReminders = prev.filter(
          reminder => !tempIds.includes(reminder.id)
        );
        return [...savedReminders, ...withoutTempReminders];
      });
      
      setError(null);
      
      return savedReminders;
    } catch (error: any) {
      console.error("Error batch adding reminders:", error);
      setError(error);
      
      setReminders(prev => prev.filter(item => !tempIds.includes(item.id)));
      setTotalCount(prev => prev - reminders.length);
      
      toast({
        title: "Error saving reminders",
        description: "Your reminders were not saved. Please try again later.",
        variant: "destructive",
      });
      
      return [];
    }
  };

  const updateReminder = async (updatedReminder: Reminder, setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>) => {
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

  const batchUpdateReminders = async (
    updatedReminders: Reminder[],
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>
  ) => {
    let originalReminders: Reminder[] = [];
    const reminderIds = updatedReminders.map(r => r.id);
    
    try {
      setReminders(prev => {
        originalReminders = prev
          .filter(r => reminderIds.includes(r.id))
          .map(r => ({ ...r }));
        
        const newReminders = prev.map(reminder => {
          const updatedVersion = updatedReminders.find(r => r.id === reminder.id);
          return updatedVersion || reminder;
        });
        
        updatedReminders.forEach(reminder => cacheReminder(reminder));
        
        return newReminders;
      });
      
      if (!user || !isReady || !db) {
        console.log("Updating reminders (local only, optimistic):", updatedReminders);
        return updatedReminders;
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
      return updatedReminders;
    } catch (error: any) {
      console.error("Error batch updating reminders:", error);
      setError(error);
      
      if (originalReminders.length > 0) {
        setReminders(prev => {
          const newReminders = prev.map(reminder => {
            const original = originalReminders.find(r => r.id === reminder.id);
            return original || reminder;
          });
          
          originalReminders.forEach(reminder => cacheReminder(reminder));
          
          return newReminders;
        });
      }
      
      reminderIds.forEach(id => invalidateReminder(id));
      
      toast({
        title: "Error updating reminders",
        description: "Your changes were not saved. Please try again later.",
        variant: "destructive",
      });
      
      return [];
    }
  };

  const batchDeleteReminders = async (
    ids: string[],
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
    setTotalCount: React.Dispatch<React.SetStateAction<number>>
  ) => {
    let originalReminders: Reminder[] = [];
    
    try {
      setReminders(prev => {
        originalReminders = prev
          .filter(r => ids.includes(r.id))
          .map(r => ({ ...r }));
        
        return prev.filter(r => !ids.includes(r.id));
      });
      
      setTotalCount(prev => prev - ids.length);
      
      if (!user || !isReady || !db) {
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
      
      if (originalReminders.length > 0) {
        setReminders(prev => {
          return [...prev, ...originalReminders];
        });
        
        setTotalCount(prev => prev + ids.length);
        
        originalReminders.forEach(reminder => cacheReminder(reminder));
      }
      
      toast({
        title: "Error deleting reminders",
        description: "Your reminders were not deleted. Please try again later.",
        variant: "destructive",
      });
      
      return false;
    }
  };

  return {
    handleCompleteReminder,
    handleUndoComplete,
    addReminder,
    updateReminder,
    error,
    batchCompleteReminders,
    batchAddReminders,
    batchUpdateReminders,
    batchDeleteReminders
  };
}
