import { useState, useEffect, useCallback } from "react";
import { Reminder } from "@/types/reminderTypes";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/contexts/AuthContext";
import { 
  getFirestore, collection, addDoc, updateDoc, doc, deleteDoc, 
  getDocs, query, where, orderBy, Timestamp, limit, 
  startAfter, QuerySnapshot, DocumentData, getCountFromServer,
  enableIndexedDbPersistence, connectFirestoreEmulator
} from "firebase/firestore";
import { isFirebaseInitialized } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/contexts/FirestoreContext";

const BATCH_SIZE = 20;

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const { user } = useAuth();
  const { db, isReady, error: firestoreError } = useFirestore();
  const { toast } = useToast();
  
  useEffect(() => {
    if (firestoreError) {
      setError(firestoreError);
      setLoading(false);
    }
  }, [firestoreError]);
  
  const fetchReminders = useCallback(async (isRefresh = false) => {
    if (!user || !isReady || !db) {
      setReminders([]);
      setLoading(false);
      return;
    }
    
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);
      console.log("Fetching reminders for user:", user.uid);
      const startTime = performance.now();
      
      const remindersRef = collection(db, "reminders");
      
      try {
        if (!isRefresh) {
          const countQuery = query(remindersRef, where("userId", "==", user.uid));
          const countSnapshot = await getCountFromServer(countQuery);
          const count = countSnapshot.data().count;
          setTotalCount(count);
          console.log(`Total reminders: ${count}`);
          
          if (count === 0) {
            setReminders([]);
            setLoading(false);
            setHasMore(false);
            return;
          }
        }
      } catch (countErr) {
        console.warn("Error getting count, continuing without count:", countErr);
      }
      
      const q = query(
        remindersRef, 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(BATCH_SIZE)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.size === BATCH_SIZE);
      } else {
        setLastVisible(null);
        setHasMore(false);
      }
      
      const fetchedReminders = processQuerySnapshot(querySnapshot);
      
      const endTime = performance.now();
      console.log(`Fetched ${fetchedReminders.length} reminders in ${(endTime - startTime).toFixed(2)}ms`);
      
      setReminders(fetchedReminders);
    } catch (err: any) {
      console.error("Error fetching reminders:", err);
      setError(err);
      if (!isRefresh) {
        toast({
          title: "Error fetching reminders",
          description: "Please try again later",
          variant: "destructive",
        });
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, isReady, db, toast]);
  
  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);
  
  const refreshReminders = useCallback(async () => {
    return fetchReminders(true);
  }, [fetchReminders]);
  
  const processQuerySnapshot = (querySnapshot: QuerySnapshot<DocumentData>) => {
    const fetchedReminders: Reminder[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      try {
        const dueDate = data.dueDate instanceof Timestamp 
          ? data.dueDate.toDate() 
          : new Date(data.dueDate);
          
        const createdAt = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : data.createdAt ? new Date(data.createdAt) : new Date();
          
        const completedAt = data.completedAt instanceof Timestamp 
          ? data.completedAt.toDate() 
          : data.completedAt ? new Date(data.completedAt) : undefined;
        
        const reminder: Reminder = {
          ...data,
          id: doc.id,
          dueDate,
          createdAt,
          completedAt
        } as Reminder;
        
        fetchedReminders.push(reminder);
      } catch (err) {
        console.error("Error processing reminder document:", doc.id, err);
        // Continue processing other documents
      }
    });
    
    return fetchedReminders;
  };
  
  const loadMoreReminders = useCallback(async () => {
    if (!user || !isReady || !db || !lastVisible || !hasMore) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const remindersRef = collection(db, "reminders");
      const q = query(
        remindersRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(BATCH_SIZE)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.size === BATCH_SIZE);
        
        const newReminders = processQuerySnapshot(querySnapshot);
        setReminders(prev => [...prev, ...newReminders]);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("Error loading more reminders:", err);
      setError(err);
      toast({
        title: "Error loading more reminders",
        description: "Please try again later",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, isReady, db, lastVisible, hasMore, toast]);

  const activeReminders = reminders.filter(r => !r.completed);
  
  const urgentReminders = activeReminders.filter(reminder => {
    const now = new Date();
    const tomorrowSameTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return reminder.dueDate <= tomorrowSameTime;
  });
  
  const upcomingReminders = activeReminders.filter(reminder => {
    const now = new Date();
    const tomorrowSameTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return reminder.dueDate > tomorrowSameTime;
  });
  
  const completedReminders = reminders.filter(r => r.completed);
  
  useEffect(() => {
    if (reminders.length > 0) {
      console.log(`Reminders summary: ${reminders.length} total, ${activeReminders.length} active, ${urgentReminders.length} urgent, ${upcomingReminders.length} upcoming, ${completedReminders.length} completed`);
    }
  }, [reminders.length]);
  
  const handleCompleteReminder = async (id: string) => {
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
  
  const handleUndoComplete = async (id: string) => {
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
  
  const addReminder = async (reminder: Reminder) => {
    try {
      if (!user || !isReady || !db) {
        const newReminder = {
          ...reminder,
          id: reminder.id || uuidv4(),
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

  const updateReminder = async (updatedReminder: Reminder) => {
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
    reminders,
    loading,
    error,
    urgentReminders,
    upcomingReminders,
    completedReminders,
    handleCompleteReminder,
    handleUndoComplete,
    addReminder,
    updateReminder,
    loadMoreReminders,
    refreshReminders,
    hasMore,
    totalCount
  };
}
