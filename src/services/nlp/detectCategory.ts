
import { ReminderCategory } from '@/types/reminderTypes';

// Helper function to detect category from text
export const detectCategory = (text: string): ReminderCategory => {
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
