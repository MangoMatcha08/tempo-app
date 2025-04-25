
import { format } from 'date-fns';
import { ensureValidDate } from './enhancedDateUtils';
import type { DateValidationResult } from './dateValidation';

export const debugDate = (label: string, date: Date | unknown): void => {
  console.group(`Debug Info: ${label}`);
  
  try {
    const validDate = ensureValidDate(date);
    console.log('Date object:', validDate);
    console.log('ISO string:', validDate.toISOString());
    console.log('Local string:', validDate.toString());
    console.log('Formatted:', format(validDate, 'PPPppp'));
    console.log('Timestamp:', validDate.getTime());
    console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch (error) {
    console.error('Error debugging date:', error);
    console.log('Original value:', date);
  }
  
  console.groupEnd();
};

export const generateDateDebugReport = (date: Date | unknown): string => {
  try {
    const validDate = ensureValidDate(date);
    return [
      'Date Debug Report',
      '================',
      `ISO: ${validDate.toISOString()}`,
      `Local: ${validDate.toString()}`,
      `Formatted: ${format(validDate, 'PPPppp')}`,
      `Timestamp: ${validDate.getTime()}`,
      `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
      '================',
    ].join('\n');
  } catch (error) {
    return `Error generating debug report: ${error}\nOriginal value: ${String(date)}`;
  }
};
