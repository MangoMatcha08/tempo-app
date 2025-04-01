
import { useState, useEffect } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const BrowserAlert = () => {
  const [isNativeNotificationsSupported, setIsNativeNotificationsSupported] = useState(true);
  
  // Check if notifications are supported in this browser
  useEffect(() => {
    const checkNotificationSupport = () => {
      // Check in a safe way for all environments
      const isSupported = typeof window !== 'undefined' && 
                          'Notification' in window &&
                          typeof navigator !== 'undefined' &&
                          'serviceWorker' in navigator;
      
      setIsNativeNotificationsSupported(isSupported);
    };
    
    checkNotificationSupport();
  }, []);

  if (isNativeNotificationsSupported) {
    return null;
  }

  return (
    <Alert className="bg-yellow-50 border-yellow-200">
      <AlertTriangle className="h-4 w-4 text-yellow-800" />
      <AlertTitle className="text-yellow-800">Browser limitation</AlertTitle>
      <AlertDescription className="text-yellow-700">
        Push notifications aren't supported in this browser or environment. 
        For full notification support, please use a modern browser like Chrome, Firefox, or Edge.
      </AlertDescription>
    </Alert>
  );
};

export default BrowserAlert;
