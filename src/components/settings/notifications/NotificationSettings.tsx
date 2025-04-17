import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import MasterSwitch from "./MasterSwitch";
import ChannelSettings from "./ChannelSettings";
import PermissionAlert from "./PermissionAlert";
import BrowserAlert from "./BrowserAlert";
import PushNotifications from "./PushNotifications";
import EmailNotifications from "./EmailNotifications";
import InAppNotifications from "./InAppNotifications";
import PermissionDiagnostics from "./PermissionDiagnostics";
import { usePermissionTracker } from "@/hooks/notifications/usePermissionTracker";
import { useNotificationSettings } from "@/hooks/notifications/useNotificationSettings";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { ExtendedNotificationSettings } from "./types";
import { Form as FormProvider } from "@/components/ui/form";

const NotificationSettings = () => {
  const { requestPermission, permissionGranted, isSupported } = usePermissionTracker();
  const { settings, updateSettings } = useNotificationSettings();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const form = useForm<ExtendedNotificationSettings>({
    defaultValues: settings as ExtendedNotificationSettings,
  });
  
  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading notification settings...</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const masterEnabled = settings.enabled ?? false;
  const pushEnabled = settings.push?.enabled ?? false;
  const emailEnabled = settings.email?.enabled ?? false;
  const inAppEnabled = settings.inApp?.enabled ?? false;
  const dailySummaryEnabled = settings.email?.dailySummary?.enabled ?? false;

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure your notification preferences</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiagnostics(prev => !prev)}
              className="h-8"
            >
              {showDiagnostics ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Diagnostics
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Diagnostics
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormProvider {...form}>
            <MasterSwitch control={form.control} />
            
            <PermissionAlert
              permissionGranted={permissionGranted}
              masterEnabled={masterEnabled}
              pushEnabled={pushEnabled}
              requestPermission={requestPermission}
              isSupported={isSupported}
            />
            
            <BrowserAlert 
              permissionGranted={permissionGranted} 
              isSupported={isSupported} 
            />
            
            <Tabs defaultValue="push" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="push">Push</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="inapp">In-App</TabsTrigger>
              </TabsList>
              <TabsContent value="push">
                <PushNotifications
                  control={form.control}
                  enabled={masterEnabled}
                  pushEnabled={pushEnabled}
                />
              </TabsContent>
              <TabsContent value="email">
                <EmailNotifications
                  control={form.control}
                  enabled={masterEnabled}
                  emailEnabled={emailEnabled}
                  dailySummaryEnabled={dailySummaryEnabled}
                />
              </TabsContent>
              <TabsContent value="inapp">
                <InAppNotifications
                  control={form.control}
                  enabled={masterEnabled}
                  inAppEnabled={inAppEnabled}
                />
              </TabsContent>
            </Tabs>
          </FormProvider>
        </CardContent>
      </Card>
      
      {showDiagnostics && (
        <PermissionDiagnostics />
      )}
    </>
  );
};

export default NotificationSettings;
