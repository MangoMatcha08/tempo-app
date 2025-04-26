
// Core date types
export interface TimeComponents {
  hours: number;
  minutes: number;
}

// Validation types
export interface DateValidationError {
  type: string;
  message: string;
}

export interface DateValidationResult {
  isValid: boolean;
  sanitizedValue?: Date;
  errors: DateValidationError[];
}

export interface DateValidationOptions {
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  format?: string;
  timeZone?: string;
}

