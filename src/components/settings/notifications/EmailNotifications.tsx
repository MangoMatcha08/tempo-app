import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Control } from "react-hook-form";
import { ExtendedNotificationSettings } from "./types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReminderPriority } from "@/types/reminderTypes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    <>
      <FormField
        control={control}
        name="email.enabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Email Notifications</FormLabel>
              <FormDescription>
                Receive reminder notifications via email
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={!enabled}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {enabled && emailEnabled && (
        <>
          <FormField
            control={control}
            name="email.address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="your@email.com" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  The email address where you'll receive notifications
                </FormDescription>
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="email.dailySummary.enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Daily Summary Email</FormLabel>
                  <FormDescription>
                    Receive a daily summary of all reminders
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
          
          {dailySummaryEnabled && (
            <FormField
              control={control}
              name="email.dailySummary.timing"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Daily Summary Timing</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="before" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Before School (7:00 AM)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="after" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          After School (3:30 PM)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    <Clock className="h-4 w-4 inline-block mr-1" />
                    Choose when to receive your daily summary email
                  </FormDescription>
                </FormItem>
              )}
            />
          )}
          
          <FormField
            control={control}
            name="email.minPriority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Individual Email Priority Level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ReminderPriority.LOW}>Low (All Reminders)</SelectItem>
                    <SelectItem value={ReminderPriority.MEDIUM}>Medium & High Only</SelectItem>
                    <SelectItem value={ReminderPriority.HIGH}>High Priority Only</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Only reminders of the selected priority (or higher) will trigger individual email notifications
                </FormDescription>
              </FormItem>
            )}
          />
          
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTriangle className="h-4 w-4 text-blue-800" />
            <AlertTitle className="text-blue-800">Note on Individual Email Notifications</AlertTitle>
            <AlertDescription className="text-blue-700">
              Individual email notifications are limited to conserve resources. 
              Consider using the daily summary option for a complete overview of your reminders.
            </AlertDescription>
          </Alert>
        </>
      )}
    </>
  );
};

export default EmailNotifications;
