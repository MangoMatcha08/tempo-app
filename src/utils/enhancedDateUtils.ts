
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { mockPeriods } from './reminderUtils';
import { formatDate, formatWithTimezone, ensureValidDate } from './dateTransformations';

// Get user's timezone
export const getUserTimeZone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Format date with period context
export const formatDateWithPeriod = (date: Date, periodId?: string | null): string => {
  const validDate = ensureValidDate(date);
  const formattedTime = formatDate(validDate, 'h:mm a');
  
  if (periodId) {
    const period = mockPeriods.find(p => p.id === periodId);
    if (period) {
      return `${period.name} (${formattedTime})`;
    }
  }
  
  return formattedTime;
};

// Get relative time display
export const getRelativeTimeDisplay = (date: Date): string => {
  const now = new Date();
  const validDate = ensureValidDate(date);
  const diffMs = validDate.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (Math.abs(diffMins) < 60) {
    const suffix = diffMins >= 0 ? 'from now' : 'ago';
    const absoluteMins = Math.abs(diffMins);
    return `${absoluteMins} minute${absoluteMins !== 1 ? 's' : ''} ${suffix}`;
  }
  
  const diffHours = Math.floor(diffMins / 60);
  if (Math.abs(diffHours) < 24) {
    const suffix = diffHours >= 0 ? 'from now' : 'ago';
    const absoluteHours = Math.abs(diffHours);
    return `${absoluteHours} hour${absoluteHours !== 1 ? 's' : ''} ${suffix}`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  const suffix = diffDays >= 0 ? 'from now' : 'ago';
  const absoluteDays = Math.abs(diffDays);
  return `${absoluteDays} day${absoluteDays !== 1 ? 's' : ''} ${suffix}`;
};

// Get the nearest period time
export const getNearestPeriodTime = (date: Date): { periodId: string; startTime: Date } | null => {
  const targetTime = date.getTime();
  let nearestPeriod = null;
  let minDiff = Infinity;
  
  for (const period of mockPeriods) {
    const [hours, minutes] = period.startTime.split(':').map(Number);
    const periodDate = new Date(date);
    periodDate.setHours(hours, minutes, 0, 0);
    const diff = Math.abs(periodDate.getTime() - targetTime);
    
    if (diff < minDiff) {
      minDiff = diff;
      nearestPeriod = {
        periodId: period.id,
        startTime: periodDate
      };
    }
  }
  
  return nearestPeriod;
};

