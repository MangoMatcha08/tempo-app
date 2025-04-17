
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { browserDetection } from '@/utils/browserDetection';
import { useNotificationPermission } from '@/hooks/notifications/useNotificationPermission';
import { Info, AlertTriangle } from 'lucide-react';

export const IOSPermissionPrompt = () => {
  const { requestPermission, permissionGranted } = useNotificationPermission();
  const isIOSDevice = browserDetection.isIOS();
  const iosVersion = browserDetection.getIOSVersion();

  // Don't show anything if not on iOS or already granted
  if (!isIOSDevice || permissionGranted) {
    return null;
  }

  // Show version warning if iOS < 16.4
  if (iosVersion && iosVersion < 16.4) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications Not Available</CardTitle>
          <CardDescription>
            Your iOS version ({iosVersion}) doesn't support web push notifications.
            iOS 16.4 or later is required.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enable Notifications</CardTitle>
        <CardDescription>
          Get timely updates about your important reminders
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            To receive notifications on iOS:
            <ol className="mt-2 ml-5 list-decimal">
              <li>Install this app to your home screen first</li>
              <li>Open the app from your home screen</li>
              <li>Enable notifications when prompted</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>

      <CardFooter>
        <Button 
          onClick={() => requestPermission()}
          className="w-full"
        >
          Enable Notifications
        </Button>
      </CardFooter>
    </Card>
  );
};
