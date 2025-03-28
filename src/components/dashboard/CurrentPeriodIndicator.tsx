
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";

const CurrentPeriodIndicator = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Mock data - in a real app, this would come from a hook like useSchedule
  const periods = [
    { id: 1, name: "1st Period", start: "8:00", end: "8:50" },
    { id: 2, name: "2nd Period", start: "9:00", end: "9:50" },
    { id: 3, name: "3rd Period", start: "10:00", end: "10:50" },
    { id: 4, name: "Lunch", start: "11:00", end: "11:30" },
    { id: 5, name: "4th Period", start: "11:40", end: "12:30" },
    { id: 6, name: "5th Period", start: "12:40", end: "13:30" },
    { id: 7, name: "6th Period", start: "13:40", end: "14:30" },
  ];

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Determine current period (simplified version)
  const getCurrentPeriod = () => {
    const hours = currentTime.getHours();
    const mins = currentTime.getMinutes();
    const timeStr = `${hours}:${mins < 10 ? '0' + mins : mins}`;
    
    // This is a simplified version - in real life we would compare actual times
    if (hours < 8) return "Before School";
    if (hours > 14 || (hours === 14 && mins > 30)) return "After School";
    
    // Find current period based on mock data
    for (const period of periods) {
      const [startHour, startMin] = period.start.split(":").map(Number);
      const [endHour, endMin] = period.end.split(":").map(Number);
      
      if (
        (hours > startHour || (hours === startHour && mins >= startMin)) &&
        (hours < endHour || (hours === endHour && mins < endMin))
      ) {
        return period.name;
      }
    }
    
    return "Between Classes";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClockIcon className="h-5 w-5" />
          Current Period
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary">{getCurrentPeriod()}</div>
        <div className="text-sm text-muted-foreground mt-1">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentPeriodIndicator;
