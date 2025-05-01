
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
  // Use dynamic import pattern instead of require
  import('./reminderUtils').then(module => {
    const periodName = module.getPeriodNameById(periodId);
    if (periodName) {
      return `${formattedTime} (${periodName})`;
    }
  });
  
  return formattedTime;
}

/**
 * Convert any date to PST time
 * Simplified to work in browser environments
 */
export function toPSTTime(date: Date): Date {
  if (!date) return new Date();
  
  try {
    // Create a new date to avoid mutating the original
    const result = new Date(date);
    
    // Format the date as an ISO string in the target timezone
    // This is browser-compatible and doesn't use require
    return new Date(
      new Date(date.toISOString())
        .toLocaleString('en-US', { timeZone: APP_TIMEZONE })
    );
  } catch (error) {
    console.error('Error converting to PST time:', error);
    return new Date(date);
  }
}
