
import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  setDate: (date: Date) => void
  className?: string
  "data-testid"?: string
}

export function DatePicker({ date, setDate, className, "data-testid": testId }: DatePickerProps) {
  const handleDateSelect = React.useCallback((newDate: Date | undefined) => {
    if (newDate) {
      console.log('DatePicker: Date selected:', newDate.toISOString());
      setDate(newDate);
    }
  }, [setDate]);

  const calendarId = React.useId();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          data-testid={testId}
          aria-label="Pick a date"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start"
      >
        <Calendar
          id={calendarId}
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  )
}
