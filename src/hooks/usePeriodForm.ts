
import { useState } from 'react';
import { Period, PeriodType } from '@/contexts/ScheduleContext';
import { format, addHours } from 'date-fns';

interface UsePeriodFormProps {
  period: Period | null;
  onSave: (periodData: Partial<Period>) => void;
}

export const usePeriodForm = ({ period, onSave }: UsePeriodFormProps) => {
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

  return {
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
    handleDayToggle,
    handleSubmit
  };
};
