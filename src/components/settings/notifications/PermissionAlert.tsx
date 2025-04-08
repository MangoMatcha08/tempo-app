
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  // If notifications are disabled or permissions are granted, don't show alert
  if (!masterEnabled || !pushEnabled || permissionGranted) return null;
  
  return (
    <Alert variant="warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between flex-wrap">
        <span>Push notifications require browser permission.</span>
        <Button 
          onClick={requestPermission}
          variant="outline"
          size="sm"
          className="mt-2 sm:mt-0"
        >
          Enable Notifications
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default PermissionAlert;
