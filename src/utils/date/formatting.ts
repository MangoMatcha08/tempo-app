
// Re-export from dateUtils for backward compatibility
import { 
  formatDate,
  formatDateRange,
  formatWithTimeZone, 
  DateFormats
} from '../dateUtils';
import { APP_TIMEZONE } from '../dateTimeUtils';

export {
  formatDate,
  formatDateRange,
  formatWithTimeZone,
  DateFormats
};

// Format a time with period information
export function formatTimeWithPeriod(date: Date, periodName?: string): string {
  // Format time using PST timezone
  const timeString = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: APP_TIMEZONE
  });
  
  // Append period name if provided
  if (periodName) {
    return `${timeString} (${periodName})`;
  }
  
  return timeString;
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
