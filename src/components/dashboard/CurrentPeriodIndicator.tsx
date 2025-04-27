
import { Card, CardContent } from "@/components/ui/card";
import { ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Period, toPeriodDate } from "@/types/periodTypes";

const CurrentPeriodIndicator = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Mock data - in a real app, this would come from a hook like useSchedule
  const periods = [
    { id: "1", name: "1st Period", startTime: "8:00", endTime: "8:50", location: "Room 101" },
    { id: "2", name: "2nd Period", startTime: "9:00", endTime: "9:50", location: "Room 102" },
    { id: "3", name: "3rd Period", startTime: "10:00", endTime: "10:50", location: "Room 204" },
    { id: "4", name: "Lunch", startTime: "11:00", endTime: "11:30", location: "Cafeteria" },
    { id: "5", name: "4th Period", startTime: "11:40", endTime: "12:30", location: "Room 105" },
    { id: "6", name: "5th Period", startTime: "12:40", endTime: "13:30", location: "Room 106" },
    { id: "7", name: "6th Period", startTime: "13:40", endTime: "14:30", location: "Room 107" },
  ] as Period[];

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
    if (hours < 8) return { name: "Before School", time: "", room: "" };
    if (hours > 14 || (hours === 14 && mins > 30)) return { name: "After School", time: "", room: "" };
    
    // Find current period based on mock data
    for (const period of periods) {
      // Parse the time strings (format: "HH:MM")
      const [startHour, startMin] = period.startTime.toString().split(":").map(Number);
      const [endHour, endMin] = period.endTime.toString().split(":").map(Number);
      
      if (
        (hours > startHour || (hours === startHour && mins >= startMin)) &&
        (hours < endHour || (hours === endHour && mins < endMin))
      ) {
        return { 
          name: period.name, 
          time: `${period.startTime} - ${period.endTime}`,
          room: period.location
        };
      }
    }
    
    return { name: "Between Classes", time: "", room: "" };
  };

  const currentPeriod = getCurrentPeriod();

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">{currentPeriod.name}</h2>
            {currentPeriod.time && (
              <p className="text-sm text-muted-foreground">
                {currentPeriod.time} {currentPeriod.room && `• ${currentPeriod.room}`}
              </p>
            )}
          </div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentPeriodIndicator;
