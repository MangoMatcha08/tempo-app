import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { ReminderPriority, ReminderCategory, CreateReminderInput, ChecklistItem } from '@/types/reminderTypes';
import { mockPeriods, createReminder } from '@/utils/reminderUtils';
import { convertToUIReminder } from '@/utils/typeUtils';
import { ReminderFormProps } from './types';
import { parseTimeString, createDateWithTime } from '@/utils/date/time';
import { validateDate } from '@/utils/date/validation';
import { formatTimeWithPeriod } from '@/utils/date/formatting';
import { useDateValidation } from '@/hooks/date/useDateValidation';

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
  
  const dateValidation = useDateValidation({
    required: true
  });
  
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
    
    const dateResult = validateDate(dueDate, {
      required: true,
      minDate: new Date()
    });
    
    if (!dateResult.isValid) {
      console.error('Date validation failed:', dateResult.errors);
      return;
    }
    
    let finalDueDate = dateResult.sanitizedValue!;
    
    if (periodId) {
      const selectedPeriod = mockPeriods.find(p => p.id === periodId);
      
      if (selectedPeriod?.startTime) {
        const timeComponents = parseTimeString(selectedPeriod.startTime);
        if (timeComponents) {
          const periodDate = createDateWithTime(finalDueDate, timeComponents.hours, timeComponents.minutes);
          if (periodDate) {
            finalDueDate = periodDate;
          }
        }
      }
    } else if (dueTime) {
      const timeComponents = parseTimeString(dueTime);
      if (timeComponents) {
        const timeDate = createDateWithTime(finalDueDate, timeComponents.hours, timeComponents.minutes);
        if (timeDate) {
          finalDueDate = timeDate;
        }
      }
    }
    
    const reminderInput: CreateReminderInput = {
      title,
      description,
      priority,
      category,
      periodId,
      dueDate: finalDueDate,
      checklist: checklist.length > 0 ? checklist : undefined,
    };
    
    const newReminder = createReminder(reminderInput);
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
