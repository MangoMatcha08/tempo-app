
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Reminder } from "@/types/reminder";
import { format } from "date-fns";
import { ReminderPriority, ReminderCategory } from '@/types/reminderTypes';
import { validateDate, DateValidationResult } from '@/utils/dateValidation';
import { parseTimeString, createDateWithTime } from '@/utils/dateUtils';
import ReminderPeriodField from './voice-reminder/ReminderPeriodField';

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
  const [title, setTitle] = useState(reminder?.title || '');
  const [description, setDescription] = useState(reminder?.description || '');
  const [priority, setPriority] = useState<ReminderPriority>(reminder?.priority || ReminderPriority.MEDIUM);
  const [category, setCategory] = useState<ReminderCategory>(reminder?.category || ReminderCategory.TASK);
  const [periodId, setPeriodId] = useState<string>(reminder?.periodId || 'none');
  const [dueDate, setDueDate] = useState<Date | undefined>(reminder?.dueDate);
  const [dueTime, setDueTime] = useState<string | undefined>(
    reminder?.dueDate ? format(reminder.dueDate, 'HH:mm') : undefined
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Update form when a different reminder is selected
  React.useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setDescription(reminder.description);
      setPriority(reminder.priority);
      setCategory(reminder.category);
      setPeriodId(reminder.periodId || 'none');
      setDueDate(reminder.dueDate);
      setDueTime(format(reminder.dueDate, 'HH:mm'));
      setValidationErrors([]);
    }
  }, [reminder]);

  const handleSave = () => {
    const errors: string[] = [];
    
    if (!reminder || !title.trim()) {
      errors.push('Title is required');
    }
    
    if (!dueDate) {
      errors.push('Due date is required');
    }

    if (dueDate) {
      const dateValidation = validateDate(dueDate, {
        required: true,
        minDate: new Date()
      });

      if (!dateValidation.isValid) {
        errors.push(...dateValidation.errors.map(error => error.message));
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!reminder || !dueDate) return;

    let finalDueDate = new Date(dueDate);
    
    if (dueTime) {
      const timeComponents = parseTimeString(dueTime);
      if (timeComponents) {
        finalDueDate = createDateWithTime(finalDueDate, timeComponents.hours, timeComponents.minutes);
      }
    }

    const updatedReminder: Reminder = {
      ...reminder,
      title,
      description,
      priority,
      category,
      periodId: periodId === 'none' ? null : periodId,
      dueDate: finalDueDate
    };

    onSave(updatedReminder);
    setValidationErrors([]);
    onOpenChange(false);
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter reminder title"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter reminder description"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <DatePicker 
                date={dueDate} 
                setDate={setDueDate}
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label>Due Time</Label>
              <TimePicker 
                value={dueTime} 
                onChange={setDueTime}
                className="w-full"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <ReminderPeriodField
              periodId={periodId}
              setPeriodId={setPeriodId}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
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
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
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
