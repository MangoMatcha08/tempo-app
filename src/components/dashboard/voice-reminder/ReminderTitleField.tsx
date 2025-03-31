
import { Input } from "@/components/ui/input";

interface ReminderTitleFieldProps {
  title: string;
  setTitle: (title: string) => void;
}

const ReminderTitleField = ({ title, setTitle }: ReminderTitleFieldProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="title" className="text-sm font-medium">Title</label>
      <Input
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Reminder title"
      />
    </div>
  );
};

export default ReminderTitleField;
