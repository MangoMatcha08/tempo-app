
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import EnhancedReminderCreator from './EnhancedReminderCreator';
import { Reminder } from '@/types/reminder';

interface QuickReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReminderCreated: (reminder: Reminder) => void;
}

const QuickReminderModal: React.FC<QuickReminderModalProps> = ({
  open,
  onOpenChange,
  onReminderCreated
}) => {
  const handleReminderCreated = (reminder: Reminder) => {
    onReminderCreated(reminder);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Reminder</DialogTitle>
        </DialogHeader>
        <EnhancedReminderCreator 
          onReminderCreated={handleReminderCreated} 
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default QuickReminderModal;
