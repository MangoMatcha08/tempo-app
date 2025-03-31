
import { mockPeriods } from '../utils/reminderUtils';
import { CreateReminderInput, ReminderPriority, ReminderCategory, VoiceProcessingResult } from '../types/reminderTypes';

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
  
  // Check for textual period numbers (first, second, third, fourth, etc.)
  const textualPeriods: Record<string, number> = {
    'first': 1,
    'second': 2,
    'third': 3,
    'fourth': 4,
    'fifth': 5,
    'sixth': 6,
    'seventh': 7,
    'eighth': 8,
    'ninth': 9,
    'tenth': 10
  };
  
  for (const [textNum, num] of Object.entries(textualPeriods)) {
    if (lowercaseText.includes(`${textNum} period`) || lowercaseText.includes(`${textNum}-period`)) {
      // Look for a period with this number in the name
      const periodMatch = mockPeriods.find(p => 
        p.name.toLowerCase().includes(`period ${num}`) || 
        p.name.toLowerCase() === `period ${num}` ||
        p.name.toLowerCase() === `${textNum} period`
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

// Main function to process voice input
export const processVoiceInput = (transcript: string): VoiceProcessingResult => {
  // Extract title (first sentence or phrase)
  let title = transcript.split(/[.!?]/)[0].trim();
  if (title.length > 100) {
    title = title.substring(0, 97) + '...';
  }
  
  // Detect priority
  const priority = detectPriority(transcript);
  
  // Detect category
  const category = detectCategory(transcript);
  
  // Detect period with improved robustness
  const periodResult = detectPeriod(transcript);
  
  // Extract potential checklist items
  const checklistItems = extractChecklistItems(transcript);
  
  // Create the reminder input
  const reminderInput: CreateReminderInput = {
    title,
    description: transcript,
    priority,
    category,
    periodId: periodResult.periodId,
    voiceTranscript: transcript,
    checklist: checklistItems.map(text => ({
      text,
      isCompleted: false
    }))
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
    confidence: 0.8, // Placeholder confidence score
    detectedEntities: {
      priority,
      category,
      period: periodResult.periodId,
      newPeriod: periodResult.isNewPeriod ? periodResult.periodName : undefined,
      checklist: checklistItems
    }
  };
};

export default {
  processVoiceInput
};
