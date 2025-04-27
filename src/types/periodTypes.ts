
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

// Re-export PeriodType for backward compatibility
export type PeriodType = 'core' | 'elective' | 'planning' | 'meeting' | 'other';

export interface DateWithPeriod {
  date: Date;
  periodId?: string;
}

// Re-export Period validation utilities
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

