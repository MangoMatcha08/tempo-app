
import { Button } from "@/components/ui/button";
import { PlusCircle, Mic, Bell, Calendar } from "lucide-react";

interface QuickActionsBarProps {
  onNewReminder: () => void;
  onNewVoiceNote: () => void;
}

const QuickActionsBar = ({ onNewReminder, onNewVoiceNote }: QuickActionsBarProps) => {
  return (
    <div className="flex flex-wrap gap-4">
      <Button
        className="flex-1 md:flex-none"
        onClick={onNewReminder}
      >
        <Bell className="mr-2 h-4 w-4" />
        Quick Reminder
      </Button>
      
      <Button
        variant="secondary"
        className="flex-1 md:flex-none"
        onClick={onNewVoiceNote}
      >
        <Mic className="mr-2 h-4 w-4" />
        Voice Note
      </Button>
      
      <Button
        variant="outline"
        className="flex-1 md:flex-none"
      >
        <Calendar className="mr-2 h-4 w-4" />
        Schedule
      </Button>
      
      <Button
        variant="outline"
        className="flex-1 md:flex-none"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        New Task
      </Button>
    </div>
  );
};

export default QuickActionsBar;
