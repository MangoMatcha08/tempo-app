
import { format } from 'date-fns';
import { ensureValidDate } from './dateCore';
import type { Period, PeriodType } from '@/types/periodTypes';

/**
 * Calculate the height of a period block based on its duration
 */
export function calculateHeight(
  startTime: string | Date, 
  endTime: string | Date, 
  heightPerHour: number = 60
): number {
  const start = ensureValidDate(startTime);
  const end = ensureValidDate(endTime);
  
  const durationMs = end.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  
  return Math.max(heightPerHour * durationHours, 20); // Minimum height of 20px
}

/**
 * Calculate the top position for a period block
 */
export function calculateTopPosition(
  startTime: string | Date,
  minHour: number,
  heightPerHour: number = 60
): number {
  const start = ensureValidDate(startTime);
  
  const startHour = start.getHours();
  const startMinutes = start.getMinutes();
  
  const hoursSinceMin = startHour - minHour;
  const minutesFraction = startMinutes / 60;
  
  return (hoursSinceMin + minutesFraction) * heightPerHour;
}

/**
 * Get period background color based on type
 */
export function getPeriodColor(type?: PeriodType): string {
  switch (type) {
    case 'core':
      return 'bg-blue-500 border-l-blue-700';
    case 'elective':
      return 'bg-rose-500 border-l-rose-700';
    case 'planning':
      return 'bg-emerald-500 border-l-emerald-700';
    case 'meeting':
      return 'bg-amber-500 border-l-amber-700';
    default:
      return 'bg-slate-500 border-l-slate-700';
  }
}

/**
 * Get reminder badge colors
 */
export function getReminderColors(): string[] {
  return [
    '#0EA5E9', // Ocean Blue
    '#F97316', // Bright Orange
    '#8B5CF6', // Vivid Purple
    '#D946EF', // Magenta Pink
    '#ea384c', // Red
  ];
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const validDate = ensureValidDate(date);
  return format(validDate, 'EEEE, MMMM d');
}

/**
 * Format time for display
 */
export function formatTime(time: Date | string): string {
  const validDate = ensureValidDate(time);
  return format(validDate, 'h:mm a');
}

/**
 * Get safe date object from period time
 */
export function getPeriodTimeAsDate(time: string | Date, baseDate?: Date): Date {
  return ensureValidDate(time);
}

/**
 * Compare two periods by start time
 */
export function comparePeriodTimes(a: Period, b: Period): number {
  const aTime = ensureValidDate(a.startTime).getTime();
  const bTime = ensureValidDate(b.startTime).getTime();
  return aTime - bTime;
}
