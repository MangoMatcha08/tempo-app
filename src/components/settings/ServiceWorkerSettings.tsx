
import React, { useState } from "react";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppMessage } from "@/types/notifications/serviceWorkerTypes";
import { SERVICE_WORKER_FEATURES } from "@/types/notifications/serviceWorkerTypes";

const ServiceWorkerSettings = () => {
  const { 
    supported, 
    registered, 
    implementation, 
    loading, 
    error, 
    toggleImplementation, 
    register, 
    checkStatus, 
    sendMessage 
  } = useServiceWorker();
  
  const [clearingCache, setClearingCache] = useState(false);

  // Toggle between legacy and enhanced implementation
  const handleToggleImplementation = async () => {
    await toggleImplementation(implementation !== 'enhanced');
  };

  // Clear all service worker caches
  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const message: AppMessage = { type: 'CLEAR_NOTIFICATIONS' };
      await sendMessage(message);
      
      // Re-register service worker
      await register();
      
      // Wait a bit and check status
      setTimeout(checkStatus, 1000);
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setClearingCache(false);
    }
  };

  if (!supported) {
    return (
      <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-300">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Service Workers Not Supported</AlertTitle>
        <AlertDescription>
          Your browser doesn't support service workers. Offline features and push notifications will not work.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Service Worker Settings
          <Badge variant={registered ? "secondary" : "destructive"} className={registered ? "bg-green-500 text-white" : ""}>
            {registered ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure how the app works offline and handles background tasks
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {registered && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enhanced Mode</p>
                <p className="text-sm text-muted-foreground">
                  Use enhanced implementation with better offline support
                </p>
              </div>
              <Switch
                checked={implementation === 'enhanced'}
                onCheckedChange={handleToggleImplementation}
                disabled={loading}
              />
            </div>
            
            {implementation === 'enhanced' && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Enhanced Features</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    {SERVICE_WORKER_FEATURES.BACKGROUND_SYNC && (
                      <li className="text-sm">Background Sync</li>
                    )}
                    {SERVICE_WORKER_FEATURES.OFFLINE_SUPPORT && (
                      <li className="text-sm">Enhanced Offline Support</li>
                    )}
                    {SERVICE_WORKER_FEATURES.NOTIFICATION_GROUPING && (
                      <li className="text-sm">Notification Grouping</li>
                    )}
                    {SERVICE_WORKER_FEATURES.PUSH_NOTIFICATION_ACTIONS && (
                      <li className="text-sm">Advanced Notification Actions</li>
                    )}
                    {SERVICE_WORKER_FEATURES.PERIODIC_SYNC && (
                      <li className="text-sm">Periodic Background Sync</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {!registered ? (
          <Button onClick={register} disabled={loading}>
            Install Service Worker
          </Button>
        ) : (
          <>
            <Button 
              variant="outline" 
              onClick={handleClearCache}
              disabled={clearingCache || loading}
            >
              {clearingCache ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                "Clear Cache"
              )}
            </Button>
            
            <Button 
              variant="default" 
              onClick={checkStatus}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Status"
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default ServiceWorkerSettings;
