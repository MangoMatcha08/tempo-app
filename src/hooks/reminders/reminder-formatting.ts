
/**
 * Helper functions for formatting dates and times for reminders
 */

/**
 * Ensures a value is a valid Date object
 */
export function ensureValidDate(date: any): Date {
  // Check if it's already a valid Date
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  
  // Handle Firestore Timestamp objects
  if (date && typeof date.toDate === 'function') {
    try {
      const converted = date.toDate();
      if (converted instanceof Date && !isNaN(converted.getTime())) {
        return converted;
      }
    } catch (err) {
      console.error("Error converting Timestamp to Date:", err);
    }
  }
  
  // Handle ISO string dates
  if (typeof date === 'string') {
    try {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    } catch (err) {
      console.error("Error parsing date string:", err);
    }
  }
  
  // Try to handle numeric timestamp
  if (typeof date === 'number') {
    try {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    } catch (err) {
      console.error("Error parsing numeric timestamp:", err);
    }
  }
  
  // Log the problematic value for debugging
  console.warn('Invalid date encountered, using current date as fallback:', date);
  return new Date();
}

/**
 * Formats the remaining time until a due date
 */
export function getRemainingTimeDisplay(date: Date | any): string {
  try {
    const validDate = ensureValidDate(date);
    const now = new Date();
    const diffMs = validDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 0) return "Overdue";
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? 's' : ''}`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } catch (err) {
    console.error("Error formatting remaining time:", err);
    return "Unknown";
  }
}

/**
 * Formats how long ago something happened
 */
export function getTimeAgoDisplay(date: Date | any): string {
  try {
    const validDate = ensureValidDate(date);
    const now = new Date();
    const diffMs = now.getTime() - validDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } catch (err) {
    console.error("Error formatting time ago:", err);
    return "Unknown time";
  }
}

/**
 * Formats date for display
 */
export function formatDate(date: Date | any): string {
  try {
    const validDate = ensureValidDate(date);
    return validDate.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (err) {
    console.error("Error formatting date:", err);
    return "Invalid date";
  }
}

/**
 * Safely logs date details for debugging
 */
export function logDateDetails(label: string, date: any): void {
  try {
    console.group(`Date Details: ${label}`);
    
    if (date === undefined) {
      console.log('Date is undefined');
    } else if (date === null) {
      console.log('Date is null');
    } else if (date instanceof Date) {
      console.log('Is Date object:', true);
      console.log('Is valid Date:', !isNaN(date.getTime()));
      console.log('ISO string:', date.toISOString());
      console.log('Timestamp:', date.getTime());
      console.log('Local string:', date.toString());
    } else if (typeof date === 'object' && date && typeof date.toDate === 'function') {
      console.log('Is Firestore Timestamp:', true);
      try {
        const jsDate = date.toDate();
        console.log('Converted to Date:', jsDate);
        console.log('ISO string:', jsDate.toISOString());
      } catch (e) {
        console.error('Error converting to Date:', e);
      }
    } else {
      console.log('Type:', typeof date);
      console.log('Value:', date);
    }
    
    console.groupEnd();
  } catch (err) {
    console.error("Error logging date details:", err);
  }
}
