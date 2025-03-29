
import { differenceInMinutes, startOfDay, format, parseISO } from 'date-fns';

// Calculate the height of a period block based on duration
export const calculateHeight = (startTime: Date, endTime: Date, heightPerHour: number = 60): string => {
  const durationMinutes = differenceInMinutes(endTime, startTime);
  // Scale based on heightPerHour (pixels per hour)
  return `${Math.max(durationMinutes * (heightPerHour / 60), 30)}px`;
};

// Calculate the top position of a period block based on start time and minHour
export const calculateTopPosition = (startTime: Date, minHour: number = 7, heightPerHour: number = 60): string => {
  const dayStart = startOfDay(startTime);
  const minutesSinceDayStart = differenceInMinutes(startTime, dayStart);
  // Adjust for minHour offset
  const offsetMinutes = (minHour * 60);
  // Scale based on heightPerHour (pixels per hour)
  return `${Math.max(0, (minutesSinceDayStart - offsetMinutes) * (heightPerHour / 60))}px`;
};

// Format time to display
export const formatTime = (date: Date): string => {
  return format(date, 'h:mm a');
};

// Format date to display
export const formatDate = (date: Date): string => {
  return format(date, 'EEEE, MMMM d');
};

// Format short day name
export const formatDayShort = (date: Date): string => {
  return format(date, 'EEE');
};

// Format short date with fixed-width month to prevent layout issues
export const formatDateShort = (date: Date): string => {
  // Use fixed 3-char month format to ensure consistent layout
  const month = format(date, 'MMM').substring(0, 3);
  const day = format(date, 'd');
  return `${month} ${day}`;
};

// Get hours array for time axis based on min and max hours
export const getHoursArray = (minHour: number = 7, maxHour: number = 19): string[] => {
  const hours = [];
  for (let hour = minHour; hour <= maxHour; hour++) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    hours.push(`${hour12}:00 ${period}`);
  }
  return hours;
};

// Get position for a specific hour, adjusted for the minHour offset
export const getHourPosition = (hour: string, minHour: number = 7, heightPerHour: number = 60): string => {
  const [hourStr, period] = hour.split(' ');
  const [hours, minutes] = hourStr.split(':').map(Number);
  
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) {
    hour24 = hours + 12;
  } else if (period === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  // Scale based on heightPerHour with minHour offset
  return `${((hour24 - minHour) * heightPerHour + (minutes || 0) * (heightPerHour / 60))}px`;
};

// Get color based on period type
export const getPeriodColor = (type: string): string => {
  switch (type) {
    case 'core':
      return 'bg-blue-500 border-blue-600';
    case 'elective':
      return 'bg-rose-500 border-rose-600';
    case 'planning':
      return 'bg-emerald-500 border-emerald-600';
    case 'meeting':
      return 'bg-amber-500 border-amber-600';
    case 'other':
    default:
      return 'bg-slate-500 border-slate-600';
  }
};

// Get color for reminder indicators
export const getReminderColors = (): string[] => {
  return [
    '#0EA5E9', // Ocean Blue
    '#F97316', // Bright Orange 
    '#8B5CF6', // Vivid Purple
    '#D946EF', // Magenta Pink
    '#ea384c', // Red
  ];
};

// Estimate reminder count from period data
export const estimateReminderCount = (period: any): number => {
  // In a real app, this would query actual reminders
  // For now, we'll estimate based on notes length if available
  if (period.notes) {
    return Math.min(Math.ceil(period.notes.length / 20), 5);
  }
  return 0;
};
