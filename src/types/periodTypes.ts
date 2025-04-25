
export interface Period {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
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
