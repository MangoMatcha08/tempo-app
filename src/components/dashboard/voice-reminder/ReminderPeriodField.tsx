
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { mockPeriods } from "@/utils/reminderUtils";

interface ReminderPeriodFieldProps {
  periodId: string;
  setPeriodId: (periodId: string) => void;
}

const ReminderPeriodField = ({ periodId, setPeriodId }: ReminderPeriodFieldProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="period" className="text-sm font-medium">Period</label>
      <Select value={periodId} onValueChange={setPeriodId}>
        <SelectTrigger>
          <SelectValue placeholder="Select period (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {mockPeriods.map(period => (
            <SelectItem key={period.id} value={period.id}>
              {period.name} ({period.startTime} - {period.endTime})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ReminderPeriodField;
