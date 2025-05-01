
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { createReminder } from "@/utils/reminderUtils";
import { ReminderPriority, ReminderCategory } from "@/types/reminderTypes";
import { mockPeriods, getPeriodNameById } from "@/utils/reminderUtils";
import { Reminder as UIReminder } from "@/types/reminder";
import { convertToUIReminder } from "@/utils/typeUtils";
import { useToast } from "@/hooks/use-toast";
import { applyPeriodTime } from '@/utils/dateUtils/periodTime';

interface QuickReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReminderCreated?: (reminder: UIReminder) => void;
}

const QuickReminderModal = ({ open, onOpenChange, onReminderCreated }: QuickReminderModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [priority, setPriority] = useState<ReminderPriority>(ReminderPriority.MEDIUM);
  const [category, setCategory] = useState<ReminderCategory>(ReminderCategory.TASK);
  const [periodId, setPeriodId] = useState<string>("none");
  const { toast } = useToast();
  
  useEffect(() => {
    if (open) {
      // Reset the form when the dialog opens
      setTitle("");
      setDescription("");
      setDueDate(new Date());
      setPriority(ReminderPriority.MEDIUM);
      setCategory(ReminderCategory.TASK);
      setPeriodId("none");
    }
  }, [open]);
  
  const handleDateChange = useCallback((newDate: Date | undefined) => {
    console.log('QuickReminderModal: Date changed to:', newDate);
    setDueDate(newDate);
  }, []);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your reminder",
        variant: "destructive"
      });
      return;
    }
    
    if (!dueDate) {
      toast({
        title: "Date Required",
        description: "Please select a due date",
        variant: "destructive"
      });
      return;
    }
    
    try {
      let finalDueDate = new Date(dueDate);
      
      if (periodId !== "none") {
        // Apply period time without using complex timezone conversions
        const selectedPeriod = mockPeriods.find(p => p.id === periodId);
        if (selectedPeriod && selectedPeriod.startTime) {
          const [hours, minutes] = selectedPeriod.startTime.split(':').map(Number);
          
          // Create a new date with the period time
          finalDueDate = new Date(finalDueDate);
          finalDueDate.setHours(hours, minutes, 0, 0);
        }
      }
      
      const newReminder = createReminder({
        title,
        description,
        dueDate: finalDueDate,
        priority,
        category,
        periodId: periodId === "none" ? undefined : periodId
      });
      
      toast({
        title: "Reminder Created",
        description: `"${title}" has been added to your reminders.`
      });
      
      if (onReminderCreated) {
        const uiReminder = convertToUIReminder(newReminder);
        onReminderCreated(uiReminder);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast({
        title: "Error Creating Reminder",
        description: "There was a problem creating your reminder.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Quick Reminder</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new reminder.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <Input
              id="title"
              placeholder="Enter reminder title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
            <Textarea
              id="description"
              placeholder="Enter reminder details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <DatePicker
                date={dueDate}
                setDate={handleDateChange}
                data-testid="reminder-date-picker"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">Priority</label>
              <Select 
                value={priority} 
                onValueChange={(value) => setPriority(value as ReminderPriority)}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ReminderPriority.LOW}>Low</SelectItem>
                  <SelectItem value={ReminderPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={ReminderPriority.HIGH}>High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">Category</label>
              <Select 
                value={category} 
                onValueChange={(value) => setCategory(value as ReminderCategory)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
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
            
            <div className="space-y-2">
              <label htmlFor="period" className="text-sm font-medium">Period (Optional)</label>
              <Select 
                value={periodId} 
                onValueChange={(value) => setPeriodId(value)}
              >
                <SelectTrigger id="period">
                  <SelectValue placeholder="Select period" />
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
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickReminderModal;
