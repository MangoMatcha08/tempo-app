
import { ReminderCategory } from "@/types/reminderTypes";

// Generate a meaningful title based on category and content
export const generateMeaningfulTitle = (category: ReminderCategory, transcript: string): string => {
  const categoryPrefixes = {
    [ReminderCategory.TASK]: "Task: ",
    [ReminderCategory.MEETING]: "Meeting: ",
    [ReminderCategory.DEADLINE]: "Deadline: ",
    [ReminderCategory.PREPARATION]: "Prep: ",
    [ReminderCategory.GRADING]: "Grade: ",
    [ReminderCategory.COMMUNICATION]: "Comm: "
  };
  
  // Get first few words for the title (up to 5 words or 40 chars)
  let contentPreview = transcript.split(' ').slice(0, 5).join(' ');
  if (contentPreview.length > 40) {
    contentPreview = contentPreview.substring(0, 37) + '...';
  }
  
  return `${categoryPrefixes[category]}${contentPreview}`;
};
