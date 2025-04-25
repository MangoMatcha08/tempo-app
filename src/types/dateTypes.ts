
export interface TimeComponents {
  hours: number;
  minutes: number;
}

export interface DateFormatOptions {
  format?: string;
  timeZone?: string;
}

export type TimeString = string; // Format: "HH:mm" (24-hour)

export function isTimeString(value: any): value is TimeString {
  if (typeof value !== 'string') return false;
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(value);
}

export function formatTimeString(date: Date): TimeString {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
}
