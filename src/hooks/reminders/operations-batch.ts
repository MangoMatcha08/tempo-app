import { doc, collection, addDoc, Timestamp, writeBatch } from "firebase/firestore";
import { Reminder } from "@/types/reminderTypes";
import { useReminderOperationsCore } from "./operations-core";
import { convertToUtc, convertToLocal } from "@/utils/dateTimeUtils";

/**
 * Provides batch operations for reminders (complete multiple, add multiple, update multiple, delete multiple)
 */
export function useBatchReminderOperations(user: any, db: any, isReady: boolean) {
  const {
    setError,
    cacheReminder,
    invalidateReminder,
    isOfflineMode,
    showErrorToast
  } = useReminderOperationsCore(user, db, isReady);

  const batchCompleteReminders = async (
    ids: string[], 
    completed: boolean, 
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>
  ): Promise<boolean> => {
    let originalReminders: Reminder[] = [];
    const completedAt = completed ? convertToUtc(new Date()) : undefined;
    
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
      
      if (isOfflineMode()) {
        return true;
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
      return true;
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
      
      showErrorToast("Changes were not saved. Please try again later.");
      return false;
    }
  };

  const batchAddReminders = async (
    reminders: Omit<Reminder, 'id'>[],
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
    setTotalCount: React.Dispatch<React.SetStateAction<number>>
  ): Promise<Reminder[]> => {
    const tempIds: string[] = [];
    const tempReminders: Reminder[] = [];
    
    try {
      reminders.forEach(reminder => {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        tempIds.push(tempId);
        tempReminders.push({
          ...reminder,
          id: tempId,
          createdAt: reminder.createdAt ? convertToUtc(new Date(reminder.createdAt)) : convertToUtc(new Date())
        } as Reminder);
      });
      
      setReminders(prev => {
        const updatedReminders = [...tempReminders, ...prev];
        return updatedReminders;
      });
      
      setTotalCount(prev => prev + reminders.length);
      
      if (isOfflineMode()) {
        console.log("Adding reminders (local only, optimistic):", tempReminders);
        tempReminders.forEach(reminder => cacheReminder(reminder));
        return tempReminders;
      }
      
      console.log("Adding reminders to Firestore batch:", reminders.length);
      
      const batch = writeBatch(db);
      const remindersRef = collection(db, "reminders");
      const reminderDocRefs: any[] = [];
      
      reminders.forEach(reminder => {
        const createdAtUtc = reminder.createdAt ? convertToUtc(new Date(reminder.createdAt)) : convertToUtc(new Date());
        const dueDateUtc = convertToUtc(reminder.dueDate);
        const completedAtUtc = reminder.completedAt ? convertToUtc(reminder.completedAt) : undefined;
        
        const firestoreReminder = {
          title: reminder.title,
          description: reminder.description,
          userId: user.uid,
          createdAt: Timestamp.fromDate(createdAtUtc),
          dueDate: Timestamp.fromDate(dueDateUtc),
          completed: reminder.completed || false,
          completedAt: completedAtUtc ? Timestamp.fromDate(completedAtUtc) : null,
          priority: reminder.priority,
          periodId: reminder.periodId,
          category: reminder.category,
          checklist: reminder.checklist
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
      
      showErrorToast("Your reminders were not saved. Please try again later.");
      
      return [];
    }
  };

  const batchUpdateReminders = async (
    updatedReminders: Reminder[],
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>
  ): Promise<boolean> => {
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
      
      if (isOfflineMode()) {
        console.log("Updating reminders (local only, optimistic):", updatedReminders);
        return true;
      }
      
      console.log("Updating reminders in Firestore batch:", updatedReminders.length);
      
      const batch = writeBatch(db);
      
      updatedReminders.forEach(reminder => {
        const createdAtUtc = reminder.createdAt ? convertToUtc(new Date(reminder.createdAt)) : convertToUtc(new Date());
        const dueDateUtc = convertToUtc(reminder.dueDate);
        const completedAtUtc = reminder.completedAt ? convertToUtc(reminder.completedAt) : undefined;
        const reminderData = {
          ...reminder,
          dueDate: Timestamp.fromDate(dueDateUtc),
          createdAt: Timestamp.fromDate(createdAtUtc),
          completedAt: completedAtUtc ? Timestamp.fromDate(completedAtUtc) : null
        };
        
        const { id, ...firestoreData } = reminderData;
        const reminderRef = doc(db, "reminders", reminder.id);
        batch.update(reminderRef, firestoreData);
      });
      
      await batch.commit();
      console.log("Batch update successful");
      
      setError(null);
      return true;
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
      
      showErrorToast("Your changes were not saved. Please try again later.");
      
      return false;
    }
  };

  const batchDeleteReminders = async (
    ids: string[],
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
    setTotalCount: React.Dispatch<React.SetStateAction<number>>
  ): Promise<boolean> => {
    let originalReminders: Reminder[] = [];
    
    try {
      setReminders(prev => {
        originalReminders = prev
          .filter(r => ids.includes(r.id))
          .map(r => ({ ...r }));
        
        return prev.filter(r => !ids.includes(r.id));
      });
      
      setTotalCount(prev => prev - ids.length);
      
      if (isOfflineMode()) {
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
      
      showErrorToast("Your reminders were not deleted. Please try again later.");
      
      return false;
    }
  };

  return {
    batchCompleteReminders,
    batchAddReminders,
    batchUpdateReminders,
    batchDeleteReminders
  };
}
