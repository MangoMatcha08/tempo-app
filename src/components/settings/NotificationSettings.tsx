
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  emailPriority: string;
  pushPriority: string;
}

const NotificationSettings = () => {
  const { toast } = useToast();
  const form = useForm<NotificationSettings>({
    defaultValues: {
      emailEnabled: true,
      pushEnabled: true,
      emailPriority: "all",
      pushPriority: "high",
    },
  });

  const onSubmit = (data: NotificationSettings) => {
    console.log("Notification settings saved:", data);
    // In a real app, save these settings to the user's profile in the database
    toast({
      title: "Settings saved",
      description: "Your notification preferences have been updated",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="emailEnabled"
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
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {form.watch('emailEnabled') && (
            <FormField
              control={form.control}
              name="emailPriority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email notification priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All priorities</SelectItem>
                      <SelectItem value="medium-high">Medium and high priorities</SelectItem>
                      <SelectItem value="high">High priority only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only reminders of the selected priority (or higher) will trigger email notifications
                  </FormDescription>
                </FormItem>
              )}
            />
          )}
          
          <FormField
            control={form.control}
            name="pushEnabled"
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
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {form.watch('pushEnabled') && (
            <FormField
              control={form.control}
              name="pushPriority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Push notification priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All priorities</SelectItem>
                      <SelectItem value="medium-high">Medium and high priorities</SelectItem>
                      <SelectItem value="high">High priority only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only reminders of the selected priority (or higher) will trigger push notifications
                  </FormDescription>
                </FormItem>
              )}
            />
          )}
        </div>
        
        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </form>
    </Form>
  );
};

export default NotificationSettings;
