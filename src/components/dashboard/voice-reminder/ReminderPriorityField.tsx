
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ReminderPriority } from "@/types/reminderTypes";

interface ReminderPriorityFieldProps {
  priority: ReminderPriority;
  setPriority: (priority: ReminderPriority) => void;
}

const ReminderPriorityField = ({ priority, setPriority }: ReminderPriorityFieldProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="priority" className="text-sm font-medium">Priority</label>
      <Select value={priority} onValueChange={(value) => setPriority(value as ReminderPriority)}>
        <SelectTrigger>
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ReminderPriority.LOW}>Low</SelectItem>
          <SelectItem value={ReminderPriority.MEDIUM}>Medium</SelectItem>
          <SelectItem value={ReminderPriority.HIGH}>High</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ReminderPriorityField;
