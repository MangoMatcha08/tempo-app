
import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Period } from '@/contexts/ScheduleContext';
import { usePeriodForm } from '@/hooks/usePeriodForm';
import { PeriodFormFields } from './PeriodFormFields';

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
  const {
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
  } = usePeriodForm({ period, onSave });
  
  return (
    <Sheet open={true} onOpenChange={(open) => !open && onCancel()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{period ? 'Edit Period' : 'Add Period'}</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          <PeriodFormFields
            title={title}
            setTitle={setTitle}
            type={type}
            setType={setType}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
            location={location}
            setLocation={setLocation}
            notes={notes}
            setNotes={setNotes}
            isRecurring={isRecurring}
            setIsRecurring={setIsRecurring}
            daysOfWeek={daysOfWeek}
            handleDayToggle={handleDayToggle}
          />
          
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
