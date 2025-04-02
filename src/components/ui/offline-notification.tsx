
import React, { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * OfflineNotification component that monitors network status and provides user feedback
 */
export function OfflineNotification() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);
  const [lastStatus, setLastStatus] = useState(navigator.onLine);

  // Setup event listeners for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Only show the "back online" notification if we were previously offline
      if (!lastStatus) {
        setShowNotification(true);
        // Auto-hide after 3 seconds
        setTimeout(() => setShowNotification(false), 3000);
      }
      setLastStatus(true);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowNotification(true);
      setLastStatus(false);
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    setIsOffline(!navigator.onLine);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [lastStatus]);

  // Don't show anything if online and notification is hidden
  if (!isOffline && !showNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 mx-auto w-full max-w-md px-4">
      <Alert 
        variant={isOffline ? "destructive" : "default"}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-2">
          {isOffline ? (
            <WifiOff className="h-4 w-4" />
          ) : (
            <Wifi className="h-4 w-4" />
          )}
          <div>
            <AlertTitle>
              {isOffline ? "You are offline" : "Back online"}
            </AlertTitle>
            <AlertDescription>
              {isOffline 
                ? "Changes will be saved locally and synced when you're back online." 
                : "Your app is now connected and any pending changes have been synced."}
            </AlertDescription>
          </div>
        </div>
        {showNotification && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotification(false)}
            className="ml-2 h-8 px-2"
          >
            Dismiss
          </Button>
        )}
      </Alert>
    </div>
  );
}

export default OfflineNotification;
