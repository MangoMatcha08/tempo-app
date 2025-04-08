
import React, { memo, useCallback, useMemo } from 'react';
import { ScheduleView } from '@/components/schedule/ScheduleView';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useMediaQuery, useBreakpointDown } from '@/hooks/use-media-query';

// Memoize the Schedule component to prevent unnecessary renders
const Schedule = memo(() => {
  const navigate = useNavigate();
  // Use the new hook directly instead of useIsMobile
  const isMobile = useBreakpointDown("md");

  // Memoize navigation handler
  const handleNavigateToDashboard = useCallback(() => 
    navigate('/dashboard'), [navigate]);

  // Memoize styles based on device size
  const styles = useMemo(() => ({
    title: `${isMobile ? 'text-xl' : 'text-3xl'} font-bold`,
    button: `flex items-center gap-2`,
    // Fix: Explicitly type as a ButtonSize union type instead of string
    buttonSize: (isMobile ? "sm" : "default") as "sm" | "default" | "icon" | "lg",
    icon: `${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`
  }), [isMobile]);

  return (
    <div className="container mx-auto px-1 py-2 max-w-[1200px] h-[calc(100vh-1rem)]">
      <div className="flex justify-between items-center mb-3">
        <h1 className={styles.title}>Class Schedule</h1>
        <Button 
          variant="outline" 
          onClick={handleNavigateToDashboard}
          className={styles.button}
          size={styles.buttonSize}
        >
          <Home className={styles.icon} />
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
