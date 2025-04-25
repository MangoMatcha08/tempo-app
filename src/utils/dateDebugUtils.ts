
import { format, parse } from 'date-fns';
import { convertToUtc, convertToLocal } from './dateTimeUtils';
import { ensureValidDate } from './enhancedDateUtils';
import { formatWithTimezone } from './dateTransformations';

/**
 * Date debugging information
 */
interface DateDebugInfo {
  originalValue: any;
  isValid: boolean;
  asDate?: Date;
  asISOString?: string;
  asLocaleString?: string;
  timestamp?: number;
  year?: number;
  month?: number;
  day?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
  timezone?: string;
  localOffset?: number;
  utcEquivalent?: string;
  formattedLocal?: string;
  formattedUtc?: string;
  errors?: string[];
}

/**
 * Get detailed debug information for a date value
 */
export function getDateDebugInfo(dateValue: any): DateDebugInfo {
  const debugInfo: DateDebugInfo = {
    originalValue: dateValue,
    isValid: false,
    errors: []
  };
  
  try {
    let date: Date | null = null;
    
    // Handle different input types
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      try {
        date = new Date(dateValue);
      } catch (e) {
        debugInfo.errors?.push(`Failed to parse date string: ${e instanceof Error ? e.message : String(e)}`);
      }
    } else if (typeof dateValue === 'number') {
      try {
        date = new Date(dateValue);
      } catch (e) {
        debugInfo.errors?.push(`Failed to parse timestamp: ${e instanceof Error ? e.message : String(e)}`);
      }
    } else if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue && typeof dateValue.toDate === 'function') {
      try {
        // Handle Firestore Timestamp or similar objects
        date = dateValue.toDate();
      } catch (e) {
        debugInfo.errors?.push(`Failed to convert using toDate(): ${e instanceof Error ? e.message : String(e)}`);
      }
    } else {
      debugInfo.errors?.push('Unsupported date value type');
    }
    
    // Validate date
    if (date instanceof Date && !isNaN(date.getTime())) {
      debugInfo.isValid = true;
      debugInfo.asDate = date;
      debugInfo.asISOString = date.toISOString();
      debugInfo.asLocaleString = date.toLocaleString();
      debugInfo.timestamp = date.getTime();
      debugInfo.year = date.getFullYear();
      debugInfo.month = date.getMonth() + 1; // Make 1-based for readability
      debugInfo.day = date.getDate();
      debugInfo.hours = date.getHours();
      debugInfo.minutes = date.getMinutes();
      debugInfo.seconds = date.getSeconds();
      debugInfo.milliseconds = date.getMilliseconds();
      debugInfo.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      debugInfo.localOffset = date.getTimezoneOffset();
      
      // UTC conversion
      const utcDate = convertToUtc(date);
      debugInfo.utcEquivalent = utcDate.toISOString();
      
      // Formatted representations
      debugInfo.formattedLocal = formatWithTimezone(date, 'yyyy-MM-dd HH:mm:ss.SSS');
      debugInfo.formattedUtc = format(utcDate, 'yyyy-MM-dd HH:mm:ss.SSS');
    } else {
      if (!debugInfo.errors?.length) {
        debugInfo.errors?.push('Invalid date: The Date object could not be created or is invalid');
      }
    }
  } catch (e) {
    debugInfo.errors?.push(`Unexpected error analyzing date: ${e instanceof Error ? e.message : String(e)}`);
  }
  
  return debugInfo;
}

/**
 * Generate a human-readable debug report for a date
 */
export function generateDateDebugReport(dateValue: any): string {
  const info = getDateDebugInfo(dateValue);
  let report = '📅 Date Debug Report\n';
  report += '===================\n\n';
  
  report += `🔍 Input: ${JSON.stringify(info.originalValue)}\n`;
  report += `✅ Valid: ${info.isValid}\n`;
  
  if (info.isValid) {
    report += `\n📋 Details:\n`;
    report += `  ISO String: ${info.asISOString}\n`;
    report += `  Timestamp: ${info.timestamp}\n`;
    report += `  Date Components: ${info.year}-${info.month?.toString().padStart(2, '0')}-${info.day?.toString().padStart(2, '0')}\n`;
    report += `  Time Components: ${info.hours?.toString().padStart(2, '0')}:${info.minutes?.toString().padStart(2, '0')}:${info.seconds?.toString().padStart(2, '0')}.${info.milliseconds?.toString().padStart(3, '0')}\n`;
    report += `  Timezone: ${info.timezone} (UTC offset: ${-info.localOffset! / 60} hours)\n`;
    report += `\n🔄 Conversions:\n`;
    report += `  Local Formatted: ${info.formattedLocal}\n`;
    report += `  UTC Formatted: ${info.formattedUtc}\n`;
  } else {
    report += `\n❌ Errors:\n`;
    info.errors?.forEach(error => {
      report += `  - ${error}\n`;
    });
    
    report += `\n🛠️ Troubleshooting Tips:\n`;
    report += `  - Check that the input format is correct\n`;
    report += `  - For ISO strings, ensure they follow the format YYYY-MM-DDTHH:mm:ss.sssZ\n`;
    report += `  - For timestamps, ensure they're valid milliseconds since epoch\n`;
    report += `  - If using a Firestore Timestamp, ensure it's properly converted with .toDate()\n`;
    report += `  - Try using ensureValidDate() to handle different input formats\n`;
  }
  
  return report;
}

/**
 * Log detailed date information to console for debugging
 */
export function debugDate(label: string, dateValue: any): void {
  console.group(`🔍 Date Debug: ${label}`);
  
  try {
    const info = getDateDebugInfo(dateValue);
    
    console.log('Original value:', info.originalValue);
    console.log('Valid date?', info.isValid);
    
    if (info.isValid) {
      console.log('Date object:', info.asDate);
      console.log('ISO string:', info.asISOString);
      console.log('Timestamp:', info.timestamp);
      console.log('Components:', {
        year: info.year,
        month: info.month,
        day: info.day,
        hours: info.hours,
        minutes: info.minutes,
        seconds: info.seconds
      });
      console.log('Timezone:', info.timezone);
      console.log('Local formatted:', info.formattedLocal);
      console.log('UTC formatted:', info.formattedUtc);
    } else {
      console.error('Invalid date. Errors:', info.errors);
      
      // Attempt to salvage/suggest fixes
      try {
        console.log('Attempted recovery with ensureValidDate:');
        const recovered = ensureValidDate(dateValue);
        console.log('- Result:', recovered.toISOString());
      } catch (e) {
        console.log('- Recovery failed');
      }
    }
  } catch (e) {
    console.error('Error in debugDate:', e);
  }
  
  console.groupEnd();
}

/**
 * Helper for debugging timezone issues
 */
export function debugTimezoneIssue(date: any, expectedFormat?: string): void {
  console.group('🌐 Timezone Debug');
  
  try {
    const validDate = ensureValidDate(date);
    
    console.log('Input date:', date);
    console.log('Browser timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log('Local date object:', validDate);
    console.log('Local ISO string:', validDate.toISOString());
    console.log('Local time string:', validDate.toLocaleTimeString());
    
    const utcDate = convertToUtc(validDate);
    console.log('UTC date object:', utcDate);
    console.log('UTC ISO string:', utcDate.toISOString());
    
    if (expectedFormat) {
      console.log('Expected format:', expectedFormat);
      console.log('Local formatted:', formatWithTimezone(validDate, expectedFormat));
      console.log('UTC formatted:', format(utcDate, expectedFormat));
    }
    
    console.log('Timezone offset (minutes):', validDate.getTimezoneOffset());
    console.log('Timezone offset (hours):', -validDate.getTimezoneOffset() / 60);
  } catch (e) {
    console.error('Error in debugTimezoneIssue:', e);
  }
  
  console.groupEnd();
}

/**
 * Test various date parsing scenarios to identify issues
 */
export function runDateParsingTests(dateString: string): void {
  console.group(`🧪 Date Parsing Tests: "${dateString}"`);
  
  const formats = [
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'yyyy-MM-dd HH:mm',
    'MM/dd/yyyy HH:mm',
    'HH:mm'
  ];
  
  console.log('Native Date parsing:');
  try {
    const nativeDate = new Date(dateString);
    console.log('- Valid?', !isNaN(nativeDate.getTime()));
    console.log('- Result:', nativeDate.toISOString());
  } catch (e) {
    console.log('- Failed:', e);
  }
  
  console.log('\nTesting different formats:');
  formats.forEach(formatStr => {
    try {
      const parsedDate = parse(dateString, formatStr, new Date());
      const valid = isValid(parsedDate);
      console.log(`- Format "${formatStr}": ${valid ? 'VALID' : 'INVALID'}`);
      if (valid) {
        console.log(`  Result: ${parsedDate.toISOString()}`);
      }
    } catch (e) {
      console.log(`- Format "${formatStr}": ERROR -`, e instanceof Error ? e.message : e);
    }
  });
  
  console.groupEnd();
}
