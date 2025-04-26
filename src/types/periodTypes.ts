
export interface Period {
  id: string;
  name: string;
  startTime: string | Date; // Can be either ISO date string or Date object
  endTime: string | Date;   // Can be either ISO date string or Date object
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
