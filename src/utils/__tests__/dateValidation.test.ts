
import { 
  validateDate,
  validateDateRange,
  DateValidationErrorType,
  DateFormats
} from '../dateValidation';

describe('Date Validation', () => {
  describe('validateDate', () => {
    it('should validate required dates', () => {
      const result = validateDate(undefined, { required: true });
      expect(result.isValid).toBeFalsy();
      expect(result.errors[0].type).toBe(DateValidationErrorType.REQUIRED);
    });

    it('should validate date formats', () => {
      const result = validateDate('invalid-date');
      expect(result.isValid).toBeFalsy();
      expect(result.errors[0].type).toBe(DateValidationErrorType.INVALID_FORMAT);
    });

    it('should validate minimum date constraint', () => {
      const minDate = new Date('2024-01-01');
      const result = validateDate('2023-12-31', { minDate });
      expect(result.isValid).toBeFalsy();
      expect(result.errors[0].type).toBe(DateValidationErrorType.BEFORE_MIN_DATE);
    });

    it('should validate maximum date constraint', () => {
      const maxDate = new Date('2024-01-01');
      const result = validateDate('2024-02-01', { maxDate });
      expect(result.isValid).toBeFalsy();
      expect(result.errors[0].type).toBe(DateValidationErrorType.AFTER_MAX_DATE);
    });

    it('should validate past dates constraint', () => {
      const pastDate = new Date('2023-01-01');
      const result = validateDate(pastDate, { allowPastDates: false });
      expect(result.isValid).toBeFalsy();
      expect(result.errors[0].type).toBe(DateValidationErrorType.OUT_OF_RANGE);
    });

    it('should validate future dates constraint', () => {
      const futureDate = new Date('2025-01-01');
      const result = validateDate(futureDate, { allowFutureDates: false });
      expect(result.isValid).toBeFalsy();
      expect(result.errors[0].type).toBe(DateValidationErrorType.OUT_OF_RANGE);
    });
  });

  describe('validateDateRange', () => {
    it('should validate start date before end date', () => {
      const result = validateDateRange(
        new Date('2024-02-01'),
        new Date('2024-01-01')
      );
      expect(result.isValid).toBeFalsy();
      expect(result.endDate.errors[0].type).toBe(DateValidationErrorType.BEFORE_MIN_DATE);
    });

    it('should validate date range within bounds', () => {
      const minDate = new Date('2024-01-01');
      const maxDate = new Date('2024-12-31');
      const result = validateDateRange(
        new Date('2023-12-31'),
        new Date('2025-01-01'),
        { minDate, maxDate }
      );
      expect(result.isValid).toBeFalsy();
      expect(result.startDate.errors[0].type).toBe(DateValidationErrorType.BEFORE_MIN_DATE);
      expect(result.endDate.errors[0].type).toBe(DateValidationErrorType.AFTER_MAX_DATE);
    });
  });
});
