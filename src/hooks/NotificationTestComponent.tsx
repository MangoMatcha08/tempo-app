import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BellIcon, BellOffIcon, InfoIcon, CheckIcon, XIcon } from 'lucide-react';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("NotificationTest");

const NotificationTestComponent = () => {
  const { toast } = useToast();
  const { 
    permissionStatus, 
    isRequesting, 
    deviceInfo, 
    requestPermission, 
    sendTestNotification 
  } = useNotificationPermission();
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [canRequest, setCanRequest] = useState(false);
  const [compatibilityStatus, setCompatibilityStatus] = useState('');

  useEffect(() => {
    // Determine if notifications are supported by checking permission status
    const isSupported = permissionStatus !== 'unsupported';
    setNotificationsSupported(isSupported);
    
    // Update permission granted status
    if (permissionStatus === 'granted') {
      setPermissionGranted(true);
    } else {
      setPermissionGranted(false);
    }
    
    // Update request button state
    setCanRequest(permissionStatus === 'default' || permissionStatus === 'denied');
    
    // Update compatibility status
    if (!isSupported) {
      setCompatibilityStatus('unsupported');
    } else if (permissionStatus === 'granted') {
      setCompatibilityStatus('supported');
    } else {
      setCompatibilityStatus('partial');
    }
  }, [permissionStatus]);

  useEffect(() => {
    debugLog(`Notification permission status: ${permissionStatus}`);
    debugLog(`Device info: iOS: ${deviceInfo.isIOS}, Android: ${deviceInfo.isAndroid}, PWA: ${deviceInfo.isPWA}`);
  }, [permissionStatus, deviceInfo]);

  const handleRequestPermission = async () => {
    try {
      const result = await requestPermission();
      if (result) {
        toast({
          title: "Permission Granted",
          description: "You will now receive notifications for your reminders.",
          duration: 3000,
        });
      } else if (permissionStatus === 'denied') {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "There was an error requesting notification permission.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleTestNotification = async () => {
    try {
      const result = await sendTestNotification();
      if (result) {
        toast({
          title: "Test Notification Sent",
          description: "If you don't see the notification, please check your device settings.",
          duration: 3000,
        });
      } else {
        toast({
          title: "Test Failed",
          description: "Failed to send test notification. Please check permissions.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "There was an error sending the test notification.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {permissionStatus === 'granted' ? (
            <BellIcon className="h-5 w-5 text-green-500" />
          ) : (
            <BellOffIcon className="h-5 w-5 text-amber-500" />
          )}
          Notification Settings
        </CardTitle>
        <CardDescription>
          Enable notifications to get reminders for your tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        {deviceInfo.isPWA && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-500" />
            <AlertTitle>PWA Mode Detected</AlertTitle>
            <AlertDescription>
              You're using the app in PWA mode, which provides the best notification experience.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notification Status</p>
              <p className="text-sm text-gray-500">
                {permissionStatus === 'granted' ? 'Enabled' : 
                 permissionStatus === 'denied' ? 'Blocked' : 
                 permissionStatus === 'default' ? 'Not set' : 
                 permissionStatus === 'unsupported' ? 'Not supported' : 'Checking...'}
              </p>
            </div>
            <div>
              {permissionStatus === 'granted' ? (
                <CheckIcon className="h-6 w-6 text-green-500" />
              ) : permissionStatus === 'denied' ? (
                <XIcon className="h-6 w-6 text-red-500" />
              ) : (
                <InfoIcon className="h-6 w-6 text-amber-500" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Device Type</p>
              <p className="text-sm text-gray-500">
                {deviceInfo.isIOS ? 'iOS' : 
                 deviceInfo.isAndroid ? 'Android' : 'Desktop/Other'}
                {deviceInfo.isPWA ? ' (PWA)' : ''}
              </p>
            </div>
          </div>
        </div>

        {permissionStatus === 'denied' && (
          <Alert className="mt-4 bg-red-50 border-red-200">
            <XIcon className="h-4 w-4 text-red-500" />
            <AlertTitle>Notifications Blocked</AlertTitle>
            <AlertDescription>
              Please enable notifications in your browser or device settings to receive reminders.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
          <Button 
            onClick={handleRequestPermission} 
            disabled={isRequesting || permissionStatus === 'unsupported'}
            className="w-full"
          >
            {isRequesting ? 'Requesting...' : 'Enable Notifications'}
          </Button>
        )}
        
        {permissionStatus === 'granted' && (
          <Button 
            onClick={handleTestNotification} 
            variant="outline" 
            className="w-full"
          >
            Send Test Notification
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default NotificationTestComponent;
