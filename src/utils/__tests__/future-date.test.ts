
import { validateDate, DateValidationErrorType } from '../dateUtils';

describe('Future Date Validation', () => {
  it('should correctly validate future dates when not allowed', () => {
    // Use a date that's definitely in the future
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1); // One year from now
    
    const result = validateDate(futureDate, { allowFutureDates: false });
    
    // Debug output
    console.log('Future date test:', {
      date: futureDate.toISOString(),
      isValid: result.isValid,
      errors: result.errors
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors[0].type).toBe(DateValidationErrorType.OUT_OF_RANGE);
  });
});
