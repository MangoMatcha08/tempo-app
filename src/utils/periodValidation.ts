import { Period, PeriodValidationResult } from '@/types/periodTypes';
import { format } from 'date-fns';
import { ensureValidDate, parseTimeString } from './dateCore';

export function validatePeriodTime(date: Date, periodId: string, periods: Period[]): PeriodValidationResult {
  const period = periods.find(p => p.id === periodId);
  
  if (!period) {
    return {
      isValid: false,
      error: 'Invalid period selected'
    };
  }
  
  try {
    const periodStart = ensureValidDate(period.startTime);
    const periodEnd = ensureValidDate(period.endTime);
    const validDate = ensureValidDate(date);
    
    const startFormatted = format(periodStart, 'HH:mm');
    const endFormatted = format(periodEnd, 'HH:mm');
    const dateFormatted = format(validDate, 'HH:mm');
    
    const isAfterStart = dateFormatted >= startFormatted;
    const isBeforeEnd = dateFormatted <= endFormatted;
    
    if (!isAfterStart || !isBeforeEnd) {
      return {
        isValid: false,
        error: `Time must be within period hours (${startFormatted} - ${endFormatted})`
      };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('Error validating period time:', error);
    return {
      isValid: false,
      error: 'Error validating period time'
    };
  }
}

export function detectPeriodConflicts(
  date: Date,
  periodId: string,
  periods: Period[]
): PeriodValidationResult {
  const selectedPeriod = periods.find(p => p.id === periodId);
  if (!selectedPeriod) {
    return {
      isValid: false,
      error: 'Invalid period selected'
    };
  }
  
  const validDate = ensureValidDate(date);
  const selectedStartTime = ensureValidDate(selectedPeriod.startTime);
  const selectedEndTime = ensureValidDate(selectedPeriod.endTime);
  
  const conflictingPeriods = periods.filter(period => {
    if (period.id === periodId) return false;
    
    const periodStartTime = ensureValidDate(period.startTime);
    const periodEndTime = ensureValidDate(period.endTime);
    
    return (
      selectedStartTime < periodEndTime && 
      selectedEndTime > periodStartTime
    );
  });
  
  return {
    isValid: conflictingPeriods.length === 0,
    conflictingPeriods: conflictingPeriods.length > 0 ? conflictingPeriods : undefined,
    error: conflictingPeriods.length > 0 ? 'Time conflicts with other periods' : undefined
  };
}
