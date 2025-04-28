
// Re-export from dateUtils for backward compatibility
import { 
  validateDate,
  validateDateRange,
  type DateValidationError,
  type DateValidationResult,
  type DateValidationOptions,
  DateFormats,
  DateValidationErrorType,
  ValidationErrorMessages
} from './dateUtils';

export {
  validateDate,
  validateDateRange,
  DateFormats,
  DateValidationErrorType,
  ValidationErrorMessages
};

export type {
  DateValidationError,
  DateValidationResult,
  DateValidationOptions
};
