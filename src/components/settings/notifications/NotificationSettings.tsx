
import React, { useEffect } from "react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { 
  updateUserNotificationSettings,
  NotificationSettings as NotificationSettingsType
} from "@/services/notificationService";
import { useNotifications } from "@/contexts/NotificationContext";
import { ExtendedNotificationSettings } from "./types";
import MasterSwitch from "./MasterSwitch";
import BrowserAlert from "./BrowserAlert";
import PermissionAlert from "./PermissionAlert";
import EmailNotifications from "./EmailNotifications";
import PushNotifications from "./PushNotifications";
import InAppNotifications from "./InAppNotifications";

const NotificationSettings = () => {
  const { toast } = useToast();
  const { notificationSettings, permissionGranted, requestPermission } = useNotifications();
  
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
  React.useEffect(() => {
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <MasterSwitch control={form.control} />
        
        <BrowserAlert />
        
        <PermissionAlert 
          permissionGranted={permissionGranted} 
          masterEnabled={form.watch('enabled')} 
          pushEnabled={form.watch('push.enabled')} 
          requestPermission={requestPermission}
        />
        
        <div className="space-y-4">
          <EmailNotifications 
            control={form.control} 
            enabled={form.watch('enabled')} 
            emailEnabled={form.watch('email.enabled')}
            dailySummaryEnabled={form.watch('email.dailySummary.enabled')}
          />
          
          <PushNotifications 
            control={form.control} 
            enabled={form.watch('enabled')} 
            pushEnabled={form.watch('push.enabled')} 
          />
          
          <InAppNotifications 
            control={form.control} 
            enabled={form.watch('enabled')} 
            inAppEnabled={form.watch('inApp.enabled')} 
          />
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
