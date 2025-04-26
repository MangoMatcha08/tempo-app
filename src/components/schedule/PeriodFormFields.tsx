
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { PeriodType } from '@/types/periodTypes';
import { PeriodDaysSelection } from './PeriodDaysSelection';

interface PeriodFormFieldsProps {
  title: string;
  setTitle: (value: string) => void;
  type: PeriodType;
  setType: (value: PeriodType) => void;
  startTime: string;
  setStartTime: (value: string) => void;
  endTime: string;
  setEndTime: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  isRecurring: boolean;
  setIsRecurring: (value: boolean) => void;
  daysOfWeek: number[];
  handleDayToggle: (day: number) => void;
}

export const PeriodFormFields: React.FC<PeriodFormFieldsProps> = ({
  title,
  setTitle,
  type,
  setType,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  location,
  setLocation,
  notes,
  setNotes,
  isRecurring,
  setIsRecurring,
  daysOfWeek,
  handleDayToggle
}) => {
  return (
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
        <PeriodDaysSelection 
          daysOfWeek={daysOfWeek} 
          onDayToggle={handleDayToggle} 
        />
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
  );
};
