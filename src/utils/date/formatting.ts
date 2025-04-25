import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { validateDate } from './validation';
import { mockPeriods } from '@/utils/reminderUtils';

export function formatDate(
  date: Date | string | null | undefined,
  formatStr: string = 'yyyy-MM-dd',
  timeZone?: string
): string {
  const validation = validateDate(date, { timeZone });
  
  if (!validation.isValid || !validation.sanitizedValue) {
    console.warn('Invalid date provided to formatDate:', date);
    return '';
  }
  
  try {
    return format(validation.sanitizedValue, formatStr);
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
}

export function formatTimeWithPeriod(
  date: Date | string | null | undefined,
  periodId?: string
): string {
  const validation = validateDate(date);
  
  if (!validation.isValid || !validation.sanitizedValue) {
    return '';
  }
  
  const timeStr = format(validation.sanitizedValue, 'h:mm a');
  
  if (!periodId) {
    return timeStr;
  }
  
  const period = mockPeriods.find(p => p.id === periodId);
  return period ? `${period.name} (${timeStr})` : timeStr;
}
