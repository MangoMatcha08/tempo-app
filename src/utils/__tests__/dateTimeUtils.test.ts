
import {
  isDate,
  isConvertibleToDate,
  createDateWithTime,
  toZonedTime,
  fromZonedTime,
  parseTimeComponents,
  adjustDateIfPassed
} from '../dateUtils';

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
      pastDate.setHours(14, 30, 0, 0); // Set specific time
      
      // Get the adjusted date
      const result = adjustDateIfPassed(pastDate);
      
      // Create expected date (tomorrow with same time)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 30, 0, 0);
      
      expect(result.getDate()).toBe(tomorrow.getDate());
      expect(result.getMonth()).toBe(tomorrow.getMonth());
      expect(result.getFullYear()).toBe(tomorrow.getFullYear());
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });
  });

  describe('Time Components', () => {
    test('parseTimeComponents extracts correct components', () => {
      const date = new Date(2024, 3, 26, 14, 30);
      expect(parseTimeComponents(date)).toEqual({
        hours: 14,
        minutes: 30
      });
    });

    test('parseTimeComponents handles invalid input', () => {
      expect(parseTimeComponents(new Date('invalid'))).toBeNull();
    });
  });
});
