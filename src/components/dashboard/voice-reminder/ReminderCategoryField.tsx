
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ReminderCategory } from "@/types/reminderTypes";

interface ReminderCategoryFieldProps {
  category: ReminderCategory;
  setCategory: (category: ReminderCategory) => void;
}

const ReminderCategoryField = ({ category, setCategory }: ReminderCategoryFieldProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="category" className="text-sm font-medium">Category</label>
      <Select value={category} onValueChange={(value) => setCategory(value as ReminderCategory)}>
        <SelectTrigger>
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
  );
};

export default ReminderCategoryField;
