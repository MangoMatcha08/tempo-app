
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Control } from "react-hook-form";
import { NotificationSettings } from "@/types/notifications/settingsTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReminderPriority } from "@/types/reminderTypes";
import { Mail, BellRing, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChannelSettingsProps {
  control: Control<NotificationSettings>;
  enabled: boolean;
}

const ChannelSettings = ({ control, enabled }: ChannelSettingsProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Notification Channels</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="push" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="push" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" /> 
              Push
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> 
              Email
            </TabsTrigger>
            <TabsTrigger value="inApp" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" /> 
              In-App
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="push" className="space-y-4">
            <FormField
              control={control}
              name="push.enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Push Notifications</FormLabel>
                    <FormDescription>
                      Receive notifications on this device
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
            
            <FormField
              control={control}
              name="push.minPriority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Priority</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    disabled={!enabled || !control._formValues.push.enabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ReminderPriority.LOW}>Low (All reminders)</SelectItem>
                      <SelectItem value={ReminderPriority.MEDIUM}>Medium & High only</SelectItem>
                      <SelectItem value={ReminderPriority.HIGH}>High priority only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only send notifications for reminders at or above this priority
                  </FormDescription>
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4">
            <FormField
              control={control}
              name="email.enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Email Notifications</FormLabel>
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
            
            <FormField
              control={control}
              name="email.address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email" 
                      placeholder="your@email.com"
                      disabled={!enabled || !control._formValues.email.enabled} 
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
                  <FormLabel>Minimum Priority</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!enabled || !control._formValues.email.enabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ReminderPriority.LOW}>Low (All reminders)</SelectItem>
                      <SelectItem value={ReminderPriority.MEDIUM}>Medium & High only</SelectItem>
                      <SelectItem value={ReminderPriority.HIGH}>High priority only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only send emails for reminders at or above this priority
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="email.dailySummary.enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Daily Summary</FormLabel>
                    <FormDescription>
                      Receive a daily email summary of your reminders
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!enabled || !control._formValues.email.enabled}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="inApp" className="space-y-4">
            <FormField
              control={control}
              name="inApp.enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>In-App Notifications</FormLabel>
                    <FormDescription>
                      Show notification toasts within the app
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
            
            <FormField
              control={control}
              name="inApp.minPriority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Priority</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!enabled || !control._formValues.inApp.enabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ReminderPriority.LOW}>Low (All reminders)</SelectItem>
                      <SelectItem value={ReminderPriority.MEDIUM}>Medium & High only</SelectItem>
                      <SelectItem value={ReminderPriority.HIGH}>High priority only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only show in-app notifications for reminders at or above this priority
                  </FormDescription>
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ChannelSettings;
