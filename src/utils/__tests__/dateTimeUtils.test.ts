import {
  isDate,
  isConvertibleToDate,
  createDateWithTime,
  toLocalTime,
  toUtcTime,
  parseTimeComponents,
  adjustDateIfPassed
} from '@/utils/dateUtils';

describe('Date Time Utils', () => {
  describe('Type Guards', () => {
    test('isDate validates Date objects correctly', () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date('invalid'))).toBe(false);
      expect(isDate('2024-04-26')).toBe(false);
      expect(isDate(null)).toBe(false);
    });

    test('isConvertibleToDate checks convertible values', () => {
      expect(isConvertibleToDate('2024-04-26')).toBe(true);
      expect(isConvertibleToDate(new Date())).toBe(true);
      expect(isConvertibleToDate('invalid')).toBe(false);
      expect(isConvertibleToDate(null)).toBe(false);
    });
  });

  describe('Date Creation', () => {
    test('createDateWithTime creates correct date', () => {
      const baseDate = new Date('2024-04-26T00:00:00Z');
      const result = createDateWithTime(baseDate, 14, 30);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    test('adjustDateIfPassed moves past dates forward', () => {
      // Create a date that's definitely in the past (yesterday)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      pastDate.setHours(0, 0, 0, 0); // Set to midnight for consistent testing
      
      // Get the adjusted date
      const result = adjustDateIfPassed(pastDate);
      
      // Tomorrow's date for comparison
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Set to midnight for consistent comparison
      
      // Compare the dates (just the day, month, year)
      expect(result.getDate()).toBe(tomorrow.getDate());
      expect(result.getMonth()).toBe(tomorrow.getMonth());
      expect(result.getFullYear()).toBe(tomorrow.getFullYear());
    });
  });

  describe('Time Conversions', () => {
    test('toLocalTime handles various inputs', () => {
      const date = new Date();
      expect(isDate(toLocalTime(date))).toBe(true);
      expect(isDate(toLocalTime('2024-04-26'))).toBe(true);
      expect(isDate(toLocalTime('invalid'))).toBe(true); // Returns current date
    });

    test('toUtcTime handles various inputs', () => {
      const date = new Date();
      expect(isDate(toUtcTime(date))).toBe(true);
      expect(isDate(toUtcTime('2024-04-26'))).toBe(true);
      expect(isDate(toUtcTime('invalid'))).toBe(true); // Returns current date
    });
  });

  describe('Time Components', () => {
    test('parseTimeComponents extracts correct components', () => {
      const date = new Date('2024-04-26T14:30:00Z');
      const components = parseTimeComponents(date);
      expect(components).toEqual({
        hours: expect.any(Number),
        minutes: expect.any(Number)
      });
    });

    test('parseTimeComponents handles invalid input', () => {
      expect(parseTimeComponents('invalid')).toBeNull();
      expect(parseTimeComponents(null)).toBeNull();
    });
  });
});
