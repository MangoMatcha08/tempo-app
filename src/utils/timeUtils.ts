
/**
 * Formats a date into a readable time string
 */
export const formatTime = (date: Date | any): string => {
  // Validate input is a proper date
  try {
    const validDate = ensureValidDate(date);
    return validDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error("Error formatting time:", error, date);
    return "--:--";
  }
};

/**
 * Formats a date into a full date string
 */
export const formatFullDate = (date: Date | any): string => {
  try {
    const validDate = ensureValidDate(date);
    return validDate.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    console.error("Error formatting full date:", error, date);
    return "Invalid date";
  }
};

/**
 * Gets the difference between two dates in days
 */
export const getDaysDifference = (date1: Date | any, date2: Date | any): number => {
  try {
    // Convert to UTC dates to avoid timezone issues
    const validDate1 = ensureValidDate(date1);
    const validDate2 = ensureValidDate(date2);
    
    const utc1 = Date.UTC(validDate1.getFullYear(), validDate1.getMonth(), validDate1.getDate());
    const utc2 = Date.UTC(validDate2.getFullYear(), validDate2.getMonth(), validDate2.getDate());
    
    // Convert to days
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    
    return Math.floor((utc2 - utc1) / MS_PER_DAY);
  } catch (error) {
    console.error("Error calculating days difference:", error, { date1, date2 });
    return 0;
  }
};

/**
 * Checks if a date is today
 */
export const isToday = (date: Date | any): boolean => {
  try {
    const validDate = ensureValidDate(date);
    const today = new Date();
    return validDate.getDate() === today.getDate() &&
      validDate.getMonth() === today.getMonth() &&
      validDate.getFullYear() === today.getFullYear();
  } catch (error) {
    console.error("Error checking if date is today:", error, date);
    return false;
  }
};

/**
 * Formats time with school period context
 * Returns period name with time in parentheses
 */
import { format } from 'date-fns';
import { mockPeriods } from '@/utils/reminderUtils';

// Helper function to ensure valid date objects
export function ensureValidDate(date: any): Date {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  
  // Handle Firestore Timestamp objects
  if (date && typeof date.toDate === 'function') {
    return date.toDate();
  }
  
  // Handle ISO string dates
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  
  // If all else fails, return current date as fallback
  console.warn('Invalid date encountered in timeUtils, using current date as fallback', date);
  return new Date();
}

export function formatTimeWithPeriod(date: Date | any, periodId?: string): string {
  try {
    const validDate = ensureValidDate(date);
    
    console.log('[formatTimeWithPeriod] Input:', { 
      date: validDate.toISOString(), 
      periodId 
    });
    
    // If we have a period ID, use the period's defined time
    if (periodId) {
      const period = mockPeriods.find(p => p.id === periodId);
      
      if (period) {
        console.log('[formatTimeWithPeriod] Found period:', period);
        
        // Use the period's start time if available
        if (period.startTime) {
          // Extract hours and minutes from period start time
          const [hours, minutes] = period.startTime.split(':').map(Number);
          
          // Create a formatted time string for display
          const periodTime = format(
            new Date().setHours(hours, minutes, 0, 0), 
            'h:mm a'
          );
          
          console.log(`[formatTimeWithPeriod] Using period time: ${periodTime}`);
          return `${period.name} (${periodTime})`;
        }
      }
    }
    
    // If no period found or no start time, fall back to the reminder's own time
    const formattedTime = format(validDate, 'h:mm a');
    console.log(`[formatTimeWithPeriod] Using reminder time: ${formattedTime}`);
    
    // Try to find matching period for this time
    const hours = validDate.getHours();
    const period = mockPeriods.find(p => {
      const [startHour] = p.startTime.split(':').map(Number);
      const [endHour] = p.endTime.split(':').map(Number);
      return hours >= startHour && hours < endHour;
    });
    
    if (period) {
      return `${period.name} (${formattedTime})`;
    }
    
    return formattedTime;
  } catch (error) {
    console.error("Error formatting time with period:", error, { date, periodId });
    return format(new Date(), 'h:mm a');
  }
}

/**
 * Gets priority color class based on priority level
 */
export const getPriorityColorClass = (priority: string): string => {
  switch (priority?.toLowerCase() || '') {
    case 'high':
      return 'text-red-500 bg-red-50';
    case 'medium':
      return 'text-amber-500 bg-amber-50';
    case 'low':
      return 'text-blue-500 bg-blue-50';
    default:
      return 'text-slate-500 bg-slate-50';
  }
};

/**
 * Gets border color class based on priority level
 */
export const getPriorityBorderClass = (priority: string): string => {
  switch (priority?.toLowerCase() || '') {
    case 'high':
      return 'border-red-500';
    case 'medium':
      return 'border-amber-500';
    case 'low':
      return 'border-blue-500';
    default:
      return 'border-slate-500';
  }
};
