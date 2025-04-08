
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Control } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationSettings } from "@/types/notifications/settingsTypes";
import { useNotificationPermission } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NotificationTogglesProps {
  control: Control<NotificationSettings>;
  enabled: boolean;
}

const NotificationToggles = ({ control, enabled }: NotificationTogglesProps) => {
  const { permissionGranted, isSupported, requestPermission } = useNotificationPermission();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Enable All Notifications</FormLabel>
                  <FormDescription>
                    Master switch for all notification types
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {isSupported && !permissionGranted && enabled && (
            <Alert variant="warning" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Browser notifications are not enabled. 
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-1" 
                  onClick={requestPermission}
                >
                  Enable notifications
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {!isSupported && enabled && (
            <Alert variant="warning" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your browser doesn't support notifications. Some features may not work.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationToggles;
