
// Re-export from dateUtils for backward compatibility
import { 
  formatDate,
  formatDateRange,
  formatWithTimeZone, 
  DateFormats
} from '../dateUtils';

export {
  formatDate,
  formatDateRange,
  formatWithTimeZone,
  DateFormats
};

/**
 * Format a date with period information
 */
export function formatTimeWithPeriod(date: Date, periodName?: string): string {
  const timeString = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  if (periodName) {
    return `${timeString} (${periodName})`;
  }
  
  return timeString;
}
