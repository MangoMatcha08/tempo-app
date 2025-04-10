
import React from "react";
import { useNotificationHistory } from "@/contexts/notificationHistory";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { NotificationCleanupConfig } from "@/types/notifications/serviceWorkerTypes";
import { useToast } from "@/hooks/use-toast";
import { Trash2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const NotificationCleanupSettings = () => {
  const { 
    cleanupConfig, 
    updateCleanupConfig, 
    cleanupNotifications,
    records
  } = useNotificationHistory();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = React.useState(false);
  const [cleanupResult, setCleanupResult] = React.useState<null | {
    totalRemoved: number;
    byAge: number;
    byCount: number;
  }>(null);

  const form = useForm<NotificationCleanupConfig>({
    defaultValues: cleanupConfig
  });

  React.useEffect(() => {
    form.reset(cleanupConfig);
  }, [cleanupConfig]);

  const onSubmit = async (data: NotificationCleanupConfig) => {
    try {
      updateCleanupConfig(data);
      toast({
        title: "Settings saved",
        description: "Notification cleanup settings updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cleanup settings",
        variant: "destructive"
      });
    }
  };

  const runManualCleanup = async () => {
    setIsRunning(true);
    setCleanupResult(null);
    
    try {
      // Get values from form
      const formValues = form.getValues();
      
      const result = await cleanupNotifications({
        maxAge: formValues.maxAge,
        maxCount: formValues.maxCount,
        keepHighPriority: formValues.keepHighPriority,
        highPriorityMaxAge: formValues.highPriorityMaxAge
      });
      
      setCleanupResult(result);
      
      toast({
        title: "Cleanup complete",
        description: `Removed ${result.totalRemoved} notifications`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run cleanup",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Cleanup</CardTitle>
        <CardDescription>
          Configure automatic cleanup to maintain system performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Automatic Cleanup</FormLabel>
                    <FormDescription>
                      Automatically remove old notifications
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
            
            <div className={`space-y-4 ${form.watch("enabled") ? "" : "opacity-50"}`}>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="maxAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Age (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          disabled={!form.watch("enabled")}
                        />
                      </FormControl>
                      <FormDescription>
                        Remove notifications older than this
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Count</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          disabled={!form.watch("enabled")}
                        />
                      </FormControl>
                      <FormDescription>
                        Keep only the most recent notifications
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="keepHighPriority"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Prioritize Important Notifications</FormLabel>
                      <FormDescription>
                        Keep high priority notifications longer
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!form.watch("enabled")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {form.watch("keepHighPriority") && (
                <FormField
                  control={form.control}
                  name="highPriorityMaxAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>High Priority Max Age (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          disabled={!form.watch("enabled") || !form.watch("keepHighPriority")}
                        />
                      </FormControl>
                      <FormDescription>
                        How long to keep high priority notifications
                      </FormDescription>
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="cleanupInterval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cleanup Interval (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="168"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        disabled={!form.watch("enabled")}
                      />
                    </FormControl>
                    <FormDescription>
                      How often to run automatic cleanup
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                className="gap-2"
                onClick={runManualCleanup}
                disabled={isRunning || records.length === 0}
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Run Cleanup Now
                  </>
                )}
              </Button>
              
              <Button type="submit" disabled={!form.formState.isDirty || isRunning}>
                Save Settings
              </Button>
            </div>
          </form>
        </Form>
        
        {cleanupResult && (
          <Alert className="mt-4">
            <AlertTitle>Cleanup Results</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Total notifications removed: {cleanupResult.totalRemoved}</p>
              <ul className="list-disc pl-4">
                <li>Removed by age: {cleanupResult.byAge}</li>
                <li>Removed by count limit: {cleanupResult.byCount}</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCleanupSettings;
