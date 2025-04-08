
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { ReminderPriority, ReminderCategory, CreateReminderInput, ChecklistItem } from '@/types/reminderTypes';
import { mockPeriods, createReminder } from '@/utils/reminderUtils';
import { convertToUIReminder } from '@/utils/typeUtils';
import { ReminderFormProps } from './types';

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
    
    const reminderInput: CreateReminderInput = {
      title,
      description,
      priority,
      category,
      periodId,
      checklist: checklist.length > 0 ? checklist : undefined,
    };
    
    // Use today as default if no date was selected
    let finalDueDate = dueDate || new Date();
    
    // If a period is selected, check if we need to move to tomorrow based on timing
    if (periodId) {
      const now = new Date();
      const selectedPeriod = mockPeriods.find(p => p.id === periodId);
      
      if (selectedPeriod && selectedPeriod.startTime) {
        const [hours, minutes] = selectedPeriod.startTime.split(':').map(Number);
        
        // Create a date object for the period time today
        const periodTime = new Date(finalDueDate);
        periodTime.setHours(hours, minutes, 0, 0);
        
        // If period time is earlier than current time and the date is today, move to tomorrow
        if (periodTime < now && 
            finalDueDate.getDate() === now.getDate() && 
            finalDueDate.getMonth() === now.getMonth() && 
            finalDueDate.getFullYear() === now.getFullYear()) {
          const tomorrow = new Date(finalDueDate);
          tomorrow.setDate(tomorrow.getDate() + 1);
          finalDueDate = tomorrow;
        }
      }
    }
    // If a specific time was selected, apply similar logic
    else if (dueTime) {
      const now = new Date();
      const [hoursStr, minutesStr, period] = dueTime.split(/[:\s]/);
      let hours = parseInt(hoursStr);
      const minutes = parseInt(minutesStr);
      
      if (period === 'PM' && hours < 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      // Create a date object for the selected time today
      const selectedTime = new Date(finalDueDate);
      selectedTime.setHours(hours, minutes, 0, 0);
      
      // If selected time is earlier than current time and the date is today, move to tomorrow
      if (selectedTime < now && 
          finalDueDate.getDate() === now.getDate() && 
          finalDueDate.getMonth() === now.getMonth() && 
          finalDueDate.getFullYear() === now.getFullYear()) {
        const tomorrow = new Date(finalDueDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        finalDueDate = tomorrow;
      } else {
        finalDueDate.setHours(hours, minutes);
      }
    }
    
    const newReminder = createReminder({
      ...reminderInput,
      dueDate: finalDueDate
    });
    
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
