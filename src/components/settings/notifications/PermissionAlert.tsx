
import React, { useState, useEffect } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, BellOff, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNotificationPermission } from "@/hooks/notifications/useNotificationPermission";
import { PermissionErrorReason } from "@/types/notifications/permissionTypes";

interface PermissionAlertProps {
  permissionGranted: boolean;
  masterEnabled: boolean;
  pushEnabled: boolean;
  requestPermission: () => Promise<any>;
  isSupported: boolean;
}

const PermissionAlert = ({
  permissionGranted,
  masterEnabled,
  pushEnabled,
  requestPermission,
  isSupported
}: PermissionAlertProps) => {
  const [requesting, setRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorReason, setErrorReason] = useState<string | undefined>(undefined);
  
  // Reset status after display period
  useEffect(() => {
    if (requestStatus !== 'idle') {
      const timer = setTimeout(() => {
        setRequestStatus('idle');
        setErrorReason(undefined);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [requestStatus]);
  
  const handleRequestPermission = async () => {
    setRequesting(true);
    setRequestStatus('idle');
    setErrorReason(undefined);
    
    try {
      // Request permission and get result
      const result = await requestPermission();
      console.log('Permission request result:', result);
      
      if (result.granted) {
        setRequestStatus('success');
        toast.success("Notification permission granted!", {
          description: "You'll now receive push notifications.",
          duration: 4000,
        });
      } else {
        setRequestStatus('error');
        setErrorReason(result.reason);
        
        // Display different toast messages based on error reason
        switch (result.reason) {
          case PermissionErrorReason.PERMISSION_DENIED:
            toast.error("Permission denied", {
              description: "Please enable notifications in your browser settings.",
              duration: 5000,
            });
            break;
            
          case PermissionErrorReason.BROWSER_UNSUPPORTED:
            toast.error("Browser not supported", {
              description: "Your browser doesn't support web notifications.",
              duration: 5000,
            });
            break;
            
          case PermissionErrorReason.IOS_VERSION_UNSUPPORTED:
            toast.error("iOS version not supported", {
              description: "Your iOS version doesn't support web push notifications. iOS 16.4+ required.",
              duration: 5000,
            });
            break;
            
          case PermissionErrorReason.TOKEN_REQUEST_FAILED:
            toast.error("Token request failed", {
              description: "Couldn't register your device for notifications. Please try again.",
              duration: 5000,
            });
            break;
            
          case PermissionErrorReason.SERVICE_WORKER_FAILED:
            toast.error("Service worker registration failed", {
              description: "Unable to register service worker needed for notifications.",
              duration: 5000,
            });
            break;
            
          default:
            toast.error("Permission request failed", {
              description: result.error ? String(result.error) : "Unknown error occurred",
              duration: 5000,
            });
        }
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setRequestStatus('error');
      
      toast.error("Error requesting permission", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 5000,
      });
    } finally {
      setRequesting(false);
    }
  };
  
  // Only show if notifications are enabled but permission isn't granted
  if (!masterEnabled || !pushEnabled || permissionGranted) {
    return null;
  }
  
  // Show different alert based on browser support
  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <BellOff className="h-4 w-4" />
        <AlertTitle>Notifications Not Supported</AlertTitle>
        <AlertDescription>
          Your browser doesn't support web notifications.
          Try using a modern browser like Chrome, Firefox, or Safari.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Alert variant="default" className="relative border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle>Notification Permission Required</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          You need to grant notification permission to receive push notifications.
        </p>
        <div className="flex items-center gap-2 pt-1">
          <Button 
            size="sm" 
            onClick={handleRequestPermission}
            disabled={requesting}
            className="self-start"
          >
            {requesting ? "Requesting..." : "Request Permission"}
          </Button>
          
          {requestStatus === 'success' && (
            <span className="flex items-center text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Permission granted
            </span>
          )}
          
          {requestStatus === 'error' && (
            <span className="flex items-center text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="mr-1 h-4 w-4" />
              {errorReason || "Request failed"}
            </span>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default PermissionAlert;
