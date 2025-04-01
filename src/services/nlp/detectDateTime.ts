
import { addDays, addWeeks, setHours, setMinutes, startOfDay, format, parse, isValid } from 'date-fns';
import { mockPeriods } from '@/utils/reminderUtils';

// Interface for detected date/time information
export interface DateTimeInfo {
  detectedDate?: Date;
  detectedTime?: Date;
  confidence: number;
  periodId?: string;
}

// Function to detect dates and times from text
export const detectDateTime = (text: string): DateTimeInfo => {
  const result: DateTimeInfo = {
    confidence: 0
  };
  
  const now = new Date();
  const lowercaseText = text.toLowerCase();
  
  // Check for relative dates like "tomorrow", "today", "next week", etc.
  if (lowercaseText.includes('tomorrow')) {
    result.detectedDate = addDays(startOfDay(now), 1);
    result.confidence = 0.9;
  } else if (lowercaseText.includes('today')) {
    result.detectedDate = startOfDay(now);
    result.confidence = 0.9;
  } else if (lowercaseText.includes('next week')) {
    result.detectedDate = addWeeks(startOfDay(now), 1);
    result.confidence = 0.8;
  } else if (lowercaseText.includes('next month')) {
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    result.detectedDate = startOfDay(nextMonth);
    result.confidence = 0.8;
  }
  
  // Check for days of the week
  const daysOfWeek = [
    { names: ['monday', 'mon'], dayIndex: 1 },
    { names: ['tuesday', 'tue', 'tues'], dayIndex: 2 },
    { names: ['wednesday', 'wed'], dayIndex: 3 },
    { names: ['thursday', 'thu', 'thurs'], dayIndex: 4 },
    { names: ['friday', 'fri'], dayIndex: 5 },
    { names: ['saturday', 'sat'], dayIndex: 6 },
    { names: ['sunday', 'sun'], dayIndex: 0 }
  ];
  
  // Find days of week in the text
  for (const day of daysOfWeek) {
    for (const name of day.names) {
      if (lowercaseText.includes(name)) {
        // Get the current day of week (0-6, where 0 is Sunday)
        const currentDayOfWeek = now.getDay();
        
        // Calculate days to add (if the mentioned day is today or earlier, we assume next week)
        let daysToAdd = day.dayIndex - currentDayOfWeek;
        if (daysToAdd <= 0) daysToAdd += 7;
        
        // If text contains "next" before the day name, add another week
        const nextDayRegex = new RegExp(`next\\s+${name}`, 'i');
        if (nextDayRegex.test(lowercaseText)) {
          daysToAdd += 7;
        }
        
        result.detectedDate = addDays(startOfDay(now), daysToAdd);
        result.confidence = 0.85;
        break;
      }
    }
    if (result.detectedDate) break;
  }
  
  // Check for specific date formats like "April 3rd", "3/15", etc.
  const datePatterns = [
    // April 3rd, April 3
    { regex: /(\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b)\s+(\d{1,2})(?:st|nd|rd|th)?/i, format: 'MMMM d' },
    // 3/15, 03/15, 3-15
    { regex: /\b(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?/, format: 'M/d' }
  ];
  
  for (const pattern of datePatterns) {
    const match = lowercaseText.match(pattern.regex);
    if (match) {
      let dateStr: string;
      if (pattern.regex.toString().includes('january')) {
        // Format for month name patterns
        const month = match[1];
        const day = match[2];
        dateStr = `${month} ${day}`;
      } else {
        // Format for numeric patterns
        const month = match[1];
        const day = match[2];
        dateStr = `${month}/${day}`;
      }
      
      try {
        const parsedDate = parse(dateStr, pattern.format, new Date());
        if (isValid(parsedDate)) {
          // Set year to current year if not specified
          if (!match[3] && pattern.format === 'M/d') {
            parsedDate.setFullYear(now.getFullYear());
          }
          
          // If the date has already passed this year, assume next year
          if (parsedDate < now && pattern.format === 'MMMM d') {
            parsedDate.setFullYear(now.getFullYear() + 1);
          }
          
          result.detectedDate = parsedDate;
          result.confidence = 0.8;
          break;
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }
  }
  
  // Check for periods (like "2nd period") and set time accordingly
  const periodRegex = /(\d+)(?:st|nd|rd|th)?\s*period/i;
  const periodMatch = lowercaseText.match(periodRegex);
  
  if (periodMatch) {
    const periodNumber = parseInt(periodMatch[1], 10);
    
    // Find the period with this number in the name
    const period = mockPeriods.find(p => 
      p.name.toLowerCase().includes(`period ${periodNumber}`) || 
      p.name === `Period ${periodNumber}` || 
      p.name === `${periodNumber}`
    );
    
    if (period) {
      result.periodId = period.id;
      
      // Set the time from the period if we have a date
      if (period.startTime && (result.detectedDate || !result.detectedDate)) {
        // If no date was detected yet, use today
        if (!result.detectedDate) {
          result.detectedDate = startOfDay(now);
        }
        
        // Parse the start time (format: "HH:MM")
        const [hours, minutes] = period.startTime.split(':').map(Number);
        result.detectedTime = setMinutes(setHours(new Date(), hours), minutes);
        
        // If the period has already passed today, set it for tomorrow
        const periodTime = new Date();
        periodTime.setHours(hours, minutes, 0, 0);
        
        if (periodTime < now && format(result.detectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
          result.detectedDate = addDays(result.detectedDate, 1);
        }
        
        result.confidence = Math.max(result.confidence, 0.75);
      }
    }
  }
  
  // Check for specific times like "3 PM", "15:30", etc.
  const timePatterns = [
    // 3 PM, 3 p.m., 3PM
    { regex: /\b(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)/i },
    // 15:30, 15.30
    { regex: /\b(\d{1,2})[:.](\d{2})\b/i }
  ];
  
  for (const pattern of timePatterns) {
    const match = lowercaseText.match(pattern.regex);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2] || '0', 10);
      
      // Handle AM/PM for the first pattern
      if (match[3] && match[3].toLowerCase().startsWith('p') && hours < 12) {
        hours += 12;
      } else if (match[3] && match[3].toLowerCase().startsWith('a') && hours === 12) {
        hours = 0;
      }
      
      // Create time
      const timeDate = setMinutes(setHours(new Date(), hours), minutes);
      result.detectedTime = timeDate;
      
      // If we don't have a date yet, use today
      if (!result.detectedDate) {
        result.detectedDate = startOfDay(now);
        
        // If the time has already passed today, set it for tomorrow
        if (timeDate < now) {
          result.detectedDate = addDays(result.detectedDate, 1);
        }
      }
      
      result.confidence = Math.max(result.confidence, 0.8);
      break;
    }
  }
  
  return result;
};
