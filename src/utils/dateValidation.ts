
// Re-export from dateUtils/validation for backward compatibility
import { 
  validateDate as validateDateFn,
  validateDateRange as validateDateRangeFn,
  type DateValidationError,
  type DateValidationResult,
  type DateValidationOptions,
  DateFormats,
  DateValidationErrorType,
  ValidationErrorMessages
} from './dateUtils';

export {
  validateDateFn as validateDate,
  validateDateRangeFn as validateDateRange,
  DateFormats,
  DateValidationErrorType,
  ValidationErrorMessages
};

export type {
  DateValidationError,
  DateValidationResult,
  DateValidationOptions
};
