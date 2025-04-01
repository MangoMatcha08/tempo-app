
import { useState, useEffect } from "react";
import { Reminder } from "@/types/reminderTypes";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/contexts/AuthContext";
import { getFirestore, collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { isFirebaseInitialized } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/contexts/FirestoreContext";

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { db, isReady } = useFirestore();
  const { toast } = useToast();
  
  // Fetch reminders when user changes or db is ready
  useEffect(() => {
    const fetchReminders = async () => {
      if (!user || !isReady || !db) {
        // If not logged in or Firestore not ready, use empty array
        setReminders([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
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
          const reminder: Reminder = {
            ...data,
            id: doc.id,
            // Convert Firestore timestamps to Date objects
            dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate),
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : new Date(),
            completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt ? new Date(data.completedAt) : undefined
          } as Reminder;
          
          fetchedReminders.push(reminder);
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
  }, [user, isReady, db, toast]);
  
  // Process reminders for the UI
  const activeReminders = reminders.filter(r => !r.completed);
  
  // Urgent reminders are due within the next 24 hours from now
  const urgentReminders = activeReminders.filter(reminder => {
    const now = new Date();
    const tomorrowSameTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return reminder.dueDate <= tomorrowSameTime;
  });
  
  // Upcoming reminders are all other active reminders
  const upcomingReminders = activeReminders.filter(reminder => {
    const now = new Date();
    const tomorrowSameTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return reminder.dueDate > tomorrowSameTime;
  });
  
  // Filter completed reminders
  const completedReminders = reminders.filter(r => r.completed);
  
  const handleCompleteReminder = async (id: string) => {
    try {
      if (!user || !isReady || !db) {
        return;
      }
      
      const completedAt = new Date();
      
      // Update in Firestore
      const reminderRef = doc(db, "reminders", id);
      await updateDoc(reminderRef, { 
        completed: true, 
        completedAt: Timestamp.fromDate(completedAt)
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
      if (!user || !isReady || !db) {
        return;
      }
      
      // Update in Firestore
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
      if (!user || !isReady || !db) {
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
        userId: user.uid,
        createdAt: Timestamp.fromDate(reminder.createdAt || new Date()),
        dueDate: Timestamp.fromDate(reminder.dueDate),
        completedAt: reminder.completedAt ? Timestamp.fromDate(reminder.completedAt) : null
      };
      
      // Remove the id property for Firestore to auto-generate one
      // @ts-ignore
      delete newReminder.id;
      
      // Add to Firestore
      const remindersRef = collection(db, "reminders");
      const docRef = await addDoc(remindersRef, newReminder);
      
      // Create a proper Reminder object with the Firestore ID
      const savedReminder: Reminder = {
        ...reminder,
        id: docRef.id,
        userId: user.uid,
        createdAt: reminder.createdAt || new Date(),
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
      if (!user || !isReady || !db) {
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
      
      // Prepare data for Firestore
      const reminderData = {
        ...updatedReminder,
        dueDate: Timestamp.fromDate(updatedReminder.dueDate),
        createdAt: updatedReminder.createdAt ? Timestamp.fromDate(updatedReminder.createdAt) : Timestamp.now(),
        completedAt: updatedReminder.completedAt ? Timestamp.fromDate(updatedReminder.completedAt) : null
      };
      
      // Remove id from the data as it's part of document path
      const { id, ...firestoreData } = reminderData;
      
      // Update in Firestore
      const reminderRef = doc(db, "reminders", updatedReminder.id);
      await updateDoc(reminderRef, firestoreData);
      
      // Update local state with the original Date objects
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
