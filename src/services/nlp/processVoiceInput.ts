
import { VoiceProcessingResult, CreateReminderInput, ReminderPriority, ReminderCategory } from '@/types/reminderTypes';
import { detectPriority } from './detectPriority';
import { detectCategory } from './detectCategory';
import { detectPeriod } from './detectPeriod';
import { extractChecklistItems } from './extractChecklistItems';

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
