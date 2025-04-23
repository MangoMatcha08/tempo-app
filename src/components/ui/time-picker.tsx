
import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { formatTimeString, parseTimeStringWithCompatibility } from "@/utils/dateTimeUtils"

interface TimePickerProps {
  value?: string
  onChange: (value?: string) => void
  className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
  const minutes = Array.from({ length: 4 }, (_, i) => (i * 15).toString().padStart(2, '0'))
  const periods = ['AM', 'PM']
  
  // Initialize state with parsed time or defaults
  const [hour, setHour] = React.useState<string>('12')
  const [minute, setMinute] = React.useState<string>('00')
  const [period, setPeriod] = React.useState<string>('PM')
  
  // Log initial value for debugging
  React.useEffect(() => {
    console.log('[TimePicker] Initial value:', value);
  }, []);
  
  // Parse incoming value consistently
  React.useEffect(() => {
    if (value) {
      try {
        // Use the compatibility function for parsing
        const { hours, minutes } = parseTimeStringWithCompatibility(value);
        
        // Convert 24h format back to 12h + AM/PM
        let h = hours % 12;
        if (h === 0) h = 12;
        const p = hours >= 12 ? 'PM' : 'AM';
        
        // Format minutes with leading zero
        const m = minutes.toString().padStart(2, '0');
        
        console.log('[TimePicker] Parsed value:', { 
          original: value,
          parsed: { hours, minutes },
          formatted: { hour: h.toString(), minute: m, period: p }
        });
        
        setHour(h.toString());
        setMinute(m);
        setPeriod(p);
      } catch (err) {
        console.error('[TimePicker] Error parsing time:', value, err);
      }
    }
  }, [value]);
  
  const handleChange = (newHour: string, newMinute: string, newPeriod: string) => {
    // Ensure consistent string format
    const paddedMinute = newMinute.padStart(2, '0');
    const timeString = `${newHour}:${paddedMinute} ${newPeriod}`;
    
    console.log('[TimePicker] Output time:', {
      components: { newHour, paddedMinute, newPeriod },
      timeString
    });
    
    onChange(timeString);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? value : <span>Pick a time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex space-x-2">
          <Select 
            value={hour} 
            onValueChange={(val) => {
              setHour(val)
              handleChange(val, minute, period)
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent>
              {hours.map((h) => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={minute} 
            onValueChange={(val) => {
              setMinute(val)
              handleChange(hour, val, period)
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={period} 
            onValueChange={(val) => {
              setPeriod(val)
              handleChange(hour, minute, val)
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="AM/PM" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  )
}
