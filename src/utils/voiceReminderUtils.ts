
import { ReminderCategory } from "@/types/reminderTypes";

// Generate a meaningful title based on category and content
export const generateMeaningfulTitle = (category: ReminderCategory, transcript: string): string => {
  const categoryPrefixes = {
    [ReminderCategory.TASK]: "Task: ",
    [ReminderCategory.MEETING]: "Meeting: ",
    [ReminderCategory.DEADLINE]: "Deadline: ",
    [ReminderCategory.PREPARATION]: "Prep: ",
    [ReminderCategory.GRADING]: "Grade: ",
    [ReminderCategory.COMMUNICATION]: "Comm: ",
    [ReminderCategory.OTHER]: "Note: "
  };
  
  // Enhanced cleaning to remove priority and period references
  let cleanedTranscript = transcript
    // Remove filler starting phrases
    .replace(/^(set|create|make|add|remind me|i need|please|can you|would you|could you|i want to|i'd like to)\s+a?\s*(reminder|task|meeting|note|notification)?\s+(to|for|about)?/i, "")
    // Remove priority references
    .replace(/\b(high|medium|low)\s+priority\b/gi, "")
    .replace(/\bpriority\s+(high|medium|low)\b/gi, "")
    // Remove period references (numeric)
    .replace(/\b(\d+)(st|nd|rd|th)?\s+period\b/gi, "")
    .replace(/\bperiod\s+(\d+)\b/gi, "")
    // Remove period references (textual)
    .replace(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+period\b/gi, "")
    .replace(/\bperiod\s+(one|two|three|four|five|six|seven|eight|nine|ten)\b/gi, "")
    // Remove time references like "before school", "after school"
    .replace(/\b(before|after)\s+school\b/gi, "")
    .replace(/\b(morning|afternoon|lunch)\s+period\b/gi, "")
    .replace(/\b(planning|prep|preparation)\s+period\b/gi, "")
    .trim();
  
  // Get the most meaningful part from the beginning of the transcript
  let contentPreview = cleanedTranscript.split(/[.!?]/).filter(s => s.trim().length > 0)[0] || cleanedTranscript;
  
  // Clean up extra spaces that might have been created during replacements
  contentPreview = contentPreview.replace(/\s{2,}/g, ' ').trim();
  
  // Limit to a reasonable length
  if (contentPreview.length > 40) {
    contentPreview = contentPreview.substring(0, 37) + '...';
  }
  
  // Capitalize first letter
  if (contentPreview.length > 0) {
    contentPreview = contentPreview.charAt(0).toUpperCase() + contentPreview.slice(1);
  }
  
  // If after all our cleaning we have an empty string, use a fallback
  if (!contentPreview.trim()) {
    contentPreview = "New Reminder";
  }
  
  return `${categoryPrefixes[category]}${contentPreview}`;
};
