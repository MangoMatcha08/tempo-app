
import React from "react";
import { Control } from "react-hook-form";
import { 
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExtendedNotificationSettings, FormFieldPath } from "./types";

interface EmailNotificationsProps {
  control: Control<ExtendedNotificationSettings>;
  enabled: boolean;
  emailEnabled: boolean;
  dailySummaryEnabled: boolean;
}

const EmailNotifications = ({ 
  control,
  enabled,
  emailEnabled,
  dailySummaryEnabled
}: EmailNotificationsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="email.enabled" as={FormFieldPath}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-0.5">
                <FormLabel>Email Notifications</FormLabel>
                <FormDescription>
                  Receive notifications via email
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

        {/* Daily Summary Settings */}
        <FormField
          control={control}
          name="email.dailySummary.enabled" as={FormFieldPath}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-0.5">
                <FormLabel>Daily Summary</FormLabel>
                <FormDescription>
                  Receive a daily summary of your reminders
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  disabled={!enabled || !emailEnabled}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Summary Timing */}
        {dailySummaryEnabled && (
          <FormField
            control={control}
            name="email.dailySummary.timing" as={FormFieldPath}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Summary Timing</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={!enabled || !emailEnabled || !dailySummaryEnabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select when to send summary" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="before">Morning (Before day starts)</SelectItem>
                    <SelectItem value="after">Evening (End of day)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default EmailNotifications;
