import { VoiceProcessingResult, ReminderPriority, ReminderCategory, ChecklistItem } from '@/types/reminderTypes';
import { mockPeriods } from '@/utils/reminderUtils';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("NLP");

// Helper function to detect priority from text
const detectPriority = (text: string): ReminderPriority => {
  const lowercaseText = text.toLowerCase();
  
  // High priority indicators
  if (
    lowercaseText.includes('urgent') || 
    lowercaseText.includes('asap') || 
    lowercaseText.includes('high priority') ||
    lowercaseText.includes('important') ||
    lowercaseText.includes('critical') ||
    lowercaseText.includes('immediately')
  ) {
    return ReminderPriority.HIGH;
  }
  
  // Low priority indicators
  if (
    lowercaseText.includes('low priority') || 
    lowercaseText.includes('whenever') || 
    lowercaseText.includes('not urgent') ||
    lowercaseText.includes('when you have time') ||
    lowercaseText.includes('eventually')
  ) {
    return ReminderPriority.LOW;
  }
  
  // Default to medium if no specific priority detected
  return ReminderPriority.MEDIUM;
};

// Helper function to detect category from text
const detectCategory = (text: string): ReminderCategory => {
  const lowercaseText = text.toLowerCase();
  
  if (lowercaseText.includes('meeting') || lowercaseText.includes('conference')) {
    return ReminderCategory.MEETING;
  }
  
  if (lowercaseText.includes('deadline') || lowercaseText.includes('due')) {
    return ReminderCategory.DEADLINE;
  }
  
  if (lowercaseText.includes('prepare') || lowercaseText.includes('preparation') || lowercaseText.includes('lesson plan')) {
    return ReminderCategory.PREPARATION;
  }
  
  if (lowercaseText.includes('grade') || lowercaseText.includes('grading') || lowercaseText.includes('assessment')) {
    return ReminderCategory.GRADING;
  }
  
  if (
    lowercaseText.includes('email') || 
    lowercaseText.includes('call') || 
    lowercaseText.includes('contact') ||
    lowercaseText.includes('parent') ||
    lowercaseText.includes('message')
  ) {
    return ReminderCategory.COMMUNICATION;
  }
  
  // Default to task if no specific category detected
  return ReminderCategory.TASK;
};

// Helper function to detect period from text with improved robustness
const detectPeriod = (text: string): { periodId?: string, isNewPeriod: boolean, periodName?: string } => {
  const lowercaseText = text.toLowerCase();
  const result = { periodId: undefined as string | undefined, isNewPeriod: false, periodName: undefined as string | undefined };
  
  // First check for exact matches with existing periods
  for (const period of mockPeriods) {
    if (lowercaseText.includes(period.name.toLowerCase())) {
      result.periodId = period.id;
      return result;
    }
  }
  
  // Check for numeric period references (1st, 2nd, 3rd, 4th, etc.)
  const periodRegex = /(\d+)(st|nd|rd|th)?\s*period|period\s*(\d+)/i;
  const match = lowercaseText.match(periodRegex);
  
  if (match) {
    // Extract the period number
    const periodNumber = match[1] || match[3];
    if (periodNumber) {
      // Convert to number and find matching period
      const num = parseInt(periodNumber, 10);
      
      // Look for a period with this number in the name
      const periodMatch = mockPeriods.find(p => 
        p.name.toLowerCase().includes(`period ${num}`) || 
        p.name.toLowerCase().includes(`period${num}`)
      );
      
      if (periodMatch) {
        result.periodId = periodMatch.id;
        return result;
      } else {
        // This is a new period that doesn't exist in our list
        result.isNewPeriod = true;
        result.periodName = `Period ${num}`;
        return result;
      }
    }
  }
  
  // Check for special periods like lunch, planning, etc.
  const specialPeriods = [
    { keywords: ['lunch', 'noon'], name: 'Lunch' },
    { keywords: ['planning', 'prep time', 'preparation time'], name: 'Planning' },
    { keywords: ['after school', 'afterschool'], name: 'After School' },
    { keywords: ['morning', 'before school', 'homeroom'], name: 'Morning' }
  ];
  
  for (const special of specialPeriods) {
    for (const keyword of special.keywords) {
      if (lowercaseText.includes(keyword)) {
        // Look for a period with this name
        const periodMatch = mockPeriods.find(p => 
          p.name.toLowerCase().includes(special.name.toLowerCase())
        );
        
        if (periodMatch) {
          result.periodId = periodMatch.id;
          return result;
        } else {
          // This is a new period that doesn't exist in our list
          result.isNewPeriod = true;
          result.periodName = special.name;
          return result;
        }
      }
    }
  }
  
  // No period detected
  return result;
};

// Helper function to extract checklist items from text
const extractChecklistItems = (text: string): string[] => {
  const items: string[] = [];
  
  // Split by common list indicators
  const lines = text.split(/\n|;|,/).map(line => line.trim());
  
  for (const line of lines) {
    // Skip empty lines or very short fragments
    if (line.length < 3) continue;
    
    // Check for list-like patterns
    if (
      line.startsWith('-') || 
      line.startsWith('•') || 
      line.match(/^\d+\./) ||
      line.startsWith('*')
    ) {
      // Remove the list marker and add to items
      const cleanItem = line.replace(/^[-•*\d.]+\s*/, '').trim();
      if (cleanItem.length > 0) {
        items.push(cleanItem);
      }
    } else if (
      line.toLowerCase().includes('remember to') || 
      line.toLowerCase().includes('don\'t forget to') ||
      line.toLowerCase().includes('need to')
    ) {
      items.push(line);
    }
  }
  
  return items;
};

// Function to detect date and time from natural language
const detectDateTime = (text: string) => {
  const result = {
    detectedDate: null as Date | null,
    confidence: 0.5
  };
  
  const normalizedText = text.toLowerCase();
  
  // Check for today/tomorrow/specific days
  if (normalizedText.includes('today')) {
    result.detectedDate = new Date();
    result.confidence = 0.8;
  } else if (normalizedText.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    result.detectedDate = tomorrow;
    result.confidence = 0.8;
  } else if (normalizedText.includes('monday') || normalizedText.includes('mon')) {
    result.detectedDate = getNextDayOfWeek(1);
    result.confidence = 0.7;
  } else if (normalizedText.includes('tuesday') || normalizedText.includes('tue')) {
    result.detectedDate = getNextDayOfWeek(2);
    result.confidence = 0.7;
  } else if (normalizedText.includes('wednesday') || normalizedText.includes('wed')) {
    result.detectedDate = getNextDayOfWeek(3);
    result.confidence = 0.7;
  } else if (normalizedText.includes('thursday') || normalizedText.includes('thu')) {
    result.detectedDate = getNextDayOfWeek(4);
    result.confidence = 0.7;
  } else if (normalizedText.includes('friday') || normalizedText.includes('fri')) {
    result.detectedDate = getNextDayOfWeek(5);
    result.confidence = 0.7;
  } else if (normalizedText.includes('saturday') || normalizedText.includes('sat')) {
    result.detectedDate = getNextDayOfWeek(6);
    result.confidence = 0.7;
  } else if (normalizedText.includes('sunday') || normalizedText.includes('sun')) {
    result.detectedDate = getNextDayOfWeek(0);
    result.confidence = 0.7;
  } else if (normalizedText.includes('next week')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    result.detectedDate = nextWeek;
    result.confidence = 0.7;
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

// Generate a meaningful title from the transcript
const generateTitle = (transcript: string): string => {
  // If transcript is empty, return a default title
  if (!transcript.trim()) {
    return "New Voice Reminder";
  }
  
  // Try to use the first sentence as the title
  const firstSentence = transcript.split(/[.!?]/)[0].trim();
  
  // If the first sentence is too long, truncate it
  if (firstSentence.length > 50) {
    return firstSentence.substring(0, 47) + "...";
  }
  
  return firstSentence;
};

// Main function to process voice input
export const processVoiceInput = (transcript: string): VoiceProcessingResult => {
  debugLog("Processing voice input:", transcript);
  
  // Detect priority
  const priority = detectPriority(transcript);
  
  // Detect category
  const category = detectCategory(transcript);
  
  // Generate a title
  const title = generateTitle(transcript);
  
  // Detect period
  const periodResult = detectPeriod(transcript);
  
  // Detect date and time
  const dateTimeResult = detectDateTime(transcript);
  
  // Extract checklist items
  const checklistItemTexts = extractChecklistItems(transcript);
  const checklistItems: ChecklistItem[] = checklistItemTexts.map(text => ({
    text,
    isCompleted: false,
    id: Math.random().toString(36).substring(2, 9)
  }));
  
  // Determine due date with fallback to today
  let dueDate = new Date();
  
  // If we detected a date, use that
  if (dateTimeResult.detectedDate) {
    dueDate = dateTimeResult.detectedDate;
  } else {
    // Otherwise, set it to tomorrow if it's after 2pm
    const now = new Date();
    if (now.getHours() >= 14) {
      dueDate.setDate(dueDate.getDate() + 1);
    }
  }
  
  // If we have a period ID, adjust the time based on that period
  if (periodResult.periodId) {
    const period = mockPeriods.find(p => p.id === periodResult.periodId);
    if (period && period.startTime) {
      // Parse time components
      const timeParts = period.startTime.split(':');
      const hourPart = timeParts[0];
      const minutePart = timeParts[1].split(' ')[0];
      
      const hours = parseInt(hourPart, 10);
      const minutes = parseInt(minutePart, 10);
      
      // Adjust for AM/PM if present
      let adjustedHours = hours;
      if (period.startTime.toLowerCase().includes('pm') && hours < 12) {
        adjustedHours += 12;
      } else if (period.startTime.toLowerCase().includes('am') && hours === 12) {
        adjustedHours = 0;
      }
      
      // Set the time on the due date
      dueDate.setHours(adjustedHours, minutes, 0, 0);
    }
  }
  
  debugLog("Detection results:", {
    priority,
    category,
    period: periodResult,
    dueDate: dueDate.toISOString(),
    checklistItems: checklistItems.length
  });
  
  // Create the reminder input
  const reminderInput = {
    title,
    description: transcript,
    priority,
    category,
    periodId: periodResult.periodId,
    dueDate,
    checklist: checklistItems,
    voiceTranscript: transcript
  };
  
  // Add detected new period information if applicable
  if (periodResult.isNewPeriod && periodResult.periodName) {
    reminderInput.detectedNewPeriod = {
      name: periodResult.periodName,
      isNew: true
    };
  }
  
  // Return the processing result
  return {
    reminder: reminderInput,
    confidence: 0.8,
    detectedEntities: {
      priority,
      category,
      period: periodResult.periodId,
      date: dateTimeResult.detectedDate,
      newPeriod: periodResult.isNewPeriod ? periodResult.periodName : undefined,
      checklist: checklistItemTexts
    }
  };
};
