import { Card, CardContent } from "@/components/ui/card";
import { ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";

const CurrentPeriodIndicator = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Mock data - in a real app, this would come from a hook like useSchedule
  const periods = [
    { id: 1, name: "1st Period", start: "8:00 AM", end: "8:50 AM", room: "Room 101" },
    { id: 2, name: "2nd Period", start: "9:00 AM", end: "9:50 AM", room: "Room 102" },
    { id: 3, name: "3rd Period", start: "10:00 AM", end: "10:50 AM", room: "Room 204" },
    { id: 4, name: "Lunch", start: "11:00 AM", end: "11:30 AM", room: "Cafeteria" },
    { id: 5, name: "4th Period", start: "11:40 AM", end: "12:30 PM", room: "Room 105" },
    { id: 6, name: "5th Period", start: "12:40 PM", end: "1:30 PM", room: "Room 106" },
    { id: 7, name: "6th Period", start: "1:40 PM", end: "2:30 PM", room: "Room 107" },
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
    
    // This is a simplified version - in real life we would compare actual times
    if (hours < 8) return { name: "Before School", time: "", room: "" };
    if (hours > 14 || (hours === 14 && mins > 30)) return { name: "After School", time: "", room: "" };
    
    // Find current period based on mock data
    for (const period of periods) {
      const startParts = period.start.split(' ');
      const [startHour, startMin] = startParts[0].split(":").map(Number);
      const startPeriod = startParts[1];
      
      const endParts = period.end.split(' ');
      const [endHour, endMin] = endParts[0].split(":").map(Number);
      const endPeriod = endParts[1];
      
      // Convert to 24-hour format for comparison
      let startHour24 = startHour;
      if (startPeriod === 'PM' && startHour !== 12) {
        startHour24 += 12;
      } else if (startPeriod === 'AM' && startHour === 12) {
        startHour24 = 0;
      }
      
      let endHour24 = endHour;
      if (endPeriod === 'PM' && endHour !== 12) {
        endHour24 += 12;
      } else if (endPeriod === 'AM' && endHour === 12) {
        endHour24 = 0;
      }
      
      if (
        (hours > startHour24 || (hours === startHour24 && mins >= startMin)) &&
        (hours < endHour24 || (hours === endHour24 && mins < endMin))
      ) {
        return { 
          name: period.name, 
          time: `${period.start} - ${period.end}`,
          room: period.room
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
