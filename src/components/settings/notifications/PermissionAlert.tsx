import React, { useState, useEffect } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PermissionAlertProps {
  permissionGranted: boolean;
  masterEnabled: boolean;
  pushEnabled: boolean;
  requestPermission: () => Promise<boolean>;
}

const PermissionAlert = ({ 
  permissionGranted, 
  masterEnabled, 
  pushEnabled, 
  requestPermission 
}: PermissionAlertProps) => {
  const { toast } = useToast();
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

  const handleRequestPermission = async () => {
    try {
      // Check if notification is supported
      if (!isNativeNotificationsSupported) {
        throw new Error('Notifications not supported in this browser or environment');
      }
      
      // Try to request permission
      const granted = await requestPermission();
      
      if (granted) {
        toast({
          title: "Notifications enabled",
          description: "You will now receive push notifications",
        });
      } else {
        // If permission is denied, show a more helpful message
        if (Notification.permission === 'denied') {
          toast({
            title: "Permission denied",
            description: "You need to enable notifications in your browser settings. Look for the lock/info icon in your address bar.",
            variant: "destructive",
            duration: 8000,
          });
        } else {
          toast({
            title: "Permission not granted",
            description: "Please try again or check your browser settings",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to request notification permission",
        variant: "destructive"
      });
    }
  };

  if (permissionGranted || !isNativeNotificationsSupported || !masterEnabled || !pushEnabled) {
    return null;
  }

  return (
    <Alert className="bg-yellow-50 border-yellow-200">
      <AlertTriangle className="h-4 w-4 text-yellow-800" />
      <AlertTitle className="text-yellow-800">Push notifications require permission</AlertTitle>
      <AlertDescription className="text-yellow-700">
        Your browser requires permission to send push notifications.
        <div className="mt-2">
          <button 
            type="button"
            onClick={handleRequestPermission}
            className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-md"
          >
            <Bell className="h-4 w-4 inline-block mr-1" />
            Request Permission
          </button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default PermissionAlert;
