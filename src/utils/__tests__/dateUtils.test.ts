import { 
  parseStringToDate, 
  formatDate,
  isDateInRange,
  areDatesEqual,
  formatWithTimezone
} from '../dateTransformations';
import {
  parseTimeString,
  formatTimeString,
  formatDateRange,
  convertToUtc,
  convertToLocal
} from '../dateTimeUtils';
import {
  ensureValidDate,
  getUserTimeZone,
  getRelativeTimeDisplay,
  formatDateWithPeriod
} from '../enhancedDateUtils';
import {
  RecurrenceType,
  validateRecurrenceRule,
  generateOccurrences
} from '../recurringDatePatterns';
import { dateCache, memoizeDateFn } from '../dateOperationsCache';
import { vi } from 'vitest';

describe('Date Transformation Tests', () => {
  test('parseStringToDate handles various formats', () => {
    const date1 = parseStringToDate('2023-04-25');
    expect(date1?.getFullYear()).toBe(2023);
    expect(date1?.getMonth()).toBe(3); // April is 3 (0-indexed)
    
    const date2 = parseStringToDate('04/25/2023');
    expect(date2?.getMonth()).toBe(3);
    expect(date2?.getDate()).toBe(25);
    
    const date3 = parseStringToDate('invalid date');
    expect(date3).toBeNull();
  });
  
  test('formatDate returns correct format', () => {
    const date = new Date(2023, 3, 25, 14, 30); // April 25, 2023, 2:30 PM
    expect(formatDate(date, 'yyyy-MM-dd')).toBe('2023-04-25');
    expect(formatDate(date, 'h:mm a')).toMatch(/2:30 [PpMm]/); // Account for locale differences
  });
  
  test('isDateInRange returns correct boolean', () => {
    const start = new Date(2023, 3, 1);
    const end = new Date(2023, 3, 30);
    const inside = new Date(2023, 3, 15);
    const outside = new Date(2023, 2, 15);
    
    expect(isDateInRange(inside, start, end)).toBe(true);
    expect(isDateInRange(outside, start, end)).toBe(false);
    expect(isDateInRange(start, start, end)).toBe(true);
    expect(isDateInRange(end, start, end)).toBe(true);
  });
  
  test('areDatesEqual compares dates correctly', () => {
    const date1 = new Date(2023, 3, 25, 14, 30);
    const date2 = new Date(2023, 3, 25, 14, 30);
    const date3 = new Date(2023, 3, 25, 14, 31);
    
    expect(areDatesEqual(date1, date2)).toBe(true);
    expect(areDatesEqual(date1, date3)).toBe(false);
    expect(areDatesEqual(date1, '2023-04-25T14:30:00')).toBe(true);
  });
});

describe('DateTime Utilities Tests', () => {
  test('parseTimeString parses time correctly', () => {
    const time1 = parseTimeString('3:00 PM');
    expect(time1.hours).toBe(15);
    expect(time1.minutes).toBe(0);
    
    const time2 = parseTimeString('9:45 AM');
    expect(time2.hours).toBe(9);
    expect(time2.minutes).toBe(45);
    
    const time3 = parseTimeString('14:30');
    expect(time3.hours).toBe(14);
    expect(time3.minutes).toBe(30);
  });
  
  test('formatTimeString formats time correctly', () => {
    const date = new Date(2023, 3, 25, 14, 30);
    expect(formatTimeString(date)).toMatch(/2:30 [PpMm]/);
    
    const morning = new Date(2023, 3, 25, 9, 15);
    expect(formatTimeString(morning)).toMatch(/9:15 [AaMm]/);
  });
  
  test('formatDateRange formats date range correctly', () => {
    const start = new Date(2023, 3, 25, 9, 0);
    const end = new Date(2023, 3, 25, 10, 30);
    const range = formatDateRange(start, end);
    expect(range).toContain('Apr 25, 2023');
    expect(range).toContain('9:00');
    expect(range).toContain('10:30');
    
    const multiDay = formatDateRange(
      new Date(2023, 3, 25, 9, 0),
      new Date(2023, 3, 26, 10, 30)
    );
    expect(multiDay).toContain('Apr 25');
    expect(multiDay).toContain('Apr 26');
  });
  
  test('timezone conversion works correctly', () => {
    const date = new Date('2023-04-25T12:00:00Z');
    const utcDate = convertToUtc(date);
    const localDate = convertToLocal(date);
    
    // Test that UTC conversion preserves the timestamp
    expect(utcDate.getTime()).toBe(date.getTime());
    expect(localDate instanceof Date).toBe(true);
    // Local time should be different from UTC time
    expect(localDate.getTime()).not.toBe(utcDate.getTime());
  });
});

describe('Enhanced Date Utilities Tests', () => {
  test('ensureValidDate handles various inputs', () => {
    const dateObj = new Date(2023, 3, 25);
    expect(ensureValidDate(dateObj) instanceof Date).toBe(true);
    
    const isoString = '2023-04-25T12:00:00Z';
    expect(ensureValidDate(isoString) instanceof Date).toBe(true);
    
    const invalid = 'not a date';
    expect(ensureValidDate(invalid) instanceof Date).toBe(true);
  });
  
  test('getUserTimeZone returns a timezone string', () => {
    expect(typeof getUserTimeZone()).toBe('string');
    expect(getUserTimeZone().length).toBeGreaterThan(0);
  });
  
  test('getRelativeTimeDisplay formats relative time correctly', () => {
    const now = new Date();
    const future = new Date(now.getTime() + 60 * 60 * 1000);
    const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    expect(getRelativeTimeDisplay(future)).toContain('from now');
    expect(getRelativeTimeDisplay(past)).toContain('ago');
  });
});

describe('Recurring Date Patterns Tests', () => {
  test('validateRecurrenceRule validates rules correctly', () => {
    const validRule = {
      type: RecurrenceType.DAILY,
      interval: 1,
      startDate: new Date()
    };
    expect(validateRecurrenceRule(validRule)).toBe(true);
    
    const invalidRule = {
      type: RecurrenceType.DAILY,
      interval: 0,
      startDate: new Date()
    };
    expect(validateRecurrenceRule(invalidRule)).toBe(false);
  });
  
  test('generateOccurrences creates correct pattern', () => {
    const startDate = new Date(2023, 3, 1);
    const rule = {
      type: RecurrenceType.DAILY,
      interval: 2,
      startDate,
      count: 5
    };
    
    const occurrences = generateOccurrences(rule);
    expect(occurrences.length).toBe(5);
    expect(occurrences[1].getDate()).toBe(3);
    expect(occurrences[2].getDate()).toBe(5);
  });
});

describe('Date Operations Cache Tests', () => {
  beforeEach(() => {
    dateCache.clear();
  });
  
  test('memoizeDateFn caches function results', () => {
    const originalFn = vi.fn().mockImplementation((a: number, b: number) => a + b);
    const memoizedFn = memoizeDateFn('add', originalFn);
    
    expect(memoizedFn(2, 3)).toBe(5);
    expect(originalFn).toHaveBeenCalledTimes(1);
    
    expect(memoizedFn(2, 3)).toBe(5);
    expect(originalFn).toHaveBeenCalledTimes(1);
    
    expect(memoizedFn(3, 4)).toBe(7);
    expect(originalFn).toHaveBeenCalledTimes(2);
  });
  
  test('cache expires correctly', async () => {
    const originalFn = vi.fn().mockImplementation((a: number) => a * 2);
    dateCache.setDefaultExpiry(100); // Short expiry for testing
    const memoizedFn = memoizeDateFn('multiply', originalFn);
    
    expect(memoizedFn(5)).toBe(10);
    expect(originalFn).toHaveBeenCalledTimes(1);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(memoizedFn(5)).toBe(10);
    expect(originalFn).toHaveBeenCalledTimes(2);
  });
});
