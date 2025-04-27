
import { useState, useEffect, useRef } from 'react';
import { mockPeriods } from '@/utils/reminderUtils';
import { parseTimeString, createDateWithTime } from '@/utils/dateUtils';

export function useReminderPeriodField(
  initialPeriodId: string | null,
  onTimeUpdate: (newDate: Date) => void,
  currentDate: Date
) {
  const [periodId, setPeriodId] = useState(initialPeriodId || 'none');
  const prevDateRef = useRef<Date>(currentDate);

  useEffect(() => {
    // Only proceed if the date has actually changed
    if (periodId && periodId !== 'none' && 
        (!prevDateRef.current || prevDateRef.current.getTime() !== currentDate.getTime())) {
      
      console.log('Period effect running with new date:', currentDate);
      const selectedPeriod = mockPeriods.find(p => p.id === periodId);
      
      if (selectedPeriod?.startTime) {
        const timeComponents = parseTimeString(selectedPeriod.startTime);
        if (timeComponents) {
          const updatedDate = createDateWithTime(
            currentDate,
            timeComponents.hours,
            timeComponents.minutes
          );
          
          console.log('Updating time with period:', {
            periodId,
            currentDate: currentDate.toISOString(),
            updatedDate: updatedDate.toISOString()
          });
          
          onTimeUpdate(updatedDate);
        }
      }
      
      // Update ref after processing
      prevDateRef.current = currentDate;
    }
  }, [periodId, currentDate, onTimeUpdate]);

  return {
    periodId,
    setPeriodId,
    periods: mockPeriods
  };
}
