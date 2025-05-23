
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Reminder } from "@/types/reminder";
import { ReminderPriority, ReminderCategory } from '@/types/reminderTypes';
import { useReminderFormValidation } from '@/hooks/useReminderFormValidation';
import { useReminderPeriodField } from '@/hooks/useReminderPeriodField';
import { useReminderDateValidation } from '@/hooks/useReminderDateValidation';
import { ReminderPeriodSelect } from './ReminderPeriodSelect';

interface ReminderEditDialogProps {
  reminder: Reminder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (reminder: Reminder) => void;
}

const ReminderEditDialog = ({ 
  reminder, 
  open, 
  onOpenChange, 
  onSave 
}: ReminderEditDialogProps) => {
  const {
    formState,
    validationErrors,
    updateField,
    resetForm,
    validateAndSave
  } = useReminderFormValidation(reminder);

  const { dateErrors, validateDateAndTime, clearErrors } = useReminderDateValidation();

  const { periodId, setPeriodId } = useReminderPeriodField(
    formState.periodId,
    (newDate) => updateField('dueDate', newDate),
    formState.dueDate || new Date()
  );

  React.useEffect(() => {
    if (reminder) {
      resetForm(reminder);
      clearErrors();
    }
  }, [reminder, resetForm, clearErrors]);

  const handleSave = () => {
    const isDateValid = validateDateAndTime(formState.dueDate, formState.dueTime);
    if (!isDateValid) return;

    const result = validateAndSave();
    if (result.isValid && result.updatedReminder) {
      onSave(result.updatedReminder);
      onOpenChange(false);
    }
  };

  if (!reminder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Reminder</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formState.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Enter reminder title"
              className={validationErrors.includes('Title is required') ? 'border-red-500' : ''}
            />
            {validationErrors.includes('Title is required') && (
              <p className="text-sm text-red-500">Title is required</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formState.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Enter reminder description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <DatePicker 
                date={formState.dueDate} 
                setDate={(date) => updateField('dueDate', date)}
                className={`w-full ${dateErrors.length > 0 ? 'border-red-500' : ''}`}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Due Time</Label>
              <TimePicker 
                value={formState.dueTime} 
                onChange={(time) => updateField('dueTime', time)}
                className={`w-full ${dateErrors.length > 0 ? 'border-red-500' : ''}`}
              />
            </div>
          </div>

          {dateErrors.length > 0 && (
            <div className="text-sm text-red-500">
              {dateErrors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          )}

          <ReminderPeriodSelect 
            periodId={periodId}
            onChange={(value) => {
              setPeriodId(value);
              updateField('periodId', value === 'none' ? null : value);
            }}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formState.priority} 
                onValueChange={(value) => updateField('priority', value as ReminderPriority)}
              >
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
            
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formState.category} 
                onValueChange={(value) => updateField('category', value as ReminderCategory)}
              >
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
          </div>

          {validationErrors.length > 0 && (
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <p key={index} className="text-sm text-red-500">{error}</p>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderEditDialog;
