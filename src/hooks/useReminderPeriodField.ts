
import { useState, useEffect, useRef } from 'react';
import { mockPeriods } from '@/utils/reminderUtils';
import { parseTimeString, createDateWithTime } from '@/utils/dateUtils';
import { toPSTTime } from '@/utils/dateTimeUtils';

export function useReminderPeriodField(
  initialPeriodId: string | null,
  onTimeUpdate: (newDate: Date) => void,
  currentDate: Date
) {
  const [periodId, setPeriodId] = useState(initialPeriodId || 'none');
  const lastProcessedDateRef = useRef<Date | null>(null);
  const lastProcessedPeriodRef = useRef<string | null>(null);

  useEffect(() => {
    // Only process if we have a valid period and either the date or period has changed
    if (periodId && 
        periodId !== 'none' && 
        (periodId !== lastProcessedPeriodRef.current || 
         !currentDate.getTime || 
         !lastProcessedDateRef.current || 
         currentDate.getTime() !== lastProcessedDateRef.current.getTime())) {
      
      const selectedPeriod = mockPeriods.find(p => p.id === periodId);
      
      if (selectedPeriod?.startTime) {
        const timeComponents = parseTimeString(selectedPeriod.startTime);
        if (timeComponents) {
          // Create a date with the period time in PST
          const updatedDate = createDateWithTime(
            currentDate,
            timeComponents.hours,
            timeComponents.minutes
          );
          
          // Ensure the date is in PST
          const pstDate = toPSTTime(updatedDate);
          
          // Update the refs to track what we've processed
          lastProcessedDateRef.current = pstDate;
          lastProcessedPeriodRef.current = periodId;
          
          // Only trigger the callback if we've actually made changes
          onTimeUpdate(pstDate);
        }
      }
    }
  }, [periodId, currentDate, onTimeUpdate]);

  return {
    periodId,
    setPeriodId,
    periods: mockPeriods
  };
}
