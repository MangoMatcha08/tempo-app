
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  collection, query, where, orderBy, limit, 
  startAfter, getDocs, getDoc, doc, updateDoc, 
  addDoc, deleteDoc, serverTimestamp, writeBatch,
  Timestamp, DocumentData, QueryDocumentSnapshot, getCountFromServer
} from 'firebase/firestore';
import { useFirestore } from '@/contexts/FirestoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useCallback } from 'react';
import { Reminder } from '@/types/reminderTypes';

// Constants
const BATCH_SIZE = 10;
const REMINDER_COLLECTION = 'reminders';

/**
 * Converts Firestore data to a Reminder object
 */
const convertToReminder = (doc: DocumentData): Reminder => {
  const data = doc.data();
  
  return {
    id: doc.id,
    title: data.title,
    description: data.description || '',
    dueDate: data.dueDate instanceof Timestamp 
      ? data.dueDate.toDate() 
      : new Date(data.dueDate),
    priority: data.priority,
    location: data.location,
    completed: data.completed || false,
    completedAt: data.completedAt instanceof Timestamp 
      ? data.completedAt.toDate() 
      : data.completedAt ? new Date(data.completedAt) : undefined,
    createdAt: data.createdAt instanceof Timestamp 
      ? data.createdAt.toDate() 
      : data.createdAt ? new Date(data.createdAt) : new Date(),
    userId: data.userId,
    category: data.category,
    periodId: data.periodId,
    checklist: data.checklist
  };
};

export function useReactQueryReminders() {
  const { db, isReady, isOnline } = useFirestore();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Fetch reminders count
  const reminderCountQuery = useQuery({
    queryKey: ['reminderCount', user?.uid],
    queryFn: async () => {
      if (!user?.uid || !db || !isReady) return 0;
      
      try {
        const countQuery = query(
          collection(db, REMINDER_COLLECTION),
          where('userId', '==', user.uid)
        );
        const snapshot = await getCountFromServer(countQuery);
        const count = snapshot.data().count;
        setTotalCount(count);
        return count;
      } catch (error) {
        console.error('Error fetching reminder count:', error);
        return 0;
      }
    },
    enabled: !!user?.uid && !!db && isReady,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Fetch reminders query with pagination
  const remindersQuery = useQuery({
    queryKey: ['reminders', user?.uid, lastVisible?.id || 'initial'],
    queryFn: async () => {
      if (!user?.uid || !db || !isReady) return { reminders: [], hasMore: false };
      
      try {
        let q = query(
          collection(db, REMINDER_COLLECTION),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(BATCH_SIZE)
        );
        
        // Apply pagination if there's a last visible document
        if (lastVisible) {
          q = query(
            collection(db, REMINDER_COLLECTION),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            startAfter(lastVisible),
            limit(BATCH_SIZE)
          );
        }
        
        const querySnapshot = await getDocs(q);
        const reminders: Reminder[] = [];
        
        querySnapshot.forEach((doc) => {
          reminders.push(convertToReminder(doc));
        });
        
        // Update last visible for pagination
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        
        return { 
          reminders, 
          hasMore: querySnapshot.size === BATCH_SIZE,
          lastVisible: lastDoc
        };
      } catch (error) {
        console.error('Error fetching reminders:', error);
        return { reminders: [], hasMore: false };
      }
    },
    enabled: !!user?.uid && !!db && isReady,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: isOnline, // Only refetch if online
    refetchOnMount: isOnline,
    refetchOnReconnect: isOnline,
  });
  
  // Load more reminders
  const loadMore = useCallback(() => {
    if (remindersQuery.data?.lastVisible) {
      setLastVisible(remindersQuery.data.lastVisible);
    }
  }, [remindersQuery.data?.lastVisible]);
  
  // Get a single reminder
  const getReminderById = useCallback(async (id: string) => {
    if (!db || !isReady) return null;
    
    try {
      const docRef = doc(db, REMINDER_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return convertToReminder(docSnap);
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching reminder ${id}:`, error);
      return null;
    }
  }, [db, isReady]);
  
  // Mutation for completing a reminder
  const completeReminderMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string, completed: boolean }) => {
      if (!db || !isReady) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, REMINDER_COLLECTION, id);
      const updateData = {
        completed,
        completedAt: completed ? serverTimestamp() : null
      };
      
      await updateDoc(docRef, updateData);
      return { id, ...updateData };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });
  
  // Mutation for adding a reminder
  const addReminderMutation = useMutation({
    mutationFn: async (reminder: Omit<Reminder, 'id'>) => {
      if (!db || !isReady) throw new Error('Firestore not initialized');
      if (!user?.uid) throw new Error('User not authenticated');
      
      const reminderWithUserId = {
        ...reminder,
        userId: user.uid,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, REMINDER_COLLECTION), reminderWithUserId);
      
      // Increment the total count
      setTotalCount(prev => prev + 1);
      
      return { id: docRef.id, ...reminderWithUserId };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminderCount'] });
    }
  });
  
  // Mutation for updating a reminder
  const updateReminderMutation = useMutation({
    mutationFn: async (reminder: Reminder) => {
      if (!db || !isReady) throw new Error('Firestore not initialized');
      
      const { id, ...data } = reminder;
      const docRef = doc(db, REMINDER_COLLECTION, id);
      
      await updateDoc(docRef, data);
      return reminder;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });
  
  // Mutation for deleting a reminder
  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!db || !isReady) throw new Error('Firestore not initialized');
      
      const docRef = doc(db, REMINDER_COLLECTION, id);
      await deleteDoc(docRef);
      
      // Decrement the total count
      setTotalCount(prev => Math.max(0, prev - 1));
      
      return id;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminderCount'] });
    }
  });
  
  // Mutation for batch completing reminders
  const batchCompleteRemindersMutation = useMutation({
    mutationFn: async ({ ids, completed }: { ids: string[], completed: boolean }) => {
      if (!db || !isReady) throw new Error('Firestore not initialized');
      
      const batch = writeBatch(db);
      const completedAt = completed ? serverTimestamp() : null;
      
      ids.forEach(id => {
        const docRef = doc(db, REMINDER_COLLECTION, id);
        batch.update(docRef, { completed, completedAt });
      });
      
      await batch.commit();
      return { ids, completed };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });
  
  return {
    // Queries
    remindersData: remindersQuery.data?.reminders || [],
    isLoadingReminders: remindersQuery.isLoading,
    isRefreshingReminders: remindersQuery.isRefetching,
    isErrorReminders: remindersQuery.isError,
    hasMore: remindersQuery.data?.hasMore || false,
    totalCount,
    
    // Query functions
    refreshReminders: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
    loadMore,
    getReminderById,
    
    // Mutations
    completeReminder: (id: string, completed: boolean = true) => 
      completeReminderMutation.mutate({ id, completed }),
    addReminder: (reminder: Omit<Reminder, 'id'>) => 
      addReminderMutation.mutate(reminder),
    updateReminder: (reminder: Reminder) => 
      updateReminderMutation.mutate(reminder),
    deleteReminder: (id: string) => 
      deleteReminderMutation.mutate(id),
    batchCompleteReminders: (ids: string[], completed: boolean = true) => 
      batchCompleteRemindersMutation.mutate({ ids, completed }),
  };
}
