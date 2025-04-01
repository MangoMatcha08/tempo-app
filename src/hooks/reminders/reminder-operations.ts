
import { useState } from "react";
import { Reminder } from "@/types/reminderTypes";
import { 
  doc, updateDoc, collection, addDoc, Timestamp,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export function useReminderOperations(user: any, db: any, isReady: boolean) {
  const { toast } = useToast();

  const handleCompleteReminder = async (id: string, setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>) => {
    try {
      if (!user || !isReady || !db) {
        return;
      }
      
      const completedAt = new Date();
      
      const reminderRef = doc(db, "reminders", id);
      await updateDoc(reminderRef, { 
        completed: true, 
        completedAt: Timestamp.fromDate(completedAt)
      });
      
      setReminders(prev => 
        prev.map(reminder => 
          reminder.id === id 
            ? { ...reminder, completed: true, completedAt } 
            : reminder
        )
      );
    } catch (error) {
      console.error("Error completing reminder:", error);
      toast({
        title: "Error updating reminder",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };
  
  const handleUndoComplete = async (id: string, setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>) => {
    try {
      if (!user || !isReady || !db) {
        return;
      }
      
      const reminderRef = doc(db, "reminders", id);
      await updateDoc(reminderRef, { 
        completed: false, 
        completedAt: null 
      });
      
      setReminders(prev => 
        prev.map(reminder => 
          reminder.id === id 
            ? { ...reminder, completed: false, completedAt: undefined } 
            : reminder
        )
      );
    } catch (error) {
      console.error("Error undoing reminder completion:", error);
      toast({
        title: "Error updating reminder",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };
  
  const addReminder = async (reminder: Reminder, setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>, setTotalCount: React.Dispatch<React.SetStateAction<number>>) => {
    try {
      if (!user || !isReady || !db) {
        const newReminder = {
          ...reminder,
          id: reminder.id,
          createdAt: reminder.createdAt || new Date()
        };
        
        console.log("Adding reminder (local only):", newReminder);
        setReminders(prev => [newReminder, ...prev]);
        return newReminder;
      }
      
      console.log("Adding reminder to Firestore:", reminder);
      
      const newReminder = {
        ...reminder,
        userId: user.uid,
        createdAt: Timestamp.fromDate(reminder.createdAt || new Date()),
        dueDate: Timestamp.fromDate(reminder.dueDate),
        completed: reminder.completed || false,
        completedAt: reminder.completedAt ? Timestamp.fromDate(reminder.completedAt) : null
      };
      
      const { id, ...reminderData } = newReminder;
      
      const remindersRef = collection(db, "reminders");
      const docRef = await addDoc(remindersRef, reminderData);
      
      const savedReminder: Reminder = {
        ...reminder,
        id: docRef.id,
        userId: user.uid,
        createdAt: reminder.createdAt || new Date(),
      };
      
      console.log("Successfully added reminder:", savedReminder);
      
      // Add the new reminder at the top of the list and update count
      setReminders(prev => [savedReminder, ...prev]);
      setTotalCount(prev => prev + 1);
      
      return savedReminder;
    } catch (error) {
      console.error("Error adding reminder:", error);
      toast({
        title: "Error saving reminder",
        description: "Please try again later",
        variant: "destructive",
      });
      
      return reminder;
    }
  };

  const updateReminder = async (updatedReminder: Reminder, setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>) => {
    try {
      if (!user || !isReady || !db) {
        console.log("Updating reminder (local only):", updatedReminder);
        setReminders(prev => 
          prev.map(reminder => 
            reminder.id === updatedReminder.id 
              ? { ...updatedReminder } 
              : reminder
          )
        );
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
      
      setReminders(prev => 
        prev.map(reminder => 
          reminder.id === updatedReminder.id 
            ? { ...updatedReminder } 
            : reminder
        )
      );
      
      return updatedReminder;
    } catch (error) {
      console.error("Error updating reminder:", error);
      toast({
        title: "Error updating reminder",
        description: "Please try again later",
        variant: "destructive",
      });
      
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
