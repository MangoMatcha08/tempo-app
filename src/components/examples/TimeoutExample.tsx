
import React, { useState } from 'react';
import { useTrackedTimeouts } from '@/hooks/use-tracked-timeouts';
import { Button } from '@/components/ui/button';

export const TimeoutExample = () => {
  const [message, setMessage] = useState<string | null>(null);
  const { createTimeout, clearAllTimeouts } = useTrackedTimeouts();
  
  const handleStartTimeout = () => {
    setMessage('Starting timeout...');
    
    createTimeout(() => {
      setMessage('First action completed!');
      
      // Schedule another action
      createTimeout(() => {
        setMessage('Second action completed!');
        
        // Schedule final action
        createTimeout(() => {
          setMessage('All actions completed!');
        }, 2000);
      }, 1500);
    }, 1000);
  };
  
  const handleCancelTimeouts = () => {
    clearAllTimeouts();
    setMessage('All timeouts cancelled');
  };
  
  return (
    <div className="space-y-4 p-4 border rounded-md">
      <h3 className="text-lg font-medium">Tracked Timeouts Example</h3>
      
      <div className="flex gap-2">
        <Button onClick={handleStartTimeout}>Start Timeouts</Button>
        <Button variant="outline" onClick={handleCancelTimeouts}>Cancel All</Button>
      </div>
      
      {message && (
        <div className="p-3 bg-slate-100 rounded-md">
          {message}
        </div>
      )}
      
      <div className="text-xs text-muted-foreground">
        <p>This component demonstrates the useTrackedTimeouts hook.</p>
        <p>All timeouts are automatically cleaned up when the component unmounts.</p>
      </div>
    </div>
  );
};
