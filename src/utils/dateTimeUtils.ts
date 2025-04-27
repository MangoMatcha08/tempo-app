
import { addDays } from 'date-fns';
import { ensureValidDate, isDate } from './dateUtils/core';
import { toZonedTime, fromZonedTime } from './dateUtils/timezoneUtils';

export function createDateWithTime(date: Date, hours: number, minutes: number): Date {
  try {
    const validDate = ensureValidDate(date);
    const newDate = new Date(validDate);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  } catch (error) {
    console.error('Error creating date with time:', error);
    return new Date();
  }
}

export function toLocalTime(date: Date): Date {
  try {
    const validDate = ensureValidDate(date);
    return toZonedTime(validDate);
  } catch (error) {
    console.error('Error converting to local time:', error);
    return new Date();
  }
}

export function toUtcTime(date: Date): Date {
  try {
    const validDate = ensureValidDate(date);
    return fromZonedTime(validDate);
  } catch (error) {
    console.error('Error converting to UTC:', error);
    return new Date();
  }
}

export function parseTimeComponents(date: Date): { hours: number; minutes: number } | null {
  try {
    const validDate = ensureValidDate(date);
    return {
      hours: validDate.getHours(),
      minutes: validDate.getMinutes()
    };
  } catch {
    return null;
  }
}

