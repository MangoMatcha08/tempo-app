
import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [requesting, setRequesting] = React.useState(false);
  
  const handleRequestPermission = async () => {
    setRequesting(true);
    try {
      await requestPermission();
    } finally {
      setRequesting(false);
    }
  };
  
  // Only show if notifications are enabled but permission isn't granted
  if (!masterEnabled || !pushEnabled || permissionGranted) {
    return null;
  }
  
  return (
    <Alert variant="default">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Notification Permission Required</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          You need to grant notification permission to receive push notifications.
        </p>
        <Button 
          size="sm" 
          onClick={handleRequestPermission}
          disabled={requesting}
          className="self-start"
        >
          {requesting ? "Requesting..." : "Request Permission"}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default PermissionAlert;
