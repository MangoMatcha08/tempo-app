
import { ReminderPriority } from '@/types/reminderTypes';

// Helper function to detect priority from text
export const detectPriority = (text: string): ReminderPriority => {
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
