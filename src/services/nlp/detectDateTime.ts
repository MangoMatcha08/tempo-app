import { detectPeriod } from './detectPeriod';
import { mockPeriods } from '@/utils/reminderUtils';

// Function to detect date and time from natural language
export const detectDateTime = (text: string) => {
  // Default result
  const result = {
    detectedDate: null as Date | null,
    detectedTime: null as Date | null,
    periodId: null as string | null,
    confidence: 0.5
  };
  
  // Normalize text for easier matching
  const normalizedText = text.toLowerCase();
  
  // Try to detect period first
  const periodResult = detectPeriod(text);
  if (periodResult.periodId) {
    result.periodId = periodResult.periodId;
    result.confidence = 0.7;
    
    // Find the period to get its start time
    const period = mockPeriods.find(p => p.id === periodResult.periodId);
    if (period && period.startTime) {
      // Parse the start time with AM/PM
      const startTimeStr = period.startTime;
      const startParts = startTimeStr.split(' ');
      const [startHour, startMin] = startParts[0].split(':').map(Number);
      const startPeriod = startParts[1]; // 'AM' or 'PM'
      
      // Convert to 24-hour format
      let hour24 = startHour;
      if (startPeriod === 'PM' && startHour !== 12) {
        hour24 += 12;
      } else if (startPeriod === 'AM' && startHour === 12) {
        hour24 = 0;
      }
      
      // Create a time object
      const time = new Date();
      time.setHours(hour24, startMin, 0, 0);
      result.detectedTime = time;
    }
  }
  
  // Check for today/tomorrow/specific days
  if (normalizedText.includes('today')) {
    result.detectedDate = new Date();
    result.confidence = Math.max(result.confidence, 0.8);
  } else if (normalizedText.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    result.detectedDate = tomorrow;
    result.confidence = Math.max(result.confidence, 0.8);
  } else if (normalizedText.includes('monday') || normalizedText.includes('mon')) {
    result.detectedDate = getNextDayOfWeek(1);
    result.confidence = Math.max(result.confidence, 0.7);
  } else if (normalizedText.includes('tuesday') || normalizedText.includes('tue')) {
    result.detectedDate = getNextDayOfWeek(2);
    result.confidence = Math.max(result.confidence, 0.7);
  } else if (normalizedText.includes('wednesday') || normalizedText.includes('wed')) {
    result.detectedDate = getNextDayOfWeek(3);
    result.confidence = Math.max(result.confidence, 0.7);
  } else if (normalizedText.includes('thursday') || normalizedText.includes('thu')) {
    result.detectedDate = getNextDayOfWeek(4);
    result.confidence = Math.max(result.confidence, 0.7);
  } else if (normalizedText.includes('friday') || normalizedText.includes('fri')) {
    result.detectedDate = getNextDayOfWeek(5);
    result.confidence = Math.max(result.confidence, 0.7);
  } else if (normalizedText.includes('saturday') || normalizedText.includes('sat')) {
    result.detectedDate = getNextDayOfWeek(6);
    result.confidence = Math.max(result.confidence, 0.7);
  } else if (normalizedText.includes('sunday') || normalizedText.includes('sun')) {
    result.detectedDate = getNextDayOfWeek(0);
    result.confidence = Math.max(result.confidence, 0.7);
  } else if (normalizedText.includes('next week')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    result.detectedDate = nextWeek;
    result.confidence = Math.max(result.confidence, 0.7);
  }
  
  // Check for specific time patterns (e.g., "at 3pm", "at 15:30")
  const timeRegex = /\b(at|by|before|after)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\b/i;
  const timeMatch = normalizedText.match(timeRegex);
  
  if (timeMatch) {
    const hour = parseInt(timeMatch[2], 10);
    const minute = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    const period = timeMatch[4] ? timeMatch[4].toLowerCase() : null;
    
    let adjustedHour = hour;
    
    // Adjust for AM/PM
    if (period && (period === 'pm' || period === 'p.m.') && hour < 12) {
      adjustedHour += 12;
    } else if (period && (period === 'am' || period === 'a.m.') && hour === 12) {
      adjustedHour = 0;
    } else if (!period && hour < 12 && hour > 0 && timeMatch[1].toLowerCase() !== 'before') {
      // If no AM/PM specified and it's a reasonable afternoon hour, assume PM
      adjustedHour += 12;
    }
    
    const time = new Date();
    time.setHours(adjustedHour, minute, 0, 0);
    result.detectedTime = time;
    result.confidence = Math.max(result.confidence, 0.8);
    
    // If we detected a time but no date, assume today or tomorrow
    if (!result.detectedDate) {
      const now = new Date();
      const isTimeInPast = time.getHours() < now.getHours() || 
                          (time.getHours() === now.getHours() && time.getMinutes() < now.getMinutes());
      
      if (isTimeInPast) {
        // If the time is in the past, assume tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        result.detectedDate = tomorrow;
      } else {
        // Otherwise, assume today
        result.detectedDate = new Date();
      }
    }
  }
  
  // If we have a date but no time and no period, set a default time
  if (result.detectedDate && !result.detectedTime && !result.periodId) {
    // Default to 9:00 AM
    const defaultTime = new Date(result.detectedDate);
    defaultTime.setHours(9, 0, 0, 0);
    result.detectedTime = defaultTime;
    
    // Update the date with the time
    result.detectedDate.setHours(9, 0, 0, 0);
  }
  
  // If we have both a date and a time, combine them
  if (result.detectedDate && result.detectedTime) {
    const combinedDate = new Date(result.detectedDate);
    combinedDate.setHours(
      result.detectedTime.getHours(),
      result.detectedTime.getMinutes(),
      0,
      0
    );
    result.detectedDate = combinedDate;
  }
  
  return result;
};

// Helper function to get the next occurrence of a day of the week
function getNextDayOfWeek(dayOfWeek: number): Date {
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  
  // Calculate days until the next occurrence of the specified day
  let daysUntilNextDay = dayOfWeek - currentDayOfWeek;
  if (daysUntilNextDay <= 0) {
    // If the day has already occurred this week, get next week's occurrence
    daysUntilNextDay += 7;
  }
  
  const nextDay = new Date();
  nextDay.setDate(today.getDate() + daysUntilNextDay);
  return nextDay;
}
