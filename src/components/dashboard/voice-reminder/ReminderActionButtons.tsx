
import { Button } from "@/components/ui/button";

interface ReminderActionButtonsProps {
  onSave: () => void;
  onGoBack: () => void;
}

const ReminderActionButtons = ({ onSave, onGoBack }: ReminderActionButtonsProps) => {
  return (
    <div className="flex justify-between">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onGoBack}
      >
        Back
      </Button>
      <Button 
        type="button" 
        onClick={onSave}
      >
        Save Reminder
      </Button>
    </div>
  );
};

export default ReminderActionButtons;
