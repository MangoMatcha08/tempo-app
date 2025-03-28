
import React, { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Period, PeriodType } from '@/contexts/ScheduleContext';
import { format, parse, addHours } from 'date-fns';

interface PeriodEditorProps {
  period: Period | null;
  onSave: (periodData: Partial<Period>) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export const PeriodEditor: React.FC<PeriodEditorProps> = ({
  period,
  onSave,
  onDelete,
  onCancel
}) => {
  // Initialize state with period data or defaults
  const [title, setTitle] = useState(period?.title || '');
  const [type, setType] = useState<PeriodType>(period?.type || 'core');
  const [startTime, setStartTime] = useState(
    period?.startTime 
      ? format(period.startTime, 'HH:mm') 
      : format(new Date(), 'HH:mm')
  );
  const [endTime, setEndTime] = useState(
    period?.endTime 
      ? format(period.endTime, 'HH:mm')
      : format(addHours(new Date(), 1), 'HH:mm')
  );
  const [location, setLocation] = useState(period?.location || '');
  const [notes, setNotes] = useState(period?.notes || '');
  const [isRecurring, setIsRecurring] = useState(period?.isRecurring || false);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(period?.daysOfWeek || [1]); // Monday by default
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create Date objects for start and end times
    const today = new Date();
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTimeDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      startHours,
      startMinutes
    );
    
    const endTimeDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      endHours,
      endMinutes
    );
    
    // If end time is before start time, assume it's the next day
    if (endTimeDate < startTimeDate) {
      endTimeDate.setDate(endTimeDate.getDate() + 1);
    }
    
    const periodData: Partial<Period> = {
      title,
      type,
      startTime: startTimeDate,
      endTime: endTimeDate,
      location: location || undefined,
      notes: notes || undefined,
      isRecurring,
      daysOfWeek: isRecurring ? daysOfWeek : undefined,
    };
    
    onSave(periodData);
  };
  
  const handleDayToggle = (day: number) => {
    setDaysOfWeek(prev => 
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };
  
  return (
    <Sheet open={true} onOpenChange={(open) => !open && onCancel()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{period ? 'Edit Period' : 'Add Period'}</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Period Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g., Math 101"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type">Period Type</Label>
              <Select 
                value={type} 
                onValueChange={(value) => setType(value as PeriodType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core Class</SelectItem>
                  <SelectItem value="elective">Elective</SelectItem>
                  <SelectItem value="planning">Planning Period</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input 
                  id="startTime" 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input 
                  id="endTime" 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input 
                id="location" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="e.g., Room 204"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isRecurring" 
                checked={isRecurring} 
                onCheckedChange={(checked) => setIsRecurring(checked === true)} 
              />
              <Label htmlFor="isRecurring">Recurring Period</Label>
            </div>
            
            {isRecurring && (
              <div className="grid gap-2 pl-6">
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { day: 1, label: 'Mon' },
                    { day: 2, label: 'Tue' },
                    { day: 3, label: 'Wed' },
                    { day: 4, label: 'Thu' },
                    { day: 5, label: 'Fri' },
                    { day: 6, label: 'Sat' },
                    { day: 0, label: 'Sun' },
                  ].map((item) => (
                    <div key={item.day} className="flex items-center space-x-1">
                      <Checkbox 
                        id={`day-${item.day}`} 
                        checked={daysOfWeek.includes(item.day)} 
                        onCheckedChange={() => handleDayToggle(item.day)} 
                      />
                      <Label htmlFor={`day-${item.day}`}>{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Add any additional information"
                rows={3}
              />
            </div>
          </div>
          
          <SheetFooter className="flex gap-2 pt-4">
            {period && (
              <Button 
                type="button" 
                onClick={onDelete} 
                variant="destructive"
              >
                Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button 
              type="button" 
              onClick={onCancel} 
              variant="outline"
            >
              Cancel
            </Button>
            <Button type="submit">
              {period ? 'Update' : 'Create'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
