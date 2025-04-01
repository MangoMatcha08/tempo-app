
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface PeriodDaysSelectionProps {
  daysOfWeek: number[];
  onDayToggle: (day: number) => void;
  disabled?: boolean;
}

export const PeriodDaysSelection: React.FC<PeriodDaysSelectionProps> = ({
  daysOfWeek,
  onDayToggle,
  disabled = false
}) => {
  return (
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
              onCheckedChange={() => onDayToggle(item.day)} 
              disabled={disabled}
            />
            <Label htmlFor={`day-${item.day}`}>{item.label}</Label>
          </div>
        ))}
      </div>
    </div>
  );
};
