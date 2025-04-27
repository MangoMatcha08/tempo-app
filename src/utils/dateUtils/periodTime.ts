
import { Period } from '@/types/periodTypes';
import { ensureValidDate } from './core';
import { adjustDateIfPassed } from './adjustment';
import { parseTimeString } from './core';

/**
 * Applies a period's start time to a date
 */
export function applyPeriodTime(date: Date, period: Period): Date {
  if (!period.startTime) {
    console.warn('Period has no start time:', period);
    return date;
  }
  
  const validDate = ensureValidDate(date);
  
  // Handle string time format (HH:mm)
  if (typeof period.startTime === 'string') {
    const timeComponents = parseTimeString(period.startTime);
    if (!timeComponents) {
      console.error('Invalid period start time format:', period.startTime);
      return validDate;
    }
    
    const dateWithTime = new Date(validDate);
    dateWithTime.setHours(timeComponents.hours, timeComponents.minutes, 0, 0);
    return adjustDateIfPassed(dateWithTime);
  }
  
  // Handle Date object
  if (period.startTime instanceof Date) {
    const dateWithTime = new Date(validDate);
    dateWithTime.setHours(
      period.startTime.getHours(),
      period.startTime.getMinutes(),
      0,
      0
    );
    return adjustDateIfPassed(dateWithTime);
  }
  
  console.error('Unsupported period start time format:', period.startTime);
  return validDate;
}

/**
 * Validates if a periodId exists in the given periods array
 */
export function validatePeriodId(periodId: string, periods: Period[]): boolean {
  return periods.some(p => p.id === periodId);
}

/**
 * Gets a period by ID with type safety
 */
export function getPeriodById(periodId: string, periods: Period[]): Period | null {
  return periods.find(p => p.id === periodId) || null;
}

/**
 * Type guard to check if a period has valid time components
 */
export function hasPeriodTime(period: Period): boolean {
  if (!period.startTime) return false;
  
  if (typeof period.startTime === 'string') {
    const timeComponents = parseTimeString(period.startTime);
    return timeComponents !== null;
  }
  
  return period.startTime instanceof Date;
}
