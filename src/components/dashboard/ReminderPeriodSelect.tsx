
import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockPeriods } from "@/utils/reminderUtils";

interface ReminderPeriodSelectProps {
  periodId: string;
  onChange: (value: string) => void;
}

export function ReminderPeriodSelect({ periodId, onChange }: ReminderPeriodSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="period">Period</Label>
      <Select value={periodId} onValueChange={onChange}>
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
  );
}
