
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
import { ExtendedNotificationSettings, FormFieldPath } from "./types";

interface PushNotificationsProps {
  control: Control<ExtendedNotificationSettings>;
  enabled: boolean;
  pushEnabled: boolean;
}

const PushNotifications = ({ 
  control,
  enabled,
  pushEnabled
}: PushNotificationsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Push Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="push.enabled" as={FormFieldPath}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-0.5">
                <FormLabel>Push Notifications</FormLabel>
                <FormDescription>
                  Receive push notifications in your browser
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

        <FormField
          control={control}
          name="push.minPriority" as={FormFieldPath}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-0.5">
                <FormLabel>High Priority Only</FormLabel>
                <FormDescription>
                  Only receive push notifications for high priority reminders
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  disabled={!enabled || !pushEnabled}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default PushNotifications;
