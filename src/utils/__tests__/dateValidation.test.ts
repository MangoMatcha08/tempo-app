
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

    it('should validate date ranges', () => {
      const minDate = new Date('2024-01-01');
      const result = validateDate('2023-12-31', { minDate });
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
      expect(result.endDate.errors[0].type).toBe(DateValidationErrorType.OUT_OF_RANGE);
    });
  });
});
