
export interface Period {
  id: string;
  name: string;
  startTime: Date | string; 
  endTime: Date | string;
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

/**
 * Helper to convert any time value to a Date
 */
export function toPeriodDate(time: Date | string): Date {
  if (time instanceof Date) {
    return time;
  }
  return new Date(time);
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
    (value.startTime instanceof Date || typeof value.startTime === 'string') &&
    (value.endTime instanceof Date || typeof value.endTime === 'string')
  );
}

/**
 * Helper function to ensure Period objects have Date objects for startTime and endTime
 */
export function ensurePeriodDates(period: any): Period {
  if (!isPeriod(period)) {
    throw new Error('Invalid period object');
  }
  
  return {
    ...period,
    startTime: toPeriodDate(period.startTime),
    endTime: toPeriodDate(period.endTime)
  };
}
