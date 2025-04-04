
import { VoiceProcessingResult, CreateReminderInput, ReminderPriority, ReminderCategory, ChecklistItem } from "@/types/reminderTypes";
import { mockPeriods } from "@/utils/reminderUtils";

// Helper function to detect priority from text
const detectPriority = (text: string): ReminderPriority => {
  const lowercaseText = text.toLowerCase();
  
  // Check for high priority keywords
  if (lowercaseText.includes('urgent') || 
      lowercaseText.includes('asap') || 
      lowercaseText.includes('important') || 
      lowercaseText.includes('critical') || 
      lowercaseText.includes('high priority')) {
    return ReminderPriority.HIGH;
  }
  
  // Check for low priority keywords
  if (lowercaseText.includes('low priority') || 
      lowercaseText.includes('whenever') || 
      lowercaseText.includes('not urgent') ||
      lowercaseText.includes('when you have time')) {
    return ReminderPriority.LOW;
  }
  
  // Default to medium priority
  return ReminderPriority.MEDIUM;
};

// Helper function to detect category from text
const detectCategory = (text: string): ReminderCategory => {
  const lowercaseText = text.toLowerCase();
  
  if (lowercaseText.includes('meeting') || lowercaseText.includes('appointment')) {
    return ReminderCategory.MEETING;
  }
  
  if (lowercaseText.includes('deadline') || lowercaseText.includes('due date')) {
    return ReminderCategory.DEADLINE;
  }
  
  if (lowercaseText.includes('prepare') || lowercaseText.includes('preparation')) {
    return ReminderCategory.PREPARATION;
  }
  
  if (lowercaseText.includes('grade') || lowercaseText.includes('assessment')) {
    return ReminderCategory.GRADING;
  }
  
  if (lowercaseText.includes('email') || 
      lowercaseText.includes('call') || 
      lowercaseText.includes('contact') ||
      lowercaseText.includes('message')) {
    return ReminderCategory.COMMUNICATION;
  }
  
  // Default to task category
  return ReminderCategory.TASK;
};

// Helper function to detect period from text
const detectPeriod = (text: string): { periodId?: string, newPeriodName?: string } => {
  const lowercaseText = text.toLowerCase();
  
  // Check for specific period mentions
  for (const period of mockPeriods) {
    if (lowercaseText.includes(period.name.toLowerCase())) {
      return { periodId: period.id };
    }
  }
  
  // Check for period numbers (1st period, 2nd period, etc.)
  const periodRegex = /(\d+)(?:st|nd|rd|th)?\s*period/i;
  const match = lowercaseText.match(periodRegex);
  
  if (match && match[1]) {
    const periodNumber = parseInt(match[1], 10);
    const periodName = `Period ${periodNumber}`;
    
    // Check if this period exists in mockPeriods
    const existingPeriod = mockPeriods.find(p => 
      p.name.toLowerCase() === periodName.toLowerCase());
    
    if (existingPeriod) {
      return { periodId: existingPeriod.id };
    } else {
      // This is a new period
      return { newPeriodName: periodName };
    }
  }
  
  // Check for lunch, planning, etc.
  if (lowercaseText.includes('lunch')) {
    return { newPeriodName: 'Lunch' };
  }
  
  if (lowercaseText.includes('planning') || lowercaseText.includes('prep')) {
    return { newPeriodName: 'Planning' };
  }
  
  // No period detected
  return {};
};

// Helper function to extract checklist items from text
const extractChecklist = (text: string): ChecklistItem[] => {
  const items: ChecklistItem[] = [];
  
  // Split by common indicators
  const lines = text.split(/[\n,.;]/).map(line => line.trim()).filter(line => line.length > 0);
  
  for (const line of lines) {
    // Check for bulleted items
    if (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./)) {
      const itemText = line.replace(/^[-•\d.]+\s*/, '').trim();
      if (itemText) {
        items.push({ text: itemText, isCompleted: false });
      }
    }
  }
  
  return items;
};

// Helper function to detect due date from text
const detectDueDate = (text: string): Date | undefined => {
  const lowercaseText = text.toLowerCase();
  const today = new Date();
  
  // Check for today
  if (lowercaseText.includes('today')) {
    return today;
  }
  
  // Check for tomorrow
  if (lowercaseText.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow;
  }
  
  // Check for next week
  if (lowercaseText.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return nextWeek;
  }
  
  // Default to tomorrow if no date detected
  const defaultDate = new Date(today);
  defaultDate.setDate(today.getDate() + 1);
  return defaultDate;
};

// Main function to process voice input
export const processVoiceInput = (text: string): VoiceProcessingResult => {
  // Detect priority
  const priority = detectPriority(text);
  
  // Detect category
  const category = detectCategory(text);
  
  // Detect period
  const periodResult = detectPeriod(text);
  
  // Extract checklist items
  const checklist = extractChecklist(text);
  
  // Detect due date
  const dueDate = detectDueDate(text);
  
  // Generate a title from the first words
  const title = text.split(/[.!?]/)[0].trim().substring(0, 50);
  
  // Create reminder input object
  const reminderInput: CreateReminderInput = {
    title,
    description: text,
    priority,
    category,
    periodId: periodResult.periodId,
    dueDate,
    checklist,
    voiceTranscript: text
  };
  
  // Add detected new period if applicable
  if (periodResult.newPeriodName) {
    reminderInput.detectedNewPeriod = {
      name: periodResult.newPeriodName,
      isNew: true
    };
  }
  
  // Create the processing result
  const result: VoiceProcessingResult = {
    reminder: reminderInput,
    confidence: 0.8,
    detectedEntities: {
      priority,
      category,
      period: periodResult.periodId,
      date: dueDate,
      newPeriod: periodResult.newPeriodName,
      checklist: checklist.map(item => item.text)
    }
  };
  
  return result;
};
