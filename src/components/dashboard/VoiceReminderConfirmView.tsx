
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChecklistItem, Reminder, ReminderCategory, ReminderPriority, VoiceProcessingResult } from "@/types/reminderTypes";
import { mockPeriods } from "@/utils/reminderUtils";

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
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">Title</label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reminder title"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium">Priority</label>
          <Select value={priority} onValueChange={(value) => setPriority(value as ReminderPriority)}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ReminderPriority.LOW}>Low</SelectItem>
              <SelectItem value={ReminderPriority.MEDIUM}>Medium</SelectItem>
              <SelectItem value={ReminderPriority.HIGH}>High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">Category</label>
          <Select value={category} onValueChange={(value) => setCategory(value as ReminderCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ReminderCategory.TASK}>Task</SelectItem>
              <SelectItem value={ReminderCategory.MEETING}>Meeting</SelectItem>
              <SelectItem value={ReminderCategory.DEADLINE}>Deadline</SelectItem>
              <SelectItem value={ReminderCategory.PREPARATION}>Preparation</SelectItem>
              <SelectItem value={ReminderCategory.GRADING}>Grading</SelectItem>
              <SelectItem value={ReminderCategory.COMMUNICATION}>Communication</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="period" className="text-sm font-medium">Period</label>
          <Select value={periodId} onValueChange={setPeriodId}>
            <SelectTrigger>
              <SelectValue placeholder="Select period (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {mockPeriods.map(period => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name} ({period.startTime} - {period.endTime})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Original Input</label>
          <div className="p-3 bg-muted/30 rounded-md text-sm italic">
            {transcript}
          </div>
        </div>
        
        {processingResult?.reminder.checklist && processingResult.reminder.checklist.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Detected Checklist Items</label>
            <div className="p-3 bg-muted/30 rounded-md text-sm">
              <ul className="list-disc pl-5 space-y-1">
                {processingResult.reminder.checklist.map((item, index) => (
                  <li key={index}>{item.text}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onGoBack}
        >
          Back
        </Button>
        <Button 
          type="button" 
          onClick={onSave}
        >
          Save Reminder
        </Button>
      </div>
    </div>
  );
};

export default VoiceReminderConfirmView;
