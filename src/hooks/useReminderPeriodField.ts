
import { useState, useEffect, useRef } from 'react';
import { mockPeriods } from '@/utils/reminderUtils';
import { parseTimeString, createDateWithTime } from '@/utils/dateUtils';

export function useReminderPeriodField(
  initialPeriodId: string | null,
  onTimeUpdate: (newDate: Date) => void,
  currentDate: Date
) {
  const [periodId, setPeriodId] = useState(initialPeriodId || 'none');
  const lastUpdateRef = useRef<Date>(currentDate);

  useEffect(() => {
    if (periodId && periodId !== 'none') {
      const selectedPeriod = mockPeriods.find(p => p.id === periodId);
      
      if (selectedPeriod?.startTime) {
        const timeComponents = parseTimeString(selectedPeriod.startTime);
        if (timeComponents) {
          const updatedDate = createDateWithTime(
            currentDate,
            timeComponents.hours,
            timeComponents.minutes
          );
          
          // Only update if the date has actually changed, using ref instead of state
          if (updatedDate.getTime() !== lastUpdateRef.current.getTime()) {
            lastUpdateRef.current = updatedDate;
            onTimeUpdate(updatedDate);
          }
        }
      }
    }

    // Cleanup function to prevent memory leaks
    return () => {
      lastUpdateRef.current = currentDate;
    };
  }, [periodId, currentDate, onTimeUpdate]); // Removed lastUpdatedDate from deps

  return {
    periodId,
    setPeriodId,
    periods: mockPeriods
  };
}
