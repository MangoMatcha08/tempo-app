import { addDays, addWeeks, addMonths, addYears, isEqual, isBefore } from 'date-fns';
import { ensureValidDate } from './enhancedDateUtils';
import { formatWithTimeZone } from './dateTransformations';

/**
 * Recurrence types supported by the system
 */
export enum RecurrenceType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

/**
 * Days of week for recurrence patterns
 */
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}

/**
 * Recurrence rule interface
 */
export interface RecurrenceRule {
  type: RecurrenceType;
  interval: number; // Every X days/weeks/months/years
  startDate: Date;
  endDate?: Date | null; // Optional end date
  count?: number | null; // Optional occurrence count
  daysOfWeek?: DayOfWeek[]; // For weekly recurrence
  dayOfMonth?: number; // For monthly recurrence
  exclusions?: Date[]; // Dates to exclude
}

/**
 * Validate a recurrence rule
 * @returns True if valid, false otherwise
 */
export function validateRecurrenceRule(rule: RecurrenceRule): boolean {
  if (rule.interval < 1) return false;
  
  // Ensure valid start date
  if (!rule.startDate || isNaN(rule.startDate.getTime())) return false;
  
  // If end date is provided, ensure it's after start date
  if (rule.endDate && !isNaN(rule.endDate.getTime())) {
    if (isBefore(rule.endDate, rule.startDate)) return false;
  }
  
  // Check count if provided
  if (rule.count !== undefined && rule.count !== null && rule.count < 1) return false;
  
  // For weekly recurrence, ensure days of week are provided
  if (rule.type === RecurrenceType.WEEKLY && (!rule.daysOfWeek || rule.daysOfWeek.length === 0)) {
    return false;
  }
  
  // For monthly recurrence, ensure day of month is valid
  if (rule.type === RecurrenceType.MONTHLY && (rule.dayOfMonth === undefined || rule.dayOfMonth < 1 || rule.dayOfMonth > 31)) {
    return false;
  }
  
  return true;
}

/**
 * Generate occurrence dates based on recurrence rule
 * @param rule Recurrence rule
 * @param maxOccurrences Maximum number of occurrences to generate
 * @returns Array of occurrence dates
 */
export function generateOccurrences(rule: RecurrenceRule, maxOccurrences: number = 100): Date[] {
  if (!validateRecurrenceRule(rule)) {
    console.error('Invalid recurrence rule:', rule);
    return [];
  }
  
  const occurrences: Date[] = [];
  const startDate = ensureValidDate(rule.startDate);
  const endDate = rule.endDate ? ensureValidDate(rule.endDate) : null;
  const maxCount = rule.count || maxOccurrences;
  
  // Function to check if a date should be included
  const shouldIncludeDate = (date: Date): boolean => {
    // Check end date boundary
    if (endDate && isBefore(endDate, date)) return false;
    
    // Check exclusions
    if (rule.exclusions && rule.exclusions.some(exclusion => 
      isEqual(ensureValidDate(exclusion), date)
    )) {
      return false;
    }
    
    // For weekly recurrence, check if day of week is included
    if (rule.type === RecurrenceType.WEEKLY && rule.daysOfWeek) {
      const dayOfWeek = date.getDay();
      if (!rule.daysOfWeek.includes(dayOfWeek)) {
        return false;
      }
    }
    
    // For monthly recurrence, check if it's the specified day of month
    if (rule.type === RecurrenceType.MONTHLY && rule.dayOfMonth) {
      if (date.getDate() !== rule.dayOfMonth) {
        return false;
      }
    }
    
    return true;
  };
  
  let currentDate = new Date(startDate);
  let count = 0;
  
  // Always include start date if it meets criteria
  if (shouldIncludeDate(currentDate)) {
    occurrences.push(new Date(currentDate));
    count++;
  }
  
  // Generate subsequent occurrences
  while (count < maxCount) {
    // Generate next date based on recurrence type
    switch (rule.type) {
      case RecurrenceType.DAILY:
        currentDate = addDays(currentDate, rule.interval);
        break;
      case RecurrenceType.WEEKLY:
        currentDate = addWeeks(currentDate, rule.interval);
        break;
      case RecurrenceType.MONTHLY:
        currentDate = addMonths(currentDate, rule.interval);
        break;
      case RecurrenceType.YEARLY:
        currentDate = addYears(currentDate, rule.interval);
        break;
      default:
        console.error('Unsupported recurrence type:', rule.type);
        return occurrences;
    }
    
    // Stop if we've passed the end date
    if (endDate && isBefore(endDate, currentDate)) {
      break;
    }
    
    if (shouldIncludeDate(currentDate)) {
      occurrences.push(new Date(currentDate));
      count++;
    }
  }
  
  return occurrences;
}

/**
 * Format a recurrence rule as human-readable text
 */
export function formatRecurrenceRule(rule: RecurrenceRule): string {
  if (!validateRecurrenceRule(rule)) {
    return "Invalid recurrence rule";
  }
  
  let description = "";
  
  switch (rule.type) {
    case RecurrenceType.DAILY:
      description = rule.interval === 1 ? "Daily" : `Every ${rule.interval} days`;
      break;
    case RecurrenceType.WEEKLY:
      if (rule.interval === 1) {
        description = "Weekly";
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          const days = rule.daysOfWeek.map(dayToString).join(", ");
          description += ` on ${days}`;
        }
      } else {
        description = `Every ${rule.interval} weeks`;
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          const days = rule.daysOfWeek.map(dayToString).join(", ");
          description += ` on ${days}`;
        }
      }
      break;
    case RecurrenceType.MONTHLY:
      if (rule.dayOfMonth) {
        description = rule.interval === 1 
          ? `Monthly on day ${rule.dayOfMonth}` 
          : `Every ${rule.interval} months on day ${rule.dayOfMonth}`;
      } else {
        description = rule.interval === 1 
          ? "Monthly" 
          : `Every ${rule.interval} months`;
      }
      break;
    case RecurrenceType.YEARLY:
      description = rule.interval === 1 
        ? "Yearly" 
        : `Every ${rule.interval} years`;
      break;
    default:
      description = "Custom recurrence";
  }
  
  // Add start date
  description += ` starting ${formatWithTimeZone(rule.startDate, 'MMM d, yyyy')}`;
  
  // Add end condition
  if (rule.endDate) {
    description += ` until ${formatWithTimeZone(rule.endDate, 'MMM d, yyyy')}`;
  } else if (rule.count) {
    description += `, ${rule.count} ${rule.count === 1 ? 'occurrence' : 'occurrences'}`;
  }
  
  return description;
}

/**
 * Convert day number to string representation
 */
function dayToString(day: DayOfWeek): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
}

/**
 * Check if a date matches a recurrence rule
 */
export function dateMatchesRecurrence(date: Date | string, rule: RecurrenceRule): boolean {
  if (!validateRecurrenceRule(rule)) {
    return false;
  }
  
  const targetDate = ensureValidDate(date);
  const occurrences = generateOccurrences(rule, 100);
  
  return occurrences.some(occurrence => 
    occurrence.getFullYear() === targetDate.getFullYear() &&
    occurrence.getMonth() === targetDate.getMonth() &&
    occurrence.getDate() === targetDate.getDate()
  );
}
