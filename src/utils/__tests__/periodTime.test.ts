
import { applyPeriodTime, validatePeriodId, getPeriodById, hasPeriodTime } from '../dateUtils';
import { Period } from '@/types/periodTypes';
import { vi } from 'vitest';

describe('Period Time Utilities', () => {
  const mockPeriod: Period = {
    id: 'test-1',
    name: 'Test Period',
    title: 'Test Period',
    startTime: '09:00',
    endTime: '10:00',
    type: 'core'
  };

  test('applyPeriodTime correctly applies string time', () => {
    const date = new Date('2024-04-27T00:00:00Z');
    const result = applyPeriodTime(date, mockPeriod);
    
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(0);
  });

  test('applyPeriodTime correctly applies Date time', () => {
    const periodWithDateTime: Period = {
      ...mockPeriod,
      startTime: new Date('2024-04-27T09:00:00Z')
    };
    
    const date = new Date('2024-04-27T00:00:00Z');
    const result = applyPeriodTime(date, periodWithDateTime);
    
    expect(result.getUTCHours()).toBe(9);
    expect(result.getUTCMinutes()).toBe(0);
  });

  test('validatePeriodId returns correct validation result', () => {
    const periods = [mockPeriod];
    
    expect(validatePeriodId('test-1', periods)).toBe(true);
    expect(validatePeriodId('invalid-id', periods)).toBe(false);
  });

  test('getPeriodById returns correct period', () => {
    const periods = [mockPeriod];
    
    expect(getPeriodById('test-1', periods)).toEqual(mockPeriod);
    expect(getPeriodById('invalid-id', periods)).toBeNull();
  });

  test('hasPeriodTime validates time correctly', () => {
    expect(hasPeriodTime(mockPeriod)).toBe(true);
    
    const invalidPeriod: Period = {
      ...mockPeriod,
      startTime: 'invalid'
    };
    expect(hasPeriodTime(invalidPeriod)).toBe(false);
  });
});
