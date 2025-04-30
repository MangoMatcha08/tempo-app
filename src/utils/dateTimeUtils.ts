
// Re-export from dateUtils for backward compatibility
export * from './dateUtils';

// Hard-coded PST timezone for all users
export const APP_TIMEZONE = 'America/Los_Angeles';

// Fix the debugDate export issue by ensuring it's not exported twice
export const dateTimeUtilsVersion = '1.0.0';

// Helper to get a consistent timezone for the application
export function getAppTimeZone(): string {
  return APP_TIMEZONE; // Always return PST timezone
}

/**
 * Formats a date to show the period name if available
 */
export function formatDateWithPeriodName(date: Date, periodId?: string | null): string {
  if (!date) return '';
  
  const formattedTime = date.toLocaleTimeString('en-US', { 
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: APP_TIMEZONE
  });
  
  if (!periodId) return formattedTime;
  
  // Import at runtime to avoid circular dependencies
  const { getPeriodNameById } = require('./reminderUtils');
  const periodName = getPeriodNameById(periodId);
  
  if (periodName) {
    return `${formattedTime} (${periodName})`;
  }
  
  return formattedTime;
}

/**
 * Convert any date to PST time
 */
export function toPSTTime(date: Date): Date {
  if (!date) return new Date();
  const { formatInTimeZone } = require('date-fns-tz');
  return new Date(formatInTimeZone(date, APP_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"));
}
