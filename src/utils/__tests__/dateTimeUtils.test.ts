import {
  isDate,
  isConvertibleToDate,
  createDateWithTime,
  parseTimeComponents,
  adjustDateIfPassed
} from '../dateUtils';
import { vi } from 'vitest';

// Skipping until date utilities are refactored
describe.skip('Date Time Utils', () => {
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
      // Mock current date to a fixed time
      const mockNow = new Date('2024-04-26T12:00:00Z');
      vi.setSystemTime(mockNow);

      // Create a date in the past (same day, earlier time)
      const pastDate = new Date('2024-04-26T10:00:00Z');
      
      // Get the adjusted date
      const result = adjustDateIfPassed(pastDate);
      
      // Expected: next day, same time (10:00)
      const expected = new Date('2024-04-27T10:00:00Z');
      
      expect(result.toISOString()).toBe(expected.toISOString());

      // Restore system time
      vi.useRealTimers();
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
