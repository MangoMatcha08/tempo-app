
import { useState } from 'react';
import { mockPeriods } from '@/utils/reminderUtils';

export function useReminderPeriodField(initialPeriodId: string | null) {
  const [periodId, setPeriodId] = useState(initialPeriodId || 'none');

  return {
    periodId,
    setPeriodId,
    periods: mockPeriods
  };
}
