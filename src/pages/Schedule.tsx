
import React, { memo, useCallback } from 'react';
import { ScheduleView } from '@/components/schedule/ScheduleView';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Memoize the Schedule component to prevent unnecessary renders
const Schedule = memo(() => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Memoize navigation handler
  const handleNavigateToDashboard = useCallback(() => 
    navigate('/dashboard'), [navigate]);

  return (
    <div className="container mx-auto px-1 py-2 max-w-[1200px] h-[calc(100vh-1rem)]">
      <div className="flex justify-between items-center mb-3">
        <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold`}>Class Schedule</h1>
        <Button 
          variant="outline" 
          onClick={handleNavigateToDashboard}
          className="flex items-center gap-2"
          size={isMobile ? "sm" : "default"}
        >
          <Home className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
          Dashboard
        </Button>
      </div>
      <div className="h-[calc(100%-3rem)]">
        <ScheduleView />
      </div>
    </div>
  );
});

// Set display name for better debugging
Schedule.displayName = "Schedule";

export default Schedule;
