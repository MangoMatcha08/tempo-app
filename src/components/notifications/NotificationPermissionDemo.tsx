
import React from 'react';
import { IOSPermissionFlow } from './IOSPermissionFlow';
import { InlinePermissionFlow } from './InlinePermissionFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useNotificationPermission } from '@/hooks/notifications/useNotificationPermission';
import { browserDetection } from '@/utils/browserDetection';

/**
 * A demo component that showcases the notification permission flow,
 * with special handling for iOS devices
 */
export function NotificationPermissionDemo() {
  const { permissionGranted, isSupported } = useNotificationPermission();
  const isIOS = browserDetection.isIOS();
  const supportsIOSWebPush = browserDetection.supportsIOSWebPush();
  const iosVersion = browserDetection.getIOSVersion();
  
  const handlePermissionComplete = (granted: boolean) => {
    console.log('Permission request completed:', granted ? 'granted' : 'denied');
  };
  
  if (!isSupported) {
    return (
      <Alert>
        <AlertTitle>Not Supported</AlertTitle>
        <AlertDescription>
          Notifications are not supported in your current browser or environment.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (permissionGranted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications Enabled</CardTitle>
          <CardDescription>
            You will receive notifications for important updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Successfully Enabled</AlertTitle>
            <AlertDescription>
              Notification permissions have been granted. You're all set!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {isIOS ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">iOS Push Notification Setup</h2>
          
          {!supportsIOSWebPush && (
            <Alert variant="warning">
              <AlertTitle>Unsupported iOS Version</AlertTitle>
              <AlertDescription>
                Your iOS version ({iosVersion}) doesn't support web push notifications.
                iOS 16.4 or newer is required.
              </AlertDescription>
            </Alert>
          )}
          
          {supportsIOSWebPush && <IOSPermissionFlow onComplete={handlePermissionComplete} />}
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Enable Notifications</h2>
          <Card>
            <CardHeader>
              <CardTitle>Stay Updated</CardTitle>
              <CardDescription>
                Enable notifications to receive important updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <InlinePermissionFlow label="Enable Notifications" variant="default" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default NotificationPermissionDemo;
