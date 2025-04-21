
import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

interface TimePickerProps {
  value?: string
  onChange: (value?: string) => void
  className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))
  const minutes = Array.from({ length: 4 }, (_, i) => (i * 15).toString().padStart(2, '0'))
  const periods = ['AM', 'PM']
  
  const [hour, setHour] = React.useState<string>('12')
  const [minute, setMinute] = React.useState<string>('00')
  const [period, setPeriod] = React.useState<string>('PM')
  
  React.useEffect(() => {
    if (value) {
      const timeParts = value.split(/[:\s]/)
      if (timeParts.length >= 3) {
        setHour(timeParts[0])
        setMinute(timeParts[1])
        setPeriod(timeParts[2])
      }
    }
    console.log('[TimePicker] Current state:', {
      value,
      parsed: value?.split(/[:\s]/),
      state: { hour, minute, period }
    });
  }, [value, hour, minute, period])
  
  const handleChange = (newHour: string, newMinute: string, newPeriod: string) => {
    console.log('[TimePicker] handleChange called with:', {
      newHour, newMinute, newPeriod,
      resultingString: `${newHour}:${newMinute} ${newPeriod}`
    });
    
    const paddedHour = newHour;
    const paddedMinute = newMinute.padStart(2, '0');
    const timeString = `${paddedHour}:${paddedMinute} ${newPeriod}`;
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
