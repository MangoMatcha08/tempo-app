import { VoiceProcessingResult, CreateReminderInput, ReminderPriority, ReminderCategory } from '@/types/reminderTypes';
import { detectPriority } from './detectPriority';
import { detectCategory } from './detectCategory';
import { detectPeriod } from './detectPeriod';
import { extractChecklistItems } from './extractChecklistItems';
import { detectDateTime } from './detectDateTime';
import { mockPeriods } from '@/utils/reminderUtils';
import { generateMeaningfulTitle } from '@/utils/voiceReminderUtils';
import { createDateWithTime, adjustDateIfPassed, logDateDetails } from '@/utils/dateTimeUtils';

// Threshold for accepting period detection
const PERIOD_CONFIDENCE_THRESHOLD = 0.6;

// Main function to process voice input
export const processVoiceInput = (transcript: string): VoiceProcessingResult => {
  console.log('Processing voice input:', transcript);
  
  // Detect priority
  const priority = detectPriority(transcript);
  
  // Detect category
  const category = detectCategory(transcript);
  
  // Generate a meaningful title based on the transcript and detected category
  const title = generateMeaningfulTitle(category, transcript);
  
  // Detect period with confidence score
  const periodResult = detectPeriod(transcript);
  console.log('Period detection result:', periodResult);
  
  // Only use period if confidence is high enough
  const usePeriod = periodResult.confidence >= PERIOD_CONFIDENCE_THRESHOLD;
  const finalPeriodId = usePeriod ? periodResult.periodId : undefined;
  
  // Detect date and time
  const dateTimeResult = detectDateTime(transcript);
  console.log('Date/time detection result:', dateTimeResult);
  
  // Extract potential checklist items
  const checklistItems = extractChecklistItems(transcript);
  
  // Find "Before School" period for default time
  const beforeSchoolPeriod = mockPeriods.find(p => 
    p.name.toLowerCase().includes('before school')
  );
  
  // Current date and time for comparison
  const now = new Date();
  
  // Create the reminder input
  const reminderInput: CreateReminderInput = {
    title,
    description: transcript,
    priority,
    category,
    periodId: finalPeriodId, // Only use period if confidence is high enough
    voiceTranscript: transcript,
    checklist: checklistItems.map(text => ({
      text,
      isCompleted: false
    })),
    dueDate: new Date() // Default to today
  };
  
  // Add detected date if available
  if (dateTimeResult.detectedDate) {
    reminderInput.dueDate = new Date(dateTimeResult.detectedDate);
    logDateDetails('Voice input detected date', reminderInput.dueDate);
    
    // If we also detected a specific time, combine them
    if (dateTimeResult.detectedTime) {
      const hours = dateTimeResult.detectedTime.getHours();
      const minutes = dateTimeResult.detectedTime.getMinutes();
      console.log(`[processVoiceInput] Detected time: ${hours}:${minutes}`);
      
      // Create a new date with the detected time
      reminderInput.dueDate = createDateWithTime(dateTimeResult.detectedDate, hours, minutes);
      
      // Check if we need to move to tomorrow
      reminderInput.dueDate = adjustDateIfPassed(reminderInput.dueDate);
      
      logDateDetails('Voice input dueDate with detected time', reminderInput.dueDate);
    } 
    // If no specific time but we have a period ID with high confidence, use that period's start time
    else if (finalPeriodId) {
      const selectedPeriod = mockPeriods.find(p => p.id === finalPeriodId);
      console.log('[processVoiceInput] Selected period:', selectedPeriod);
      
      if (selectedPeriod && selectedPeriod.startTime) {
        const [hours, minutes] = selectedPeriod.startTime.split(':').map(Number);
        console.log(`[processVoiceInput] Period time: ${hours}:${minutes}`);
        
        // Create a new date with the period's time
        reminderInput.dueDate = createDateWithTime(dateTimeResult.detectedDate, hours, minutes);
        
        // Check if we need to move to tomorrow
        reminderInput.dueDate = adjustDateIfPassed(reminderInput.dueDate);
        
        logDateDetails('Voice input dueDate with period time', reminderInput.dueDate);
      }
    }
    // Otherwise use before school time as default
    else if (beforeSchoolPeriod && beforeSchoolPeriod.startTime) {
      const [hours, minutes] = beforeSchoolPeriod.startTime.split(':').map(Number);
      
      // Create a new date with before school time
      reminderInput.dueDate = createDateWithTime(dateTimeResult.detectedDate, hours, minutes);
      
      // Check if we need to move to tomorrow
      reminderInput.dueDate = adjustDateIfPassed(reminderInput.dueDate);
      
      logDateDetails('Voice input dueDate with before school time', reminderInput.dueDate);
    }
  } else {
    // No date was explicitly detected, use today
    // Check if we need to move to tomorrow based on selected period/time
    if (finalPeriodId) {
      const selectedPeriod = mockPeriods.find(p => p.id === finalPeriodId);
      if (selectedPeriod && selectedPeriod.startTime) {
        const [hours, minutes] = selectedPeriod.startTime.split(':').map(Number);
        
        // Create a new date with the period's time
        reminderInput.dueDate = createDateWithTime(new Date(), hours, minutes);
        
        // Check if we need to move to tomorrow
        reminderInput.dueDate = adjustDateIfPassed(reminderInput.dueDate);
        
        logDateDetails('Voice input dueDate with period time (no detected date)', reminderInput.dueDate);
      }
    } else if (beforeSchoolPeriod && beforeSchoolPeriod.startTime) {
      const [hours, minutes] = beforeSchoolPeriod.startTime.split(':').map(Number);
      
      // Create a new date with before school time
      reminderInput.dueDate = createDateWithTime(new Date(), hours, minutes);
      
      // Check if we need to move to tomorrow
      reminderInput.dueDate = adjustDateIfPassed(reminderInput.dueDate);
      
      logDateDetails('Voice input dueDate with before school time (no detected date)', reminderInput.dueDate);
    }
  }
  
  // Add detected new period information if applicable
  if (usePeriod && periodResult.isNewPeriod && periodResult.periodName) {
    reminderInput.detectedNewPeriod = {
      name: periodResult.periodName,
      isNew: true
    };
  }
  
  // Calculate overall confidence based on various factors
  // Period detection contributes to overall confidence
  const overallConfidence = Math.max(
    0.7, // Base confidence
    periodResult.confidence * 0.5 + dateTimeResult.confidence * 0.5 // Weighted average of period and date confidence
  );
  
  // Return the processing result
  return {
    reminder: reminderInput,
    confidence: overallConfidence,
    detectedEntities: {
      priority,
      category,
      period: finalPeriodId,
      periodConfidence: periodResult.confidence,
      date: dateTimeResult.detectedDate,
      time: dateTimeResult.detectedTime,
      newPeriod: periodResult.isNewPeriod && usePeriod ? periodResult.periodName : undefined,
      checklist: checklistItems
    }
  };
};
