
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { ReminderPriority, ReminderCategory, CreateReminderInput, ChecklistItem } from '@/types/reminderTypes';
import { mockPeriods, createReminder } from '@/utils/reminderUtils';
import { convertToUIReminder } from '@/utils/typeUtils';
import { ReminderFormProps } from './types';
import { createDateWithTime, adjustDateIfPassed, logDateDetails } from '@/utils/dateTimeUtils';

// Import extracted components
import ReminderHeader from './ReminderHeader';
import BasicFormFields from './BasicFormFields';
import DetailedFormFields from './DetailedFormFields';
import ChecklistSection from './ChecklistSection';
import FormActions from './FormActions';

/**
 * Main component for creating enhanced reminders
 * Manages state and coordinates child components
 */
const ReminderForm: React.FC<ReminderFormProps> = ({ 
  onReminderCreated,
  onCancel 
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ReminderPriority>(ReminderPriority.MEDIUM);
  const [category, setCategory] = useState<ReminderCategory>(ReminderCategory.TASK);
  const [periodId, setPeriodId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date()); // Default to today
  const [dueTime, setDueTime] = useState<string | undefined>(undefined);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  
  // UI state
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
  const [showChecklist, setShowChecklist] = useState(false);
  
  // Initialize with default date of today when component mounts
  useEffect(() => {
    setDueDate(new Date());
  }, []);
  
  /**
   * Toggle between simple and detailed view modes
   */
  const toggleViewMode = () => {
    setViewMode(viewMode === 'simple' ? 'detailed' : 'simple');
  };
  
  /**
   * Handle reminder creation
   */
  const handleCreateReminder = () => {
    if (!title.trim()) return;
    
    console.log('[ReminderForm] Creating reminder:', {
      title,
      dueDate,
      dueTime,
      periodId,
      viewMode
    });
    
    const reminderInput: CreateReminderInput = {
      title,
      description,
      priority,
      category,
      periodId,
      checklist: checklist.length > 0 ? checklist : undefined,
    };
    
    // Use today as default if no date was selected
    let finalDueDate = dueDate ? new Date(dueDate) : new Date();
    logDateDetails('Initial dueDate', finalDueDate);
    
    // If a period is selected, use that period's time
    if (periodId) {
      const selectedPeriod = mockPeriods.find(p => p.id === periodId);
      console.log('[ReminderForm] Selected period:', selectedPeriod);
      
      if (selectedPeriod && selectedPeriod.startTime) {
        const [hours, minutes] = selectedPeriod.startTime.split(':').map(Number);
        console.log(`[ReminderForm] Period time: ${hours}:${minutes}`);
        
        // Create a new date with the period's time
        finalDueDate = createDateWithTime(finalDueDate, hours, minutes);
        
        // Check if we need to move to tomorrow
        finalDueDate = adjustDateIfPassed(finalDueDate);
        
        logDateDetails('Final dueDate after period time applied', finalDueDate);
      }
    }
    // If in detailed view and a specific time was selected, use that time
    else if (viewMode === 'detailed' && dueTime) {
      console.log(`[ReminderForm] Processing time string: "${dueTime}"`);
      
      // Parse time string into hours and minutes
      const timeParts = dueTime.split(/[:\s]/);
      let hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      // Handle AM/PM
      if (timeParts[2] === 'PM' && hours < 12) hours += 12;
      if (timeParts[2] === 'AM' && hours === 12) hours = 0;
      
      console.log(`[ReminderForm] Parsed time: ${hours}:${minutes}`);
      
      // Create a new date with the specified time
      finalDueDate = createDateWithTime(finalDueDate, hours, minutes);
      
      // Check if we need to move to tomorrow
      finalDueDate = adjustDateIfPassed(finalDueDate);
      
      logDateDetails('Final dueDate after time string applied', finalDueDate);
    }
    
    const newReminder = createReminder({
      ...reminderInput,
      dueDate: finalDueDate
    });
    
    console.log('[ReminderForm] Created reminder:', newReminder);
    
    const uiReminder = convertToUIReminder(newReminder);
    
    if (onReminderCreated) {
      onReminderCreated(uiReminder);
    }
    
    resetForm();
  };
  
  /**
   * Reset the form to default values
   */
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority(ReminderPriority.MEDIUM);
    setCategory(ReminderCategory.TASK);
    setPeriodId(undefined);
    setDueDate(new Date()); // Reset to today
    setDueTime(undefined);
    setChecklist([]);
    setShowChecklist(false);
    setViewMode('simple');
  };
  
  return (
    <Card className="enhanced-reminder-creator w-full">
      <CardHeader className="pb-2">
        <ReminderHeader 
          viewMode={viewMode} 
          toggleViewMode={toggleViewMode} 
        />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <BasicFormFields
          title={title}
          setTitle={setTitle}
          priority={priority}
          setPriority={setPriority}
          category={category}
          setCategory={setCategory}
          periodId={periodId}
          setPeriodId={setPeriodId}
        />
        
        {viewMode === 'detailed' && (
          <>
            <DetailedFormFields
              description={description}
              setDescription={setDescription}
              dueDate={dueDate}
              setDueDate={setDueDate}
              dueTime={dueTime}
              setDueTime={setDueTime}
            />
            
            <ChecklistSection
              checklist={checklist}
              setChecklist={setChecklist}
              showChecklist={showChecklist}
              setShowChecklist={setShowChecklist}
            />
          </>
        )}
      </CardContent>
      
      <CardFooter>
        <FormActions
          handleCreateReminder={handleCreateReminder}
          resetForm={resetForm}
          onCancel={onCancel}
          isFormValid={!!title.trim()}
        />
      </CardFooter>
    </Card>
  );
};

export default ReminderForm;
