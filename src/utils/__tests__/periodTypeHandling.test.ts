
import { Period, isPeriod, ensurePeriodDates } from '@/types/periodTypes';
import { calculateOverlapDuration, doPeriodsOverlap } from '@/utils/periodManagement';
import { format } from 'date-fns';

describe('Period Type Handling', () => {
  const createTestPeriod = (overrides: Partial<Period> = {}): Period => ({
    id: 'test-period',
    name: 'Test Period',
    startTime: new Date('2023-01-01T09:00:00'),
    endTime: new Date('2023-01-01T10:00:00'),
    type: 'core',
    ...overrides
  });

  describe('isPeriod type guard', () => {
    it('should correctly identify a valid Period object', () => {
      const validPeriod = createTestPeriod();
      expect(isPeriod(validPeriod)).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(isPeriod(null)).toBe(false);
      expect(isPeriod({})).toBe(false);
      expect(isPeriod({ id: 123 })).toBe(false);
    });
  });

  describe('ensurePeriodDates', () => {
    it('should convert string dates to Date objects', () => {
      const periodWithStringDates = {
        id: 'test-period',
        name: 'Test Period',
        startTime: '2023-01-01T09:00:00',
        endTime: '2023-01-01T10:00:00',
      };

      const ensuredPeriod = ensurePeriodDates(periodWithStringDates);
      
      expect(ensuredPeriod.startTime).toBeInstanceOf(Date);
      expect(ensuredPeriod.endTime).toBeInstanceOf(Date);
      expect(format(ensuredPeriod.startTime, 'yyyy-MM-dd HH:mm')).toBe('2023-01-01 09:00');
    });

    it('should keep existing Date objects', () => {
      const validPeriod = createTestPeriod();
      const ensuredPeriod = ensurePeriodDates(validPeriod);
      
      expect(ensuredPeriod).toEqual(validPeriod);
    });
  });

  describe('Period Overlap Calculations', () => {
    it('should correctly detect period overlap', () => {
      const period1 = createTestPeriod({
        startTime: new Date('2023-01-01T09:00:00'),
        endTime: new Date('2023-01-01T10:00:00')
      });

      const period2 = createTestPeriod({
        startTime: new Date('2023-01-01T09:30:00'),
        endTime: new Date('2023-01-01T10:30:00')
      });

      const period3 = createTestPeriod({
        startTime: new Date('2023-01-01T10:30:00'),
        endTime: new Date('2023-01-01T11:30:00')
      });

      expect(doPeriodsOverlap(period1, period2)).toBe(true);
      expect(doPeriodsOverlap(period1, period3)).toBe(false);
    });

    it('should calculate correct overlap duration', () => {
      const period1 = createTestPeriod({
        startTime: new Date('2023-01-01T09:00:00'),
        endTime: new Date('2023-01-01T10:00:00')
      });

      const period2 = createTestPeriod({
        startTime: new Date('2023-01-01T09:30:00'),
        endTime: new Date('2023-01-01T10:30:00')
      });

      const overlapDuration = calculateOverlapDuration(period1, period2);
      expect(overlapDuration).toBe(30);
    });
  });
});
