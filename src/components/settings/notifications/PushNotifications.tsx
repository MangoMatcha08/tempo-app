
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Control } from "react-hook-form";
import { ExtendedNotificationSettings } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReminderPriority } from "@/types/reminderTypes";

interface PushNotificationsProps {
  control: Control<ExtendedNotificationSettings>;
  enabled: boolean;
  pushEnabled: boolean;
}

const PushNotifications = ({ control, enabled, pushEnabled }: PushNotificationsProps) => {
  return (
    <>
      <FormField
        control={control}
        name="push.enabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Push Notifications</FormLabel>
              <FormDescription>
                Receive reminder notifications on your device
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
      
      {enabled && pushEnabled && (
        <FormField
          control={control}
          name="push.minPriority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Push notification priority</FormLabel>
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
                Only reminders of the selected priority (or higher) will trigger push notifications
              </FormDescription>
            </FormItem>
          )}
        />
      )}
    </>
  );
};

export default PushNotifications;
