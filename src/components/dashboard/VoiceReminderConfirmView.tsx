
import { VoiceProcessingResult, ReminderPriority, ReminderCategory } from "@/types/reminderTypes";
import ReminderTitleField from "./voice-reminder/ReminderTitleField";
import ReminderPriorityField from "./voice-reminder/ReminderPriorityField";
import ReminderCategoryField from "./voice-reminder/ReminderCategoryField";
import ReminderPeriodField from "./voice-reminder/ReminderPeriodField";
import TranscriptDisplay from "./voice-reminder/TranscriptDisplay";
import ChecklistDisplay from "./voice-reminder/ChecklistDisplay";
import ReminderActionButtons from "./voice-reminder/ReminderActionButtons";

interface VoiceReminderConfirmViewProps {
  title: string;
  setTitle: (title: string) => void;
  transcript: string;
  priority: ReminderPriority;
  setPriority: (priority: ReminderPriority) => void;
  category: ReminderCategory;
  setCategory: (category: ReminderCategory) => void;
  periodId: string;
  setPeriodId: (periodId: string) => void;
  processingResult: VoiceProcessingResult | null;
  onSave: () => void;
  onCancel: () => void;
  onGoBack: () => void;
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
  onSave,
  onCancel,
  onGoBack
}: VoiceReminderConfirmViewProps) => {
  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        <ReminderTitleField title={title} setTitle={setTitle} />
        <ReminderPriorityField priority={priority} setPriority={setPriority} />
        <ReminderCategoryField category={category} setCategory={setCategory} />
        <ReminderPeriodField periodId={periodId} setPeriodId={setPeriodId} />
        <TranscriptDisplay transcript={transcript} processingResult={processingResult} />
        
        {processingResult?.reminder.checklist && processingResult.reminder.checklist.length > 0 && (
          <ChecklistDisplay checklist={processingResult.reminder.checklist} />
        )}
      </div>

      <ReminderActionButtons onSave={onSave} onGoBack={onGoBack} />
    </div>
  );
};

export default VoiceReminderConfirmView;
