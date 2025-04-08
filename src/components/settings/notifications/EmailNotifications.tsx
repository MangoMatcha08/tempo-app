
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Control } from "react-hook-form";
import { ExtendedNotificationSettings } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReminderPriority } from "@/types/reminderTypes";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
      <CardContent className="pt-6 space-y-4">
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
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="email.minPriority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email notification priority</FormLabel>
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
                    Only reminders of the selected priority (or higher) will be emailed
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
                    <FormLabel className="text-base">Daily Summary</FormLabel>
                    <FormDescription>
                      Receive a daily email summary of upcoming reminders
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
                    <FormLabel>Summary Timing</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="before" id="before" />
                          <Label htmlFor="before">Morning (Start of Day)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="after" id="after" />
                          <Label htmlFor="after">Evening (End of Day)</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Choose when to receive your daily summary email
                    </FormDescription>
                  </FormItem>
                )}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailNotifications;
