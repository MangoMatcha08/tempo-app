
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Reminder } from '@/types/reminderTypes';
import { useReminderCache } from './use-reminder-cache';

interface OptimisticAction {
  id: string;
  type: 'create' | 'update' | 'delete' | 'complete' | 'uncomplete';
  data?: any;
  timestamp: number;
  retryCount: number;
}

interface OptimisticState {
  pendingActions: OptimisticAction[];
  pendingReminders: Map<string, boolean>; // Map of reminder IDs to pending state
}

export function useOptimisticOperations() {
  const [state, setState] = useState<OptimisticState>({
    pendingActions: [],
    pendingReminders: new Map()
  });
  const { toast } = useToast();
  const { cacheReminder, invalidateReminder } = useReminderCache();
  
  // Add a reminder to pending state
  const markReminderPending = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      pendingReminders: new Map(prev.pendingReminders).set(id, true)
    }));
  }, []);
  
  // Remove a reminder from pending state
  const markReminderComplete = useCallback((id: string) => {
    setState(prev => {
      const newMap = new Map(prev.pendingReminders);
      newMap.delete(id);
      return {
        ...prev,
        pendingReminders: newMap
      };
    });
  }, []);
  
  // Check if a reminder is pending
  const isReminderPending = useCallback((id: string): boolean => {
    return state.pendingReminders.has(id);
  }, [state.pendingReminders]);
  
  // Optimistically create a reminder
  const optimisticCreateReminder = useCallback((
    reminder: Reminder,
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
    setTotalCount: React.Dispatch<React.SetStateAction<number>>,
    actualCreateFn: (reminder: Reminder) => Promise<Reminder>
  ) => {
    // Generate a temporary ID if one doesn't exist
    const tempId = reminder.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const optimisticReminder = { 
      ...reminder, 
      id: tempId
    };
    
    // Add to UI immediately
    setReminders(prev => [optimisticReminder, ...prev]);
    setTotalCount(prev => prev + 1);
    
    // Mark as pending
    markReminderPending(tempId);
    
    // Add to cache
    cacheReminder(optimisticReminder);
    
    // Call actual create function
    actualCreateFn(optimisticReminder)
      .then(serverReminder => {
        // Update with server ID and data
        setReminders(prev => 
          prev.map(r => r.id === tempId ? serverReminder : r)
        );
        
        // Update in cache
        cacheReminder(serverReminder);
        
        // Remove pending state
        markReminderComplete(tempId);
      })
      .catch(error => {
        console.error("Error creating reminder:", error);
        
        // Remove optimistic update
        setReminders(prev => prev.filter(r => r.id !== tempId));
        setTotalCount(prev => prev - 1);
        
        // Remove pending state
        markReminderComplete(tempId);
        
        // Show error toast
        toast({
          title: "Error Creating Reminder",
          description: "Your reminder couldn't be saved. Please try again.",
          variant: "destructive"
        });
        
        // Remove from cache
        invalidateReminder(tempId);
      });
      
    return optimisticReminder;
  }, [markReminderPending, markReminderComplete, cacheReminder, invalidateReminder, toast]);
  
  // Optimistically update a reminder
  const optimisticUpdateReminder = useCallback((
    updatedReminder: Reminder,
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
    actualUpdateFn: (reminder: Reminder) => Promise<Reminder>
  ) => {
    // Store original reminder for rollback
    let originalReminder: Reminder | undefined;
    
    // Update UI immediately
    setReminders(prev => {
      // Store original for potential rollback
      originalReminder = prev.find(r => r.id === updatedReminder.id);
      
      return prev.map(reminder => 
        reminder.id === updatedReminder.id ? updatedReminder : reminder
      );
    });
    
    // Mark as pending
    markReminderPending(updatedReminder.id);
    
    // Add to cache
    cacheReminder(updatedReminder);
    
    // Call actual update function
    actualUpdateFn(updatedReminder)
      .then(serverReminder => {
        // Update with server data
        setReminders(prev => 
          prev.map(r => r.id === updatedReminder.id ? serverReminder : r)
        );
        
        // Update in cache
        cacheReminder(serverReminder);
        
        // Remove pending state
        markReminderComplete(updatedReminder.id);
      })
      .catch(error => {
        console.error("Error updating reminder:", error);
        
        // Rollback to original
        if (originalReminder) {
          setReminders(prev => 
            prev.map(r => r.id === updatedReminder.id ? originalReminder! : r)
          );
          
          // Update cache with original
          cacheReminder(originalReminder);
        }
        
        // Remove pending state
        markReminderComplete(updatedReminder.id);
        
        // Show error toast
        toast({
          title: "Error Updating Reminder",
          description: "Your changes couldn't be saved. Please try again.",
          variant: "destructive"
        });
      });
      
    return updatedReminder;
  }, [markReminderPending, markReminderComplete, cacheReminder, toast]);
  
  // Optimistically delete a reminder
  const optimisticDeleteReminder = useCallback((
    id: string,
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
    setTotalCount: React.Dispatch<React.SetStateAction<number>>,
    actualDeleteFn: (id: string) => Promise<boolean>
  ) => {
    // Store deleted reminder for rollback
    let deletedReminder: Reminder | undefined;
    
    // Remove from UI immediately
    setReminders(prev => {
      // Store for potential rollback
      deletedReminder = prev.find(r => r.id === id);
      
      return prev.filter(r => r.id !== id);
    });
    
    // Update count
    setTotalCount(prev => prev - 1);
    
    // Call actual delete function
    actualDeleteFn(id)
      .then(success => {
        if (success) {
          // Remove from cache
          invalidateReminder(id);
        } else {
          // Rollback if server returned false
          if (deletedReminder) {
            setReminders(prev => [...prev, deletedReminder!]);
            setTotalCount(prev => prev + 1);
            cacheReminder(deletedReminder);
          }
          
          toast({
            title: "Error Deleting Reminder",
            description: "The reminder couldn't be removed. Please try again.",
            variant: "destructive"
          });
        }
      })
      .catch(error => {
        console.error("Error deleting reminder:", error);
        
        // Rollback on error
        if (deletedReminder) {
          setReminders(prev => [...prev, deletedReminder!]);
          setTotalCount(prev => prev + 1);
          cacheReminder(deletedReminder);
        }
        
        toast({
          title: "Error Deleting Reminder",
          description: "The reminder couldn't be removed. Please try again.",
          variant: "destructive"
        });
      });
      
    return true;
  }, [invalidateReminder, cacheReminder, toast]);
  
  // Optimistically complete a reminder
  const optimisticCompleteReminder = useCallback((
    id: string,
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
    actualCompleteFn: (id: string) => Promise<boolean>
  ) => {
    const now = new Date();
    let originalState: boolean | undefined;
    let originalCompletedAt: Date | null | undefined;
    
    // Update UI immediately
    setReminders(prev => {
      return prev.map(reminder => {
        if (reminder.id === id) {
          // Store original state
          originalState = reminder.completed;
          originalCompletedAt = reminder.completedAt;
          
          // Return updated reminder
          return { 
            ...reminder, 
            completed: true, 
            completedAt: now
          };
        }
        return reminder;
      });
    });
    
    // Mark as pending
    markReminderPending(id);
    
    // Update cache
    const cachedReminder = getDetailedReminder(id);
    if (cachedReminder) {
      cacheReminder({
        ...cachedReminder,
        completed: true,
        completedAt: now
      });
    }
    
    // Call actual complete function
    actualCompleteFn(id)
      .then(success => {
        if (success) {
          // Remove pending state
          markReminderComplete(id);
        } else {
          // Rollback on server failure
          setReminders(prev => {
            return prev.map(reminder => {
              if (reminder.id === id) {
                return {
                  ...reminder,
                  completed: originalState || false,
                  completedAt: originalCompletedAt || null
                };
              }
              return reminder;
            });
          });
          
          // Update cache with original state
          if (cachedReminder) {
            cacheReminder({
              ...cachedReminder,
              completed: originalState || false,
              completedAt: originalCompletedAt || null
            });
          }
          
          // Remove pending state
          markReminderComplete(id);
          
          toast({
            title: "Error Completing Reminder",
            description: "Your change couldn't be saved. Please try again.",
            variant: "destructive"
          });
        }
      })
      .catch(error => {
        console.error("Error completing reminder:", error);
        
        // Rollback on error
        setReminders(prev => {
          return prev.map(reminder => {
            if (reminder.id === id) {
              return {
                ...reminder,
                completed: originalState || false,
                completedAt: originalCompletedAt || null
              };
            }
            return reminder;
          });
        });
        
        // Update cache with original state
        if (cachedReminder) {
          cacheReminder({
            ...cachedReminder,
            completed: originalState || false,
            completedAt: originalCompletedAt || null
          });
        }
        
        // Remove pending state
        markReminderComplete(id);
        
        toast({
          title: "Error Completing Reminder",
          description: "Your change couldn't be saved. Please try again.",
          variant: "destructive"
        });
      });
      
    return true;
  }, [markReminderPending, markReminderComplete, cacheReminder, toast]);
  
  // Optimistically uncomplete a reminder
  const optimisticUncompleteReminder = useCallback((
    id: string,
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
    actualUncompleteFn: (id: string) => Promise<boolean>
  ) => {
    let originalState: boolean | undefined;
    let originalCompletedAt: Date | null | undefined;
    
    // Update UI immediately
    setReminders(prev => {
      return prev.map(reminder => {
        if (reminder.id === id) {
          // Store original state
          originalState = reminder.completed;
          originalCompletedAt = reminder.completedAt;
          
          // Return updated reminder
          return { 
            ...reminder, 
            completed: false, 
            completedAt: null
          };
        }
        return reminder;
      });
    });
    
    // Mark as pending
    markReminderPending(id);
    
    // Update cache
    const cachedReminder = getDetailedReminder(id);
    if (cachedReminder) {
      cacheReminder({
        ...cachedReminder,
        completed: false,
        completedAt: null
      });
    }
    
    // Call actual uncomplete function
    actualUncompleteFn(id)
      .then(success => {
        if (success) {
          // Remove pending state
          markReminderComplete(id);
        } else {
          // Rollback on server failure
          setReminders(prev => {
            return prev.map(reminder => {
              if (reminder.id === id) {
                return {
                  ...reminder,
                  completed: originalState || false,
                  completedAt: originalCompletedAt || null
                };
              }
              return reminder;
            });
          });
          
          // Update cache with original state
          if (cachedReminder) {
            cacheReminder({
              ...cachedReminder,
              completed: originalState || false,
              completedAt: originalCompletedAt || null
            });
          }
          
          // Remove pending state
          markReminderComplete(id);
          
          toast({
            title: "Error Updating Reminder",
            description: "Your change couldn't be saved. Please try again.",
            variant: "destructive"
          });
        }
      })
      .catch(error => {
        console.error("Error uncompleting reminder:", error);
        
        // Rollback on error
        setReminders(prev => {
          return prev.map(reminder => {
            if (reminder.id === id) {
              return {
                ...reminder,
                completed: originalState || false,
                completedAt: originalCompletedAt || null
              };
            }
            return reminder;
          });
        });
        
        // Update cache with original state
        if (cachedReminder) {
          cacheReminder({
            ...cachedReminder,
            completed: originalState || false,
            completedAt: originalCompletedAt || null
          });
        }
        
        // Remove pending state
        markReminderComplete(id);
        
        toast({
          title: "Error Updating Reminder",
          description: "Your change couldn't be saved. Please try again.",
          variant: "destructive"
        });
      });
      
    return true;
  }, [markReminderPending, markReminderComplete, cacheReminder, toast]);
  
  return {
    optimisticCreateReminder,
    optimisticUpdateReminder,
    optimisticDeleteReminder,
    optimisticCompleteReminder,
    optimisticUncompleteReminder,
    isReminderPending,
    pendingReminders: state.pendingReminders
  };
}
