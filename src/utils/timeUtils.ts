
import { mockPeriods } from "./reminderUtils";
import { normalizePriority } from "./typeUtils";

/**
 * Format time with period name if available
 */
export function formatTimeWithPeriod(date: Date, periodId?: string | null): string {
  try {
    // Format the time in 12-hour format
    const timeStr = date instanceof Date
      ? date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        })
      : '';
    
    // If no periodId provided, just return the time
    if (!periodId) return timeStr;
    
    // Get the period name if available
    const period = mockPeriods.find(p => p.id === periodId);
    if (!period) return timeStr;
    
    // Return combined time and period
    return `${timeStr} (${period.name})`;
  } catch (error) {
    console.error("Error formatting time with period:", error);
    return date instanceof Date 
      ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      : 'Invalid time';
  }
}

/**
 * Format time in a consistent way
 */
export function formatTime(date: Date): string {
  try {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  } catch (error) {
    console.error("Error formatting time:", error);
    return "Invalid time";
  }
}

/**
 * Returns the correct border CSS class for a priority
 */
export function getPriorityBorderClass(priority: string): string {
  const normalizedPriority = normalizePriority(priority);
  
  switch (normalizedPriority) {
    case 'high':
      return 'border-l-red-500';
    case 'medium':
      return 'border-l-yellow-500';
    case 'low':
      return 'border-l-green-500';
    default:
      return 'border-l-gray-300';
  }
}

/**
 * Returns the correct text/background color CSS class for a priority
 */
export function getPriorityColorClass(priority: string): string {
  const normalizedPriority = normalizePriority(priority);
  
  switch (normalizedPriority) {
    case 'high':
      return 'text-red-500 bg-red-50';
    case 'medium':
      return 'text-yellow-500 bg-yellow-50';
    case 'low':
      return 'text-green-500 bg-green-50';
    default:
      return 'text-gray-500 bg-gray-50';
  }
}
