
import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { browserDetection } from "@/utils/browserDetection";

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
  const isPushSupported = isBrowser && 'PushManager' in window;
  const isIOSWithoutPushSupport = browserDetection.isIOS() && !browserDetection.supportsIOSWebPush();
  
  // Only show alert if notifications are not supported
  if ((isNotificationSupported && isPushSupported) && !isIOSWithoutPushSupport) {
    return null;
  }
  
  // Different message for iOS with unsupported version
  if (isIOSWithoutPushSupport) {
    return (
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle>iOS Version Compatibility</AlertTitle>
        <AlertDescription>
          Push notifications require iOS 16.4 or later and the app must be installed as a home screen app.
          Your current iOS version is {browserDetection.getIOSVersion()}.
        </AlertDescription>
      </Alert>
    );
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
