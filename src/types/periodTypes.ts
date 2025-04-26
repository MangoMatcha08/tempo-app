
export interface Period {
  id: string;
  name: string;
  startTime: Date; 
  endTime: Date;
  type?: 'core' | 'elective' | 'planning' | 'meeting' | 'other';
  title?: string;            // Add title as optional for backward compatibility
  isRecurring?: boolean;     // Add support for recurring periods
  daysOfWeek?: number[];     // Days of week for recurring periods
  location?: string;         // Optional location
  notes?: string;            // Optional notes
}

export interface PeriodValidationResult {
  isValid: boolean;
  error?: string;
  conflictingPeriods?: Period[];
}

export interface DateWithPeriod {
  date: Date;
  periodId?: string;
}

// Re-export PeriodType for backward compatibility
export type PeriodType = 'core' | 'elective' | 'planning' | 'meeting' | 'other';

// Recurrence types that were missing
export enum RecurrenceType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

export interface RecurrenceRule {
  type: RecurrenceType;
  interval: number;
  startDate: Date;
  endDate?: Date | null;
  count?: number | null;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  exclusions?: Date[];
}

/**
 * Type guard to check if a value is a Period object
 */
export function isPeriod(value: any): value is Period {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    value.startTime instanceof Date &&
    value.endTime instanceof Date
  );
}

/**
 * Helper function to ensure Period objects have Date objects for startTime and endTime
 */
export function ensurePeriodDates(period: any): Period {
  if (isPeriod(period)) {
    return period;
  }
  
  // If startTime or endTime are strings, convert them to Date objects
  const startTime = period.startTime instanceof Date ? 
    period.startTime : new Date(period.startTime);
    
  const endTime = period.endTime instanceof Date ?
    period.endTime : new Date(period.endTime);
    
  return {
    ...period,
    startTime,
    endTime
  };
}
