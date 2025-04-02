
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { createReminder } from "@/utils/reminderUtils";
import { ReminderPriority, ReminderCategory } from "@/types/reminderTypes";
import { mockPeriods } from "@/utils/reminderUtils";
import { Reminder as UIReminder } from "@/types/reminder";
import { convertToUIReminder } from "@/utils/typeUtils";

interface QuickReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReminderCreated?: (reminder: UIReminder) => void;
}

const QuickReminderModal = ({ open, onOpenChange, onReminderCreated }: QuickReminderModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(Date.now() + 24 * 60 * 60 * 1000) // Default to tomorrow
  );
  const [priority, setPriority] = useState<ReminderPriority>(ReminderPriority.MEDIUM);
  const [category, setCategory] = useState<ReminderCategory>(ReminderCategory.TASK);
  const [periodId, setPeriodId] = useState<string>("none");
  
  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setDueDate(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Default to tomorrow
      setPriority(ReminderPriority.MEDIUM);
      setCategory(ReminderCategory.TASK);
      setPeriodId("none");
    }
  }, [open]);
  
  const handleSubmit = () => {
    if (!title.trim()) return;
    
    try {
      // Create a new reminder
      const newReminder = createReminder({
        title,
        description,
        dueDate: dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
        priority,
        category,
        periodId: periodId === "none" ? undefined : periodId
      });
      
      console.log("Created new quick reminder:", newReminder);
      
      // Convert backend reminder to UI reminder type before passing to callback
      if (onReminderCreated) {
        const uiReminder = convertToUIReminder(newReminder);
        onReminderCreated(uiReminder);
      }
      
      // Close the modal
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating reminder:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Quick Reminder</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              placeholder="Enter reminder title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </label>
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
              <label htmlFor="date" className="text-sm font-medium">
                Due Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    id="date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
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
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
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
              <label htmlFor="period" className="text-sm font-medium">
                Period (Optional)
              </label>
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
