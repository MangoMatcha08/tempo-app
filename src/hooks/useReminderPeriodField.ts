
import { useState, useEffect, useRef, useCallback } from 'react';
import { mockPeriods } from '@/utils/reminderUtils';
import { parseTimeString, createDateWithTime } from '@/utils/dateUtils';
import { Period } from '@/types/periodTypes';

/**
 * Hook to manage period selection and time synchronization for reminders
 * 
 * @param initialPeriodId - The initial period ID to select
 * @param onTimeUpdate - Callback for when time is updated due to period selection
 * @param currentDate - The current date to apply period time to
 * @returns Period selection state and methods
 */
export function useReminderPeriodField(
  initialPeriodId: string | null,
  onTimeUpdate: (newDate: Date) => void,
  currentDate: Date
) {
  // Track the currently selected period ID (use 'none' as default for no selection)
  const [periodId, setPeriodId] = useState(initialPeriodId || 'none');
  
  // Track the previous date to detect changes
  const prevDateRef = useRef<Date | null>(null);
  
  // Track the previous period ID to detect changes
  const prevPeriodIdRef = useRef<string | null>(null);
  
  // Track whether we've applied the initial period time
  const initialPeriodAppliedRef = useRef(false);
  
  /**
   * Find a period by its ID
   */
  const findPeriod = useCallback((id: string): Period | undefined => {
    return mockPeriods.find(p => p.id === id);
  }, []);
  
  /**
   * Apply a period's time to the current date
   */
  const applyPeriodTime = useCallback((date: Date, periodToApply: Period | undefined) => {
    if (!periodToApply?.startTime) return date;
    
    console.log('Applying period time', {
      period: periodToApply.name,
      startTime: periodToApply.startTime,
      currentDate: date.toISOString()
    });
    
    const timeComponents = parseTimeString(periodToApply.startTime);
    if (!timeComponents) return date;
    
    const updatedDate = createDateWithTime(
      date,
      timeComponents.hours,
      timeComponents.minutes
    );
    
    console.log('Time updated with period', {
      originalDate: date.toISOString(),
      updatedDate: updatedDate.toISOString()
    });
    
    return updatedDate;
  }, []);
  
  // Handle period selection changes and update time accordingly
  useEffect(() => {
    // Only process if we have a valid period ID (not 'none')
    if (periodId && periodId !== 'none') {
      const periodChanged = prevPeriodIdRef.current !== periodId;
      const dateChanged = prevDateRef.current ? 
        prevDateRef.current.getTime() !== currentDate.getTime() : 
        true;
      
      console.log('Period effect evaluation', {
        periodId,
        periodChanged,
        dateChanged,
        initialApplied: initialPeriodAppliedRef.current
      });
      
      // Apply period time if:
      // 1. We haven't applied the initial period time yet, or
      // 2. The period has changed, or
      // 3. The date has changed
      if (!initialPeriodAppliedRef.current || periodChanged || dateChanged) {
        const selectedPeriod = findPeriod(periodId);
        
        if (selectedPeriod) {
          const updatedDate = applyPeriodTime(currentDate, selectedPeriod);
          
          // Only update if the date actually changed
          if (updatedDate !== currentDate) {
            onTimeUpdate(updatedDate);
            initialPeriodAppliedRef.current = true;
          }
        }
      }
      
      // Update refs to track changes
      prevPeriodIdRef.current = periodId;
    }
    
    // Always update the date ref
    prevDateRef.current = currentDate;
  }, [periodId, currentDate, onTimeUpdate, applyPeriodTime, findPeriod]);
  
  // Handle initial period selection when the hook mounts
  useEffect(() => {
    // If we have an initial period ID and haven't applied it yet
    if (initialPeriodId && initialPeriodId !== 'none' && !initialPeriodAppliedRef.current) {
      setPeriodId(initialPeriodId);
    }
  }, [initialPeriodId]);
  
  return {
    periodId,
    setPeriodId,
    periods: mockPeriods,
    // Expose helper methods for external use
    findPeriod,
    applyPeriodTime
  };
}
