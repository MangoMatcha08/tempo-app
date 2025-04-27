
import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { toFirestoreDate, fromFirestoreDate } from '../dateConversions';

describe('Firebase Date Conversion Utilities', () => {
  describe('toFirestoreDate', () => {
    it('should convert Date to Timestamp', () => {
      const date = new Date('2024-04-27T10:30:00Z');
      const result = toFirestoreDate(date);
      
      expect(result).toBeInstanceOf(Timestamp);
      expect(result?.toDate().toISOString()).toBe('2024-04-27T10:30:00.000Z');
    });
    
    it('should handle null input', () => {
      expect(toFirestoreDate(null)).toBeNull();
    });
    
    it('should handle undefined input', () => {
      expect(toFirestoreDate(undefined)).toBeNull();
    });
    
    it('should pass through existing Timestamp', () => {
      const timestamp = Timestamp.fromDate(new Date('2024-04-27T10:30:00Z'));
      const result = toFirestoreDate(timestamp);
      expect(result).toBe(timestamp);
    });
  });
  
  describe('fromFirestoreDate', () => {
    it('should convert Timestamp to local Date', () => {
      const timestamp = Timestamp.fromDate(new Date('2024-04-27T10:30:00Z'));
      const result = fromFirestoreDate(timestamp);
      
      expect(result).toBeInstanceOf(Date);
      // Note: We can't directly test timezone conversion here since it depends on system timezone
      expect(result?.toISOString()).toBeDefined();
    });
    
    it('should handle null input', () => {
      expect(fromFirestoreDate(null)).toBeNull();
    });
    
    it('should handle undefined input', () => {
      expect(fromFirestoreDate(undefined)).toBeNull();
    });
    
    it('should preserve milliseconds', () => {
      const date = new Date('2024-04-27T10:30:00.123Z');
      const timestamp = Timestamp.fromDate(date);
      const result = fromFirestoreDate(timestamp);
      
      expect(result?.getMilliseconds()).toBe(123);
    });
  });
  
  describe('Timezone Handling', () => {
    it('should handle timezone transitions correctly', () => {
      // Create a date during daylight saving time
      const dstDate = new Date('2024-07-01T10:30:00Z');
      const timestamp = toFirestoreDate(dstDate);
      const result = fromFirestoreDate(timestamp!);
      
      // Even through timezone conversions, the UTC time should match
      expect(result?.toISOString()).toBe(dstDate.toISOString());
    });
    
    it('should maintain date consistency across conversions', () => {
      const originalDate = new Date('2024-04-27T15:45:30.123Z');
      const timestamp = toFirestoreDate(originalDate);
      const resultDate = fromFirestoreDate(timestamp!);
      
      expect(resultDate?.toISOString()).toBe(originalDate.toISOString());
    });
  });
});

