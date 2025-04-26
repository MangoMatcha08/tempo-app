
import { Period, PeriodValidationResult, ensurePeriodDates } from '@/types/periodTypes';
import { format } from 'date-fns';
import { ensureValidDate, parseTimeString } from './dateCore';

export function validatePeriodTime(date: Date, periodId: string, periods: Period[]): PeriodValidationResult {
  // Ensure all periods have proper Date objects
  const validPeriods = periods.map(ensurePeriodDates);
  const period = validPeriods.find(p => p.id === periodId);
  
  if (!period) {
    return {
      isValid: false,
      error: 'Invalid period selected'
    };
  }
  
  try {
    const periodStart = period.startTime;
    const periodEnd = period.endTime;
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
  // Ensure all periods have proper Date objects
  const validPeriods = periods.map(ensurePeriodDates);
  const selectedPeriod = validPeriods.find(p => p.id === periodId);
  
  if (!selectedPeriod) {
    return {
      isValid: false,
      error: 'Invalid period selected'
    };
  }
  
  const validDate = ensureValidDate(date);
  
  const conflictingPeriods = validPeriods.filter(period => {
    if (period.id === periodId) return false;
    
    // Check if periods overlap in time
    const selectedStartTime = selectedPeriod.startTime.getHours() * 60 + selectedPeriod.startTime.getMinutes();
    const selectedEndTime = selectedPeriod.endTime.getHours() * 60 + selectedPeriod.endTime.getMinutes();
    const periodStartTime = period.startTime.getHours() * 60 + period.startTime.getMinutes();
    const periodEndTime = period.endTime.getHours() * 60 + period.endTime.getMinutes();
    
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
