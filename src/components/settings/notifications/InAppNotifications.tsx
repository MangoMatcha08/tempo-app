
import React from "react";
import { Control } from "react-hook-form";
import { 
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExtendedNotificationSettings } from "./types";

interface InAppNotificationsProps {
  control: Control<ExtendedNotificationSettings>;
  enabled: boolean;
  inAppEnabled: boolean;
}

const InAppNotifications = ({ 
  control,
  enabled,
  inAppEnabled
}: InAppNotificationsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>In-App Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="inApp.enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-0.5">
                <FormLabel>In-App Notifications</FormLabel>
                <FormDescription>
                  Receive notifications within the application
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  disabled={!enabled}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Toast notifications */}
        <FormField
          control={control}
          name="inApp.toast"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-0.5">
                <FormLabel>Toast Notifications</FormLabel>
                <FormDescription>
                  Show temporary toast notifications
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  disabled={!enabled || !inAppEnabled}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Notification center */}
        <FormField
          control={control}
          name="inApp.notificationCenter"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-0.5">
                <FormLabel>Notification Center</FormLabel>
                <FormDescription>
                  Store notifications in the notification center
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  disabled={!enabled || !inAppEnabled}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default InAppNotifications;
