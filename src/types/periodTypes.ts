
export interface Period {
  id: string;
  name: string;
  startTime: string | Date;
  endTime: string | Date;
  type?: 'core' | 'other';
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

