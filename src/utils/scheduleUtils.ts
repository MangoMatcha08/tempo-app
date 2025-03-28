
import { differenceInMinutes, startOfDay, format, parseISO } from 'date-fns';

// Calculate the height of a period block based on duration
export const calculateHeight = (startTime: Date, endTime: Date): string => {
  const durationMinutes = differenceInMinutes(endTime, startTime);
  // 2px per minute is a good ratio for most displays
  return `${Math.max(durationMinutes, 30) * 2}px`;
};

// Calculate the top position of a period block based on start time
export const calculateTopPosition = (startTime: Date): string => {
  const dayStart = startOfDay(startTime);
  const minutesSinceDayStart = differenceInMinutes(startTime, dayStart);
  // 2px per minute is a good ratio for most displays
  return `${minutesSinceDayStart * 2}px`;
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

// Format short date
export const formatDateShort = (date: Date): string => {
  return format(date, 'MMM d');
};

// Get hours array for time axis
export const getHoursArray = (): string[] => {
  return [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM'
  ];
};

// Get position for a specific hour
export const getHourPosition = (hour: string): string => {
  const [hourStr, period] = hour.split(' ');
  const [hours, minutes] = hourStr.split(':').map(Number);
  
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) {
    hour24 = hours + 12;
  } else if (period === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  // 2px per minute, 60 minutes per hour
  return `${(hour24 * 60 + (minutes || 0)) * 2}px`;
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
