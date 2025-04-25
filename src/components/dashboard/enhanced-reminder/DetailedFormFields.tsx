
import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { DetailedFormFieldsProps } from './types';

const DetailedFormFields: React.FC<DetailedFormFieldsProps> = ({
  description,
  setDescription,
  dueDate,
  setDueDate,
  dueTime,
  setDueTime
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Add more details about this reminder"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px]"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Due Date</Label>
          <DatePicker 
            date={dueDate} 
            setDate={setDueDate} 
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Due Time</Label>
          <TimePicker 
            value={dueTime} 
            onChange={setDueTime} 
            className="w-full"
          />
        </div>
      </div>
    </>
  );
};

export default DetailedFormFields;
