
import { useState, useEffect } from 'react';
import { mockPeriods } from '@/utils/reminderUtils';
import { parseTimeString, createDateWithTime } from '@/utils/dateUtils';

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
          const updatedDate = createDateWithTime(
            currentDate,
            timeComponents.hours,
            timeComponents.minutes
          );
          onTimeUpdate(updatedDate);
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
