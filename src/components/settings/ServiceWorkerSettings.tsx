
import React, { useState } from "react";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppMessage } from "@/types/notifications/serviceWorkerTypes";
import { SERVICE_WORKER_FEATURES } from "@/types/notifications/serviceWorkerTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CacheManager from "./CacheManager";
import ServiceWorkerDiagnostic from "./ServiceWorkerDiagnostic";
import { useFeatureFlags } from "@/contexts/FeatureFlagContext";

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
  
  const { flags } = useFeatureFlags();
  const [clearingCache, setClearingCache] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general");

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

  // Determine if advanced cache features should be shown
  const showAdvancedCache = flags.ADVANCED_CACHE;
  const showDiagnostics = true; // Always show diagnostics to help troubleshoot

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
      
      {!registered ? (
        <CardContent>
          <Button onClick={register} disabled={loading}>
            Install Service Worker
          </Button>
        </CardContent>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardContent>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              {showAdvancedCache && (
                <TabsTrigger value="cache">
                  <Database className="h-4 w-4 mr-2" />
                  Cache
                </TabsTrigger>
              )}
              <TabsTrigger value="diagnostics">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Diagnostics
              </TabsTrigger>
            </TabsList>
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <TabsContent value="general" className="mt-0">
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
                <Alert className="mt-4">
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
                      {flags.ADVANCED_CACHE && SERVICE_WORKER_FEATURES.ADVANCED_CACHING && (
                        <li className="text-sm">Intelligent Cache Management</li>
                      )}
                      {flags.AUTO_CLEANUP && SERVICE_WORKER_FEATURES.AUTO_CLEANUP && (
                        <li className="text-sm">Automatic Notification Cleanup</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            {showAdvancedCache && (
              <TabsContent value="cache" className="mt-0">
                <CacheManager />
              </TabsContent>
            )}
            
            {showDiagnostics && (
              <TabsContent value="diagnostics" className="mt-0">
                <ServiceWorkerDiagnostic />
              </TabsContent>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
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
                "Clear Service Worker"
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
          </CardFooter>
        </Tabs>
      )}
    </Card>
  );
};

export default ServiceWorkerSettings;
