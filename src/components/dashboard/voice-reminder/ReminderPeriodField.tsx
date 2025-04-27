import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { mockPeriods } from "@/utils/reminderUtils";
import { validatePeriodId } from "@/utils/dateUtils";
import { toPeriodDate } from "@/types/periodTypes";
import { useEffect, useState } from "react";

interface ReminderPeriodFieldProps {
  periodId: string;
  setPeriodId: (periodId: string) => void;
  disabled?: boolean;
  testId?: string;
}

const ReminderPeriodField = ({ 
  periodId, 
  setPeriodId, 
  disabled = false, 
  testId 
}: ReminderPeriodFieldProps) => {
  const [selectedValue, setSelectedValue] = useState(periodId);
  
  useEffect(() => {
    setSelectedValue(periodId);
  }, [periodId]);
  
  const handlePeriodChange = (value: string) => {
    if (value === 'none' || validatePeriodId(value, mockPeriods)) {
      setSelectedValue(value);
      setPeriodId(value);
      console.log('Period selected:', { value });
    } else {
      console.warn('Invalid period ID selected:', value);
      setSelectedValue('none');
      setPeriodId('none');
    }
  };

  const formatTime = (time: Date | string) => {
    const date = toPeriodDate(time);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-2">
      <label htmlFor="period" className="text-sm font-medium">Period</label>
      <Select 
        value={selectedValue} 
        onValueChange={handlePeriodChange}
        disabled={disabled}
      >
        <SelectTrigger data-testid={testId}>
          <SelectValue placeholder="Select period (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {mockPeriods.map(period => (
            <SelectItem key={period.id} value={period.id}>
              {period.name} ({formatTime(period.startTime)} - {formatTime(period.endTime)})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ReminderPeriodField;
