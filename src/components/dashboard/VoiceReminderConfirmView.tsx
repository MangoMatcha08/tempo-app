
import { VoiceProcessingResult, ReminderPriority, ReminderCategory } from "@/types/reminderTypes";
import ReminderTitleField from "./voice-reminder/ReminderTitleField";
import ReminderPriorityField from "./voice-reminder/ReminderPriorityField";
import ReminderCategoryField from "./voice-reminder/ReminderCategoryField";
import ReminderPeriodField from "./voice-reminder/ReminderPeriodField";
import TranscriptDisplay from "./voice-reminder/TranscriptDisplay";
import ChecklistDisplay from "./voice-reminder/ChecklistDisplay";
import ReminderActionButtons from "./voice-reminder/ReminderActionButtons";

export interface VoiceReminderConfirmViewProps {
  title?: string;
  setTitle?: (title: string) => void;
  transcript: string;
  priority?: ReminderPriority;
  setPriority?: (priority: ReminderPriority) => void;
  category?: ReminderCategory;
  setCategory?: (category: ReminderCategory) => void;
  periodId?: string;
  setPeriodId?: (periodId: string) => void;
  processingResult?: VoiceProcessingResult | null;
  reminderInput?: any; // Add this prop for compatibility with RefactoredVoiceRecorderModal
  onSave: () => void;
  onCancel?: () => void;
  onGoBack?: () => void;
  isSaving?: boolean;
}

const VoiceReminderConfirmView = ({
  title,
  setTitle,
  transcript,
  priority,
  setPriority,
  category,
  setCategory,
  periodId,
  setPeriodId,
  processingResult,
  reminderInput, // Add support for this prop
  onSave,
  onCancel,
  onGoBack,
  isSaving = false
}: VoiceReminderConfirmViewProps) => {
  // Use either the direct props or the ones from reminderInput if available
  const effectiveReminder = reminderInput || (processingResult?.reminder || null);
  
  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        {setTitle && (
          <ReminderTitleField 
            title={title || effectiveReminder?.title || ''} 
            setTitle={setTitle} 
          />
        )}
        
        {setPriority && (
          <ReminderPriorityField 
            priority={priority || effectiveReminder?.priority || ReminderPriority.MEDIUM} 
            setPriority={setPriority} 
          />
        )}
        
        {setCategory && (
          <ReminderCategoryField 
            category={category || effectiveReminder?.category || ReminderCategory.TASK} 
            setCategory={setCategory} 
          />
        )}
        
        {setPeriodId && (
          <ReminderPeriodField 
            periodId={periodId || effectiveReminder?.periodId || 'none'} 
            setPeriodId={setPeriodId} 
          />
        )}
        
        <TranscriptDisplay 
          transcript={transcript} 
          processingResult={processingResult} 
        />
        
        {((processingResult?.reminder.checklist && processingResult.reminder.checklist.length > 0) ||
          (effectiveReminder?.checklist && effectiveReminder.checklist.length > 0)) && (
          <ChecklistDisplay 
            checklist={processingResult?.reminder.checklist || effectiveReminder.checklist} 
          />
        )}
      </div>

      <ReminderActionButtons 
        onSave={onSave} 
        onGoBack={onGoBack}
        isSaving={isSaving} 
      />
    </div>
  );
};

export default VoiceReminderConfirmView;
