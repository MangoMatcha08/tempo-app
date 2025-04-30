
import { useState, useEffect } from 'react';
import { mockPeriods } from '@/utils/reminderUtils';
import { parseTimeString, createDateWithTime } from '@/utils/dateUtils';
import { toPSTTime } from '@/utils/dateTimeUtils';

export function useReminderPeriodField(
  initialPeriodId: string | null,
  onTimeUpdate: (newDate: Date) => void,
  currentDate: Date
) {
  const [periodId, setPeriodId] = useState(initialPeriodId || 'none');

  useEffect(() => {
    if (periodId && periodId !== 'none') {
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
