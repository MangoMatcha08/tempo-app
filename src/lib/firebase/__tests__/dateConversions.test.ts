
import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { toFirestoreDate, fromFirestoreDate } from '../dateConversions';
import { APP_TIMEZONE } from '@/utils/dateTimeUtils';
import { formatInTimeZone } from 'date-fns-tz';

describe('Firebase Date Conversion Utilities', () => {
  describe('toFirestoreDate', () => {
    it('should convert Date to Timestamp', () => {
      const date = new Date('2024-04-27T10:30:00.123Z');
      const result = toFirestoreDate(date);
      
      expect(result).toBeInstanceOf(Timestamp);
      expect(result?.toDate().toISOString()).toBe('2024-04-27T10:30:00.123Z');
    });
    
    it('should handle null input', () => {
      expect(toFirestoreDate(null)).toBeNull();
    });
    
    it('should handle undefined input', () => {
      expect(toFirestoreDate(undefined)).toBeNull();
    });
    
    it('should pass through existing Timestamp', () => {
      const timestamp = Timestamp.fromDate(new Date('2024-04-27T10:30:00.123Z'));
      const result = toFirestoreDate(timestamp);
      expect(result).toBe(timestamp);
    });
  });
  
  describe('fromFirestoreDate', () => {
    it('should convert Timestamp to PST Date', () => {
      const timestamp = Timestamp.fromDate(new Date('2024-04-27T10:30:00.123Z'));
      const result = fromFirestoreDate(timestamp);
      
      expect(result).toBeInstanceOf(Date);
      
      // Check if result is in PST
      const resultInPST = formatInTimeZone(
        result as Date, 
        APP_TIMEZONE,
        "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
      );
      const localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      console.log('Date in PST:', resultInPST);
      console.log('Local timezone:', localTZ);
      
      // The original date's UTC time should be maintained, just represented in PST timezone
      const pstTime = formatInTimeZone(
        new Date('2024-04-27T10:30:00.123Z'), 
        APP_TIMEZONE, 
        "HH:mm:ss.SSS"
      );
      
      const resultTime = formatInTimeZone(
        result as Date, 
        APP_TIMEZONE, 
        "HH:mm:ss.SSS"
      );
      
      expect(resultTime).toBe(pstTime);
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
      const dstDate = new Date('2024-07-01T10:30:00.123Z');
      const timestamp = toFirestoreDate(dstDate);
      const result = fromFirestoreDate(timestamp!);
      
      // Check that the UTC time representation is preserved
      const utcResult = new Date(result!.toISOString());
      expect(utcResult.getUTCHours()).toBe(dstDate.getUTCHours());
      expect(utcResult.getUTCMinutes()).toBe(dstDate.getUTCMinutes());
    });
    
    it('should maintain date consistency across conversions when viewed in PST', () => {
      const originalDate = new Date('2024-04-27T15:45:30.123Z');
      const timestamp = toFirestoreDate(originalDate);
      const resultDate = fromFirestoreDate(timestamp!);
      
      // Compare the dates when formatted in PST timezone
      const originalInPST = formatInTimeZone(
        originalDate, 
        APP_TIMEZONE, 
        "yyyy-MM-dd HH:mm:ss.SSS"
      );
      
      const resultInPST = formatInTimeZone(
        resultDate as Date, 
        APP_TIMEZONE, 
        "yyyy-MM-dd HH:mm:ss.SSS"
      );
      
      expect(resultInPST).toBe(originalInPST);
    });
  });
});
