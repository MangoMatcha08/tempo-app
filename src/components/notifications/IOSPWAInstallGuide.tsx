
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { browserDetection } from "@/utils/browserDetection";

interface IOSPWAInstallGuideProps {
  onDismiss: () => void;
}

/**
 * Component to guide users through installing the PWA on iOS
 * 
 * This is crucial for iOS push notifications as they only work in PWA mode
 */
const IOSPWAInstallGuide: React.FC<IOSPWAInstallGuideProps> = ({ onDismiss }) => {
  if (!browserDetection.isIOSSafari() || browserDetection.isIOSPWA()) {
    return null;
  }
  
  return (
    <Alert className="my-4 border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50">
      <Info className="h-4 w-4 text-amber-600 dark:text-amber-500" />
      <AlertTitle className="text-amber-800 dark:text-amber-500">
        Install as App for Push Notifications
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-400">
        <p>On iOS, push notifications only work when installed as an app on your home screen:</p>
        <ol className="list-decimal ml-5 mt-2 space-y-1">
          <li>Tap the share icon in Safari</li>
          <li>Scroll down and tap "Add to Home Screen"</li>
          <li>Tap "Add" in the top-right corner</li>
          <li>Open the app from your home screen</li>
        </ol>
      </AlertDescription>
      <Button 
        onClick={onDismiss} 
        className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
      >
        Got it
      </Button>
    </Alert>
  );
};

export default IOSPWAInstallGuide;
