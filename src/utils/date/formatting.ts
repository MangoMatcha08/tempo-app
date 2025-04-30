
// Re-export from dateUtils for backward compatibility
import { 
  formatDate,
  formatDateRange,
  formatWithTimeZone, 
  DateFormats
} from '../dateUtils';
import { APP_TIMEZONE, formatDateWithPeriodName } from '../dateTimeUtils';

export {
  formatDate,
  formatDateRange,
  formatWithTimeZone,
  DateFormats
};

export function formatTimeWithPeriod(date: Date, periodName?: string): string {
  return formatDateWithPeriodName(date, periodName ? 'period' : undefined);
}

// Format a time with the PST timezone
export function formatTimePST(date: Date): string {
  const timeString = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: APP_TIMEZONE
  });
  
  return timeString;
}
