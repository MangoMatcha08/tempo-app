export interface Period {
  id: string;
  name: string;
  startTime: Date; // Changed from string | Date to just Date
  endTime: Date;   // Changed from string | Date to just Date
  type?: 'core' | 'elective' | 'planning' | 'meeting' | 'other';
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
