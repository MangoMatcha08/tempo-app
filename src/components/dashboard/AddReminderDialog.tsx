
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReminderPriority, ReminderCategory, CreateReminderInput } from '@/types/reminderTypes';
import { DatePicker } from "@/components/ui/date-picker";

interface AddReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddReminder: (reminder: CreateReminderInput) => Promise<boolean>;
}

const AddReminderDialog = ({ open, onOpenChange, onAddReminder }: AddReminderDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ReminderPriority>(ReminderPriority.MEDIUM);
  const [category, setCategory] = useState<ReminderCategory>(ReminderCategory.TASK);
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    
    const reminder: CreateReminderInput = {
      title,
      description,
      priority,
      category,
      dueDate
    };
    
    try {
      const success = await onAddReminder(reminder);
      if (success) {
        // Reset form and close dialog
        resetForm();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority(ReminderPriority.MEDIUM);
    setCategory(ReminderCategory.TASK);
    setDueDate(new Date());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Reminder</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Reminder title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Select value={priority} onValueChange={(value) => setPriority(value as ReminderPriority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ReminderPriority.HIGH}>High</SelectItem>
                  <SelectItem value={ReminderPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={ReminderPriority.LOW}>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Select value={category} onValueChange={(value) => setCategory(value as ReminderCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ReminderCategory.TASK}>Task</SelectItem>
                  <SelectItem value={ReminderCategory.MEETING}>Meeting</SelectItem>
                  <SelectItem value={ReminderCategory.DEADLINE}>Deadline</SelectItem>
                  <SelectItem value={ReminderCategory.PREPARATION}>Preparation</SelectItem>
                  <SelectItem value={ReminderCategory.GRADING}>Grading</SelectItem>
                  <SelectItem value={ReminderCategory.COMMUNICATION}>Communication</SelectItem>
                  <SelectItem value={ReminderCategory.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <DatePicker date={dueDate} setDate={setDueDate} />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Reminder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddReminderDialog;
