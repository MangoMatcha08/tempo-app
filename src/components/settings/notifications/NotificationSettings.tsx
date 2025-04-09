import React, { useEffect } from "react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSettings, useNotificationPermission } from "@/contexts/NotificationContext";
import { ExtendedNotificationSettings } from "./types";
import MasterSwitch from "./MasterSwitch";
import BrowserAlert from "./BrowserAlert";
import PermissionAlert from "./PermissionAlert";
import EmailNotifications from "./EmailNotifications";
import PushNotifications from "./PushNotifications";
import InAppNotifications from "./InAppNotifications";
import NotificationCleanupSettings from "../NotificationCleanupSettings";
import { Button } from "@/components/ui/button";
import { ReminderPriority } from "@/types/reminderTypes";
import { NOTIFICATION_FEATURES } from "@/types/notifications/featureFlags";

const NotificationSettings = () => {
  const { toast } = useToast();
  const { settings, updateSettings } = useNotificationSettings();
  const { permissionGranted, requestPermission } = useNotificationPermission();
  
  const extendedSettings: ExtendedNotificationSettings = {
    ...settings,
    email: {
      ...settings.email,
      dailySummary: {
        enabled: settings.email?.dailySummary?.enabled || false,
        timing: settings.email?.dailySummary?.timing || 'after'
      }
    }
  };
  
  const form = useForm<ExtendedNotificationSettings>({
    defaultValues: extendedSettings
  });

  React.useEffect(() => {
    const updatedSettings: ExtendedNotificationSettings = {
      ...settings,
      email: {
        ...settings.email,
        dailySummary: {
          enabled: settings.email?.dailySummary?.enabled || false,
          timing: settings.email?.dailySummary?.timing || 'after'
        }
      }
    };
    
    form.reset(updatedSettings);
  }, [settings, form]);

  const handleRequestPermission = async (): Promise<boolean> => {
    try {
      const result = await requestPermission();
      return !!result.granted;
    } catch (error) {
      console.error("Error requesting permission:", error);
      return false;
    }
  };

  const onSubmit = async (data: ExtendedNotificationSettings) => {
    try {
      await updateSettings(data);
      
      console.log("Notification settings saved:", data);
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated",
        duration: 3000
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
        duration: 3000
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
          requestPermission={handleRequestPermission}
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
        
        {NOTIFICATION_FEATURES.HISTORY_ENABLED && (
          <NotificationCleanupSettings />
        )}
        
        <Button type="submit">
          Save Changes
        </Button>
      </form>
    </Form>
  );
};

export default NotificationSettings;
