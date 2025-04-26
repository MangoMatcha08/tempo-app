import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { parseTimeString } from "@/utils/dateUtils"

interface TimePickerProps {
  value?: string
  onChange: (value: string) => void
  className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  // Keep track of the input value to allow free typing
  const [inputValue, setInputValue] = React.useState(value || '')
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Only trigger onChange if it's a valid time
    if (parseTimeString(newValue)) {
      onChange(newValue)
    }
  }
  
  React.useEffect(() => {
    if (value !== undefined) {
      setInputValue(value)
    }
  }, [value])
  
  return (
    <div className={cn("relative", className)}>
      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        value={inputValue}
        onChange={handleChange}
        placeholder="Enter time (e.g. 3:00 PM)"
        className="pl-10"
      />
    </div>
  )
}
