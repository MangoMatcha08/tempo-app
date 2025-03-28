import { differenceInMinutes, startOfDay, format, parseISO } from 'date-fns';

// Calculate the height of a period block based on duration, using a more compact scale
export const calculateHeight = (startTime: Date, endTime: Date): string => {
  const durationMinutes = differenceInMinutes(endTime, startTime);
  // 1.5px per minute for a more compact view (previously 2px)
  return `${Math.max(durationMinutes, 30) * 1.5}px`;
};

// Calculate the top position of a period block based on start time
export const calculateTopPosition = (startTime: Date): string => {
  const dayStart = startOfDay(startTime);
  const minutesSinceDayStart = differenceInMinutes(startTime, dayStart);
  // 1.5px per minute matches the scale of the calculateHeight function
  return `${minutesSinceDayStart * 1.5}px`;
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

// Get hours array for time axis, with fewer entries for a more compact view
export const getHoursArray = (): string[] => {
  return [
    '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM'
  ];
};

// Get position for a specific hour, adjusted for the new scale
export const getHourPosition = (hour: string): string => {
  const [hourStr, period] = hour.split(' ');
  const [hours, minutes] = hourStr.split(':').map(Number);
  
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) {
    hour24 = hours + 12;
  } else if (period === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  // 1.5px per minute, 60 minutes per hour
  return `${(hour24 * 60 + (minutes || 0)) * 1.5}px`;
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
