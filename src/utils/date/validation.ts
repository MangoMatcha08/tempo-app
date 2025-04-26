
// Re-export from dateUtils for backward compatibility
import { 
  validateDate,
  validateDateRange,
  type DateValidationError,
  type DateValidationResult,
  type DateValidationOptions
} from '../dateUtils';

export {
  validateDate,
  validateDateRange
};

export type {
  DateValidationError,
  DateValidationResult, 
  DateValidationOptions
};
