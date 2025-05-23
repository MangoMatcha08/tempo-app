
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { mockPeriods, formatPeriodTime, getPeriodNameById } from "@/utils/reminderUtils";
import { validatePeriodId } from "@/utils/dateUtils";

interface ReminderPeriodFieldProps {
  periodId: string;
  setPeriodId: (periodId: string) => void;
}

const ReminderPeriodField = ({ periodId, setPeriodId }: ReminderPeriodFieldProps) => {
  const handlePeriodChange = (value: string) => {
    if (value === 'none' || validatePeriodId(value, mockPeriods)) {
      setPeriodId(value);
    } else {
      console.warn('Invalid period ID selected:', value);
      setPeriodId('none');
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="period" className="text-sm font-medium">Period</label>
      <Select value={periodId} onValueChange={handlePeriodChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select period (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {mockPeriods.map(period => (
            <SelectItem key={period.id} value={period.id}>
              {period.name} ({formatPeriodTime(period.startTime)} - {formatPeriodTime(period.endTime)})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ReminderPeriodField;
