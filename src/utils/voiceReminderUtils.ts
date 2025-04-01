
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
  
  // Extract a meaningful portion of the transcript for the title
  // We'll try to grab the first important phrase that gives context about the reminder
  let contentPreview = "";
  
  // Remove filler starting phrases
  const cleanedTranscript = transcript
    .replace(/^(set|create|make|add|remind me|i need|please|can you|would you|could you|i want to|i'd like to)\s+a?\s*(reminder|task|meeting|note|notification)?\s+(to|for|about)?/i, "")
    .replace(/^(high|medium|low)\s+priority\s+(reminder|task|meeting|note)?\s+(to|for|about)?/i, "")
    .trim();
  
  // Get the most meaningful part from the beginning of the transcript
  contentPreview = cleanedTranscript.split(/[.!?]/).filter(s => s.trim().length > 0)[0] || cleanedTranscript;
  
  // Limit to a reasonable length
  if (contentPreview.length > 40) {
    contentPreview = contentPreview.substring(0, 37) + '...';
  }
  
  // Capitalize first letter
  if (contentPreview.length > 0) {
    contentPreview = contentPreview.charAt(0).toUpperCase() + contentPreview.slice(1);
  }
  
  return `${categoryPrefixes[category]}${contentPreview}`;
};
