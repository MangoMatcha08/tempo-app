import { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

// Define a type for the permission state
type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export const NotificationTestComponent = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('default');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkNotificationPermission = async () => {
      setIsLoading(true);
      if (!('Notification' in window)) {
        setPermissionStatus('unsupported');
        setIsLoading(false);
        return;
      }

      const permission = await Notification.requestPermission();
      setPermissionStatus(permission as PermissionState);
      setIsLoading(false);
    };

    checkNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    setIsLoading(true);
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission as PermissionState);
    setIsLoading(false);
  };
  
  const renderPermissionStatus = () => {
    if (isLoading) {
      return <div>Checking permission...</div>;
    }
    
    if (permissionStatus === 'unsupported') {
      return (
        <Alert>
          <AlertTitle>Not Supported</AlertTitle>
          <AlertDescription>Push notifications are not supported in this browser.</AlertDescription>
        </Alert>
      );
    }
    
    if (permissionStatus === 'denied') {
      return (
        <Alert variant="destructive">
          <AlertTitle>Permission Denied</AlertTitle>
          <AlertDescription>
            You have denied notification permissions. Please enable them in your browser settings.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (permissionStatus === 'default') {
      return (
        <Alert>
          <AlertTitle>Permission Required</AlertTitle>
          <AlertDescription>Please allow notifications to receive updates.</AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Alert variant="success">
        <AlertTitle>Permission Granted</AlertTitle>
        <AlertDescription>You will receive notifications when they are sent.</AlertDescription>
      </Alert>
    );
  };

  return (
    <div>
      {renderPermissionStatus()}
      {permissionStatus === 'default' && (
        <Button onClick={requestNotificationPermission} disabled={isLoading}>
          Request Permission
        </Button>
      )}
    </div>
  );
};
