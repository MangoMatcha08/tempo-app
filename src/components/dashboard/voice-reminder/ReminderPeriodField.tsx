
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { mockPeriods } from "@/utils/reminderUtils";
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
              {period.name} ({period.startTime instanceof Date ? 
                period.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                period.startTime} - {period.endTime instanceof Date ? 
                period.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                period.endTime})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ReminderPeriodField;

