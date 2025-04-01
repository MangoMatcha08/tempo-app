
import { useState, useEffect } from "react";
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
import { 
  updateUserNotificationSettings,
  NotificationSettings as NotificationSettingsType
} from "@/services/notificationService";
import { useNotifications } from "@/contexts/NotificationContext";
import { ReminderPriority } from "@/types/reminderTypes";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, AlertTriangle, Clock } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Extended notification settings to include daily summary options
interface ExtendedNotificationSettings extends NotificationSettingsType {
  email: {
    enabled: boolean;
    address: string;
    minPriority: ReminderPriority;
    dailySummary: {
      enabled: boolean;
      timing: 'before' | 'after';
    };
  };
}

const NotificationSettings = () => {
  const { toast } = useToast();
  const { notificationSettings, permissionGranted, requestPermission } = useNotifications();
  const [isNativeNotificationsSupported, setIsNativeNotificationsSupported] = useState(true);
  
  // Check if notifications are supported in this browser
  useEffect(() => {
    const checkNotificationSupport = () => {
      // Check in a safe way for all environments
      const isSupported = typeof window !== 'undefined' && 
                          'Notification' in window &&
                          typeof navigator !== 'undefined' &&
                          'serviceWorker' in navigator;
      
      setIsNativeNotificationsSupported(isSupported);
    };
    
    checkNotificationSupport();
  }, []);
  
  // Extend the default notification settings with daily summary options
  const extendedSettings: ExtendedNotificationSettings = {
    ...notificationSettings,
    email: {
      ...notificationSettings.email,
      dailySummary: {
        enabled: notificationSettings.email?.dailySummary?.enabled || false,
        timing: notificationSettings.email?.dailySummary?.timing || 'after'
      }
    }
  };
  
  const form = useForm<ExtendedNotificationSettings>({
    defaultValues: extendedSettings
  });

  // Update form values when context settings change
  useEffect(() => {
    // Merge the existing settings with the default daily summary settings
    const updatedSettings: ExtendedNotificationSettings = {
      ...notificationSettings,
      email: {
        ...notificationSettings.email,
        dailySummary: {
          enabled: notificationSettings.email?.dailySummary?.enabled || false,
          timing: notificationSettings.email?.dailySummary?.timing || 'after'
        }
      }
    };
    
    form.reset(updatedSettings);
  }, [notificationSettings, form]);

  const onSubmit = async (data: ExtendedNotificationSettings) => {
    try {
      const userId = localStorage.getItem('userId') || 'anonymous';
      await updateUserNotificationSettings(userId, data);
      
      console.log("Notification settings saved:", data);
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated",
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive"
      });
    }
  };

  const handleRequestPermission = async () => {
    try {
      // Check if notification is supported
      if (!isNativeNotificationsSupported) {
        throw new Error('Notifications not supported in this browser or environment');
      }
      
      // Try to request permission
      const granted = await requestPermission();
      
      if (granted) {
        toast({
          title: "Notifications enabled",
          description: "You will now receive push notifications",
        });
      } else {
        // If permission is denied, show a more helpful message
        if (Notification.permission === 'denied') {
          toast({
            title: "Permission denied",
            description: "You need to enable notifications in your browser settings. Look for the lock/info icon in your address bar.",
            variant: "destructive",
            duration: 8000,
          });
        } else {
          toast({
            title: "Permission not granted",
            description: "Please try again or check your browser settings",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to request notification permission",
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Master Switch</FormLabel>
                <FormDescription>
                  Enable or disable all notifications
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
        
        {!isNativeNotificationsSupported && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-800" />
            <AlertTitle className="text-yellow-800">Browser limitation</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Push notifications aren't supported in this browser or environment. 
              For full notification support, please use a modern browser like Chrome, Firefox, or Edge.
            </AlertDescription>
          </Alert>
        )}
        
        {!permissionGranted && isNativeNotificationsSupported && form.watch('enabled') && form.watch('push.enabled') && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-800" />
            <AlertTitle className="text-yellow-800">Push notifications require permission</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Your browser requires permission to send push notifications.
              <div className="mt-2">
                <button 
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-md"
                >
                  <Bell className="h-4 w-4 inline-block mr-1" />
                  Request Permission
                </button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <FormField
            control={form.control}
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
                    disabled={!form.watch('enabled')}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {form.watch('enabled') && form.watch('email.enabled') && (
            <>
              <FormField
                control={form.control}
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
                control={form.control}
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
              
              {form.watch('email.dailySummary.enabled') && (
                <FormField
                  control={form.control}
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
                control={form.control}
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
          
          <FormField
            control={form.control}
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
                    disabled={!form.watch('enabled')}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {form.watch('enabled') && form.watch('push.enabled') && (
            <FormField
              control={form.control}
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
          
          <FormField
            control={form.control}
            name="inApp.enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">In-App Notifications</FormLabel>
                  <FormDescription>
                    Show toast notifications within the app
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!form.watch('enabled')}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {form.watch('enabled') && form.watch('inApp.enabled') && (
            <FormField
              control={form.control}
              name="inApp.minPriority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>In-app notification priority</FormLabel>
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
                    Only reminders of the selected priority (or higher) will show in-app notifications
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
