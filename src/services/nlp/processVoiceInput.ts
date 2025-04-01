import { VoiceProcessingResult, CreateReminderInput, ReminderPriority, ReminderCategory } from '@/types/reminderTypes';
import { detectPriority } from './detectPriority';
import { detectCategory } from './detectCategory';
import { detectPeriod } from './detectPeriod';
import { extractChecklistItems } from './extractChecklistItems';
import { detectDateTime } from './detectDateTime';
import { mockPeriods } from '@/utils/reminderUtils';

// Main function to process voice input
export const processVoiceInput = (transcript: string): VoiceProcessingResult => {
  console.log('Processing voice input:', transcript);
  
  // Extract title (first sentence or phrase)
  let title = transcript.split(/[.!?]/)[0].trim();
  if (title.length > 100) {
    title = title.substring(0, 97) + '...';
  }
  
  // Detect priority
  const priority = detectPriority(transcript);
  
  // Detect category
  const category = detectCategory(transcript);
  
  // Detect date and time first (this is important for correct period association)
  const dateTimeResult = detectDateTime(transcript);
  console.log('Date/time detection result:', dateTimeResult);
  
  // Detect period with improved robustness
  const periodResult = detectPeriod(transcript);
  
  // Extract potential checklist items
  const checklistItems = extractChecklistItems(transcript);
  
  // Find "Before School" period for default time
  const beforeSchoolPeriod = mockPeriods.find(p => 
    p.name.toLowerCase().includes('before school')
  );
  
  // Create the reminder input
  const reminderInput: CreateReminderInput = {
    title,
    description: transcript,
    priority,
    category,
    periodId: dateTimeResult.periodId || periodResult.periodId || (beforeSchoolPeriod ? beforeSchoolPeriod.id : undefined),
    voiceTranscript: transcript,
    checklist: checklistItems.map(text => ({
      text,
      isCompleted: false
    }))
  };
  
  // Add detected date if available - CRITICAL for correct date handling
  if (dateTimeResult.detectedDate) {
    reminderInput.dueDate = new Date(dateTimeResult.detectedDate);
    console.log('Setting due date from detected date:', reminderInput.dueDate);
    
    // If we also detected a specific time, combine them
    if (dateTimeResult.detectedTime) {
      reminderInput.dueDate.setHours(
        dateTimeResult.detectedTime.getHours(),
        dateTimeResult.detectedTime.getMinutes(),
        0,
        0
      );
      console.log('Updated due date with time:', reminderInput.dueDate);
    } 
    // If no specific time but we have a period ID, use that period's start time
    else if (reminderInput.periodId) {
      const selectedPeriod = mockPeriods.find(p => p.id === reminderInput.periodId);
      if (selectedPeriod && selectedPeriod.startTime) {
        const [hours, minutes] = selectedPeriod.startTime.split(':').map(Number);
        reminderInput.dueDate.setHours(hours, minutes, 0, 0);
        console.log('Updated due date with period start time:', reminderInput.dueDate);
      }
    }
    // Otherwise use before school time as default
    else if (beforeSchoolPeriod && beforeSchoolPeriod.startTime) {
      const [hours, minutes] = beforeSchoolPeriod.startTime.split(':').map(Number);
      reminderInput.dueDate.setHours(hours, minutes, 0, 0);
      console.log('Updated due date with before school time:', reminderInput.dueDate);
    }
  }
  
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
    confidence: Math.max(0.8, dateTimeResult.confidence),
    detectedEntities: {
      priority,
      category,
      period: dateTimeResult.periodId || periodResult.periodId || (beforeSchoolPeriod ? beforeSchoolPeriod.id : undefined),
      date: dateTimeResult.detectedDate,
      time: dateTimeResult.detectedTime,
      newPeriod: periodResult.isNewPeriod ? periodResult.periodName : undefined,
      checklist: checklistItems
    }
  };
};
