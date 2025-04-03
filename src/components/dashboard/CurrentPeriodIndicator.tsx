
import { Card, CardContent } from "@/components/ui/card";
import { ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useScheduleContext } from "@/contexts/ScheduleContext";
import { useSchedule } from "@/hooks/useSchedule";
import { format } from "date-fns";

const CurrentPeriodIndicator = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { getCurrentPeriod } = useSchedule();
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const currentPeriod = getCurrentPeriod();

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">{currentPeriod ? currentPeriod.title : "Between Classes"}</h2>
            {currentPeriod && (
              <p className="text-sm text-muted-foreground">
                {format(currentPeriod.startTime, 'h:mm a')} - {format(currentPeriod.endTime, 'h:mm a')}
                {currentPeriod.location && ` • ${currentPeriod.location}`}
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
