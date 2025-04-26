
import { 
  parseTimeString,
  formatTimeString,
  formatDateRange,
  formatWithTimeZone,
  validateDate,
  validateDateRange,
  ensureValidDate,
  getUserTimeZone,
  toZonedTime,
  fromZonedTime
} from '../dateUtils';

describe('Date Utils', () => {
  describe('Core Functions', () => {
    test('ensureValidDate handles various inputs', () => {
      const date = new Date(2024, 3, 25);
      expect(ensureValidDate(date)).toEqual(date);
      
      const isoString = '2024-04-25T12:00:00Z';
      expect(ensureValidDate(isoString) instanceof Date).toBe(true);
      
      expect(() => ensureValidDate('not a date')).toThrow('Invalid date string');
      expect(() => ensureValidDate(undefined)).toThrow('Invalid date input');
      expect(() => ensureValidDate(null)).toThrow('Invalid date input');
    });
    
    test('parseTimeString handles various formats', () => {
      expect(parseTimeString('3:00 PM')).toEqual({ hours: 15, minutes: 0 });
      expect(parseTimeString('9:45 AM')).toEqual({ hours: 9, minutes: 45 });
      expect(parseTimeString('14:30')).toEqual({ hours: 14, minutes: 30 });
      expect(parseTimeString('invalid')).toBeNull();
    });
  });
  
  describe('Formatting Functions', () => {
    test('formatTimeString formats correctly', () => {
      const date = new Date(2024, 3, 25, 14, 30);
      expect(formatTimeString(date)).toMatch(/2:30 [PpMm]/);
    });
    
    test('formatDateRange handles same day and different days', () => {
      const start = new Date(2024, 3, 25, 9, 0);
      const end = new Date(2024, 3, 25, 10, 30);
      expect(formatDateRange(start, end)).toContain('Apr 25, 2024');
      
      const end2 = new Date(2024, 3, 26, 10, 30);
      expect(formatDateRange(start, end2)).toContain('Apr 26, 2024');
    });
  });
  
  describe('Timezone Functions', () => {
    test('timezone conversion works correctly', () => {
      const utcDate = new Date('2024-04-25T12:00:00Z');
      const zonedDate = toZonedTime(utcDate, 'UTC');
      const backToUtc = fromZonedTime(zonedDate, 'UTC');
      
      expect(backToUtc.toISOString()).toBe(utcDate.toISOString());
      expect(getUserTimeZone()).toBeTruthy();
    });
  });
  
  describe('Validation Functions', () => {
    test('validateDate handles required dates', () => {
      const result = validateDate(undefined, { required: true });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('REQUIRED');
    });
    
    test('validateDateRange validates correctly', () => {
      const start = new Date(2024, 3, 1);
      const end = new Date(2024, 3, 2);
      const result = validateDateRange(start, end);
      expect(result.isValid).toBe(true);
      
      const invalidEnd = new Date(2024, 2, 31);
      const invalid = validateDateRange(start, invalidEnd);
      expect(invalid.isValid).toBe(false);
    });
  });
});
