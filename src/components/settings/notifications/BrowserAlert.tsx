import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface BrowserAlertProps {
  permissionGranted?: boolean;
  isSupported?: boolean;
}

const BrowserAlert: React.FC<BrowserAlertProps> = ({ 
  permissionGranted, 
  isSupported 
}) => {
  const isBrowser = typeof window !== 'undefined';
  const isNotificationSupported = isBrowser && 'Notification' in window;
  
  if (isNotificationSupported) {
    return null;
  }
  
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Browser Compatibility Issue</AlertTitle>
      <AlertDescription>
        Your browser doesn't support notifications. To receive notifications, please use a modern browser
        like Chrome, Firefox, Safari, or Edge.
      </AlertDescription>
    </Alert>
  );
};

export default BrowserAlert;
