
import { parseTimeString, createDateWithTime } from '@/utils/dateUtils';
import { mockPeriods } from '@/utils/reminderUtils';

export function applyPeriodTimeToDate(periodId: string | null, date: Date): Date {
  if (!periodId || periodId === 'none') {
    return date;
  }

  const selectedPeriod = mockPeriods.find(p => p.id === periodId);
  if (!selectedPeriod?.startTime) {
    return date;
  }

  const timeComponents = parseTimeString(selectedPeriod.startTime);
  if (!timeComponents) {
    return date;
  }

  return createDateWithTime(
    date,
    timeComponents.hours,
    timeComponents.minutes
  );
}
