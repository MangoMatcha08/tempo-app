
import { useState, useEffect } from "react";
import { Reminder } from "@/types/reminder";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/contexts/AuthContext";
import { getFirestore, collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { isFirebaseInitialized } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const firebaseReady = isFirebaseInitialized();
  
  // Fetch reminders when user changes
  useEffect(() => {
    const fetchReminders = async () => {
      if (!user || !firebaseReady) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const db = getFirestore();
        const remindersRef = collection(db, "reminders");
        const q = query(
          remindersRef, 
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedReminders: Reminder[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedReminders.push({
            ...data,
            id: doc.id,
            dueDate: data.dueDate.toDate(),
            createdAt: data.createdAt?.toDate(),
            completedAt: data.completedAt?.toDate()
          } as Reminder);
        });
        
        setReminders(fetchedReminders);
        console.log("Fetched reminders:", fetchedReminders.length);
      } catch (error) {
        console.error("Error fetching reminders:", error);
        toast({
          title: "Error fetching reminders",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchReminders();
  }, [user, firebaseReady, toast]);
  
  const activeReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);
  
  // Urgent reminders are due within the next 2 hours
  const urgentReminders = activeReminders.filter(reminder => {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 7200000);
    return reminder.dueDate <= twoHoursFromNow;
  });
  
  // Upcoming reminders are all other active reminders
  const upcomingReminders = activeReminders.filter(reminder => {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 7200000);
    return reminder.dueDate > twoHoursFromNow;
  });
  
  const handleCompleteReminder = async (id: string) => {
    try {
      if (!user || !firebaseReady) {
        return;
      }
      
      const completedAt = new Date();
      
      // Update in Firestore
      const db = getFirestore();
      const reminderRef = doc(db, "reminders", id);
      await updateDoc(reminderRef, { 
        completed: true, 
        completedAt 
      });
      
      // Update local state
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
  
  const handleUndoComplete = async (id: string) => {
    try {
      if (!user || !firebaseReady) {
        return;
      }
      
      // Update in Firestore
      const db = getFirestore();
      const reminderRef = doc(db, "reminders", id);
      await updateDoc(reminderRef, { 
        completed: false, 
        completedAt: null 
      });
      
      // Update local state
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
  
  const addReminder = async (reminder: Reminder) => {
    try {
      if (!user || !firebaseReady) {
        // Fall back to local behavior if not authenticated or Firebase not ready
        const newReminder = {
          ...reminder,
          id: reminder.id || uuidv4(),
          createdAt: reminder.createdAt || new Date()
        };
        
        console.log("Adding reminder (local only):", newReminder);
        setReminders(prev => [newReminder, ...prev]);
        return newReminder;
      }
      
      // Ensure we have a proper reminder object
      const newReminder = {
        ...reminder,
        id: reminder.id || uuidv4(),
        createdAt: reminder.createdAt || new Date(),
        userId: user.uid,
      };
      
      // Add to Firestore
      const db = getFirestore();
      const remindersRef = collection(db, "reminders");
      const docRef = await addDoc(remindersRef, {
        ...newReminder,
        id: undefined // Firestore will generate its own ID
      });
      
      // Update with Firestore ID
      const savedReminder = {
        ...newReminder,
        id: docRef.id
      };
      
      console.log("Adding reminder:", savedReminder);
      setReminders(prev => [savedReminder, ...prev]);
      return savedReminder;
    } catch (error) {
      console.error("Error adding reminder:", error);
      toast({
        title: "Error saving reminder",
        description: "Please try again later",
        variant: "destructive",
      });
      
      // Return the original reminder for UI consistency
      return reminder;
    }
  };

  const updateReminder = async (updatedReminder: Reminder) => {
    try {
      if (!user || !firebaseReady) {
        // Fall back to local behavior
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
      
      console.log("Updating reminder:", updatedReminder);
      
      // Update in Firestore
      const db = getFirestore();
      const reminderRef = doc(db, "reminders", updatedReminder.id);
      
      // Remove the id from the data to update (since it's part of the document path)
      const { id, ...reminderData } = updatedReminder;
      await updateDoc(reminderRef, reminderData);
      
      // Update local state
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
      
      // Return the original reminder for UI consistency
      return updatedReminder;
    }
  };

  return {
    reminders,
    loading,
    urgentReminders,
    upcomingReminders,
    completedReminders,
    handleCompleteReminder,
    handleUndoComplete,
    addReminder,
    updateReminder
  };
}
