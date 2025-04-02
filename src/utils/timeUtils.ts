
/**
 * Formats a date into a readable time string
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formats a date into a full date string
 */
export const formatFullDate = (date: Date): string => {
  return date.toLocaleDateString([], { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

/**
 * Gets the difference between two dates in days
 */
export const getDaysDifference = (date1: Date, date2: Date): number => {
  // Convert to UTC dates to avoid timezone issues
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  
  // Convert to days
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  
  return Math.floor((utc2 - utc1) / MS_PER_DAY);
};

/**
 * Checks if a date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};
