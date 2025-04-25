
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReminderPriority, ReminderCategory } from '@/types/reminderTypes';
import { BasicFormFieldsProps } from './types';
import { mockPeriods } from '@/utils/reminderUtils';

const BasicFormFields: React.FC<BasicFormFieldsProps> = ({
  title,
  setTitle,
  priority,
  setPriority,
  category,
  setCategory,
  periodId,
  setPeriodId
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="What do you need to remember?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as ReminderPriority)}>
            <SelectTrigger id="priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ReminderPriority.HIGH}>High</SelectItem>
              <SelectItem value={ReminderPriority.MEDIUM}>Medium</SelectItem>
              <SelectItem value={ReminderPriority.LOW}>Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={(value) => setCategory(value as ReminderCategory)}>
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
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="period">Period</Label>
        <Select 
          value={periodId || 'none'} 
          onValueChange={(value) => setPeriodId(value === 'none' ? undefined : value)}
        >
          <SelectTrigger id="period">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No specific period</SelectItem>
            {mockPeriods.map(period => (
              <SelectItem key={period.id} value={period.id}>
                {period.name} ({period.startTime} - {period.endTime})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default BasicFormFields;
