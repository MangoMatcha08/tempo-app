
import { Timestamp } from 'firebase/firestore';

export function createTestDate(isoString: string): Date {
  return new Date(isoString);
}

export function createTestTimestamp(isoString: string): Timestamp {
  return Timestamp.fromDate(new Date(isoString));
}

export function assertDatesEqual(date1: Date | null, date2: Date | null): boolean {
  if (!date1 || !date2) return date1 === date2;
  return date1.getTime() === date2.getTime();
}

export function assertTimestampsEqual(ts1: Timestamp | null, ts2: Timestamp | null): boolean {
  if (!ts1 || !ts2) return ts1 === ts2;
  return ts1.seconds === ts2.seconds && ts1.nanoseconds === ts2.nanoseconds;
}

