
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Reminder } from "@/types/reminder";
import { format } from "date-fns";

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
  const [priority, setPriority] = useState<string>(reminder?.priority || 'medium');
  const [location, setLocation] = useState(reminder?.location || '');
  const [dueDate, setDueDate] = useState(
    reminder?.dueDate 
      ? format(reminder.dueDate, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd")
  );
  const [dueTime, setDueTime] = useState(
    reminder?.dueDate 
      ? format(reminder.dueDate, "HH:mm")
      : format(new Date(), "HH:mm")
  );

  // Update form when a different reminder is selected
  React.useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setDescription(reminder.description);
      setPriority(reminder.priority);
      setLocation(reminder.location || '');
      setDueDate(format(reminder.dueDate, "yyyy-MM-dd"));
      setDueTime(format(reminder.dueDate, "HH:mm"));
    }
  }, [reminder]);

  const handleSave = () => {
    if (!reminder) return;

    // Combine date and time into a Date object
    const [year, month, day] = dueDate.split('-').map(Number);
    const [hour, minute] = dueTime.split(':').map(Number);
    const dueDateObj = new Date(year, month - 1, day, hour, minute);

    const updatedReminder: Reminder = {
      ...reminder,
      title,
      description,
      priority: priority as "low" | "medium" | "high",
      location: location || undefined,
      dueDate: dueDateObj
    };

    onSave(updatedReminder);
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
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due-time">Due Time</Label>
              <Input
                id="due-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
            />
          </div>
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
