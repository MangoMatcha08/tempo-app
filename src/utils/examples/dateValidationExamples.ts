
import { validateDate, validateDateRange, DateFormats, DateValidationOptions } from '../dateValidation';

/**
 * Example of basic date validation
 */
export const basicDateValidation = () => {
  const result = validateDate('2024-04-25');
  console.log('Basic validation result:', result);
  return result;
};

/**
 * Example of date range validation
 */
export const dateRangeValidation = () => {
  const startDate = new Date('2024-04-25');
  const endDate = new Date('2024-04-26');
  const result = validateDateRange(startDate, endDate);
  console.log('Range validation result:', result);
  return result;
};

/**
 * Example of date validation with custom options
 */
export const advancedDateValidation = () => {
  const options: DateValidationOptions = {
    required: true,
    minDate: new Date('2024-01-01'),
    maxDate: new Date('2024-12-31'),
    allowFutureDates: true,
    allowPastDates: false,
    format: DateFormats.ISO
  };
  
  const result = validateDate(new Date('2024-04-25'), options);
  console.log('Advanced validation result:', result);
  return result;
};
