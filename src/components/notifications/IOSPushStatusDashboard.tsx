import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Smartphone, RefreshCw, Info, AlertTriangle, Wifi, FileWarning, HelpCircle, ExternalLink } from "lucide-react";
import { browserDetection } from '@/utils/browserDetection';
import { iosPwaDetection } from '@/utils/iosPwaDetection';
import { useNotificationPermission } from '@/hooks/notifications/useNotificationPermission';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useStatusPolling } from '@/hooks/useStatusPolling';
import { recordTelemetryEvent, getTelemetryStats, flushTelemetryBatches } from '@/utils/iosPushTelemetry';
import { createMetadata } from '@/utils/telemetryUtils';

import StatusIndicators from './IOSPushStatusIndicators';
import TelemetryDisplay from './IOSPushTelemetryDisplay';

const IOSPushStatusDashboard: React.FC = () => {
  const { permissionGranted, isSupported } = useNotificationPermission();
  const { 
    registered: serviceWorkerRegistered,
    implementation: serviceWorkerImplementation,
    checkStatus: checkServiceWorkerStatus
  } = useServiceWorker();
  
  const [telemetryStats, setTelemetryStats] = useState<ReturnType<typeof getTelemetryStats> | null>(null);
  const [showTelemetry, setShowTelemetry] = useState(false);
  
  const isIOS = browserDetection.isIOS();
  const isPWA = iosPwaDetection.isRunningAsPwa();
  const iosVersion = browserDetection.getIOSVersion();
  const supportsPush = browserDetection.supportsIOSWebPush();

  const overallStatus = useMemo(() => {
    if (permissionGranted && serviceWorkerRegistered && isPWA) {
      return "ready";
    } else if (!isPWA) {
      return "needs-pwa";
    } else if (!permissionGranted) {
      return "needs-permission";
    } else if (!serviceWorkerRegistered) {
      return "needs-sw";
    } else {
      return "unknown";
    }
  }, [permissionGranted, serviceWorkerRegistered, isPWA]);
  
  const pollStatusFn = useCallback(async () => {
    try {
      recordTelemetryEvent({
        eventType: 'status-check',
        isPWA: isPWA,
        iosVersion: iosVersion?.toString(),
        timestamp: Date.now(),
        result: 'success',
        metadata: createMetadata('Status check started', {
          overallStatus,
          permissionGranted,
          serviceWorkerRegistered,
          implementation: serviceWorkerImplementation
        })
      });

      if ('serviceWorker' in navigator) {
        await checkServiceWorkerStatus();
      }

      if (permissionGranted && serviceWorkerRegistered && isPWA) {
        recordTelemetryEvent({
          eventType: 'status-check',
          isPWA: isPWA,
          iosVersion: iosVersion?.toString(),
          timestamp: Date.now(),
          result: 'success'
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error polling status:", error);
      recordTelemetryEvent({
        eventType: 'error',
        isPWA: isPWA,
        iosVersion: iosVersion?.toString(),
        timestamp: Date.now(),
        result: 'error',
        metadata: createMetadata('Status check error', {
          error: error instanceof Error ? error.message : String(error)
        })
      });
      return false;
    }
  }, [permissionGranted, serviceWorkerRegistered, isPWA, iosVersion, checkServiceWorkerStatus, serviceWorkerImplementation]);
  
  const { state, manualRefresh } = useStatusPolling(
    pollStatusFn,
    isIOS && supportsPush,
    [permissionGranted, serviceWorkerRegistered, isPWA]
  );
  
  useEffect(() => {
    let timeoutId: number;
    if (showTelemetry) {
      timeoutId = window.setTimeout(() => {
        setTelemetryStats(getTelemetryStats());
      }, 100);
    }
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [showTelemetry, state.lastUpdated]);

  useEffect(() => {
    return () => {
      flushTelemetryBatches();
    };
  }, []);
  
  if (!isIOS || !supportsPush) {
    return null;
  }
  
  const lastUpdatedText = state.lastUpdated 
    ? new Date(state.lastUpdated).toLocaleTimeString() 
    : 'Never';

  const getGuidanceText = () => {
    switch (overallStatus) {
      case "needs-pwa":
        return "This app needs to be installed as a PWA (Add to Home Screen) to enable push notifications on iOS.";
      case "needs-permission":
        return "Push notification permission needs to be granted for this app.";
      case "needs-sw":
        return "Service worker registration is required for push notifications.";
      case "ready":
        return "All systems operational. Push notifications are ready to be received.";
      default:
        return "Check the status of each component to troubleshoot push notifications.";
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Smartphone className="mr-2 h-5 w-5" />
            iOS Push Status
          </CardTitle>
          <Badge 
            variant="default"
            className={
              permissionGranted && serviceWorkerRegistered && isPWA 
                ? "bg-green-500 hover:bg-green-600" 
                : "bg-amber-500 hover:bg-amber-600"
            }
          >
            {permissionGranted && serviceWorkerRegistered && isPWA 
              ? "Ready" 
              : "Setup Required"}
          </Badge>
        </div>
        <CardDescription>
          Status of iOS push notification components
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 pb-4">
        <Alert className={overallStatus === "ready" ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
          <div className="flex items-start">
            {overallStatus === "ready" 
              ? <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" /> 
              : <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />}
            <AlertDescription className="text-sm">
              {getGuidanceText()}
            </AlertDescription>
          </div>
        </Alert>

        <StatusIndicators 
          isPWA={isPWA} 
          permissionGranted={permissionGranted} 
          serviceWorkerRegistered={serviceWorkerRegistered}
          serviceWorkerImplementation={serviceWorkerImplementation}
        />
        
        {overallStatus !== "ready" && (
          <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
            <div className="flex items-start mb-2">
              <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <h4 className="text-sm font-medium text-blue-800">Next Steps</h4>
            </div>
            <ul className="list-disc pl-9 text-xs space-y-1 text-blue-700">
              {!isPWA && (
                <li>
                  Install this app to your Home Screen through the Safari share menu
                </li>
              )}
              {isPWA && !permissionGranted && (
                <li>
                  Grant push notification permission when prompted
                </li>
              )}
              {isPWA && permissionGranted && !serviceWorkerRegistered && (
                <li>
                  Reload the app to register the service worker
                </li>
              )}
            </ul>
          </div>
        )}
        
        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Device:</span>
            <span>iOS {iosVersion}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">PWA Mode:</span>
            <span>{isPWA ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Push Support:</span>
            <span>{supportsPush ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated:</span>
            <span>{lastUpdatedText}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Update Interval:</span>
            <span>{(state.pollInterval / 1000).toFixed(0)}s</span>
          </div>
        </div>
        
        <div className="pt-2">
          <button 
            onClick={() => setShowTelemetry(!showTelemetry)}
            className="text-xs flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileWarning className="h-3 w-3 mr-1" />
            {showTelemetry ? 'Hide Telemetry' : 'Show Telemetry'}
          </button>
        </div>
        
        {showTelemetry && telemetryStats && (
          <TelemetryDisplay telemetryStats={telemetryStats} />
        )}
        
        {state.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="pt-1 flex items-center justify-between">
        <button 
          className="text-xs flex items-center text-muted-foreground hover:text-foreground transition-colors"
          onClick={manualRefresh}
          disabled={state.isPolling}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${state.isPolling ? 'animate-spin' : ''}`} />
          {state.isPolling ? 'Refreshing...' : 'Refresh Status'}
        </button>
        
        <span className="text-xs text-muted-foreground">
          Poll: {state.pollCount}
        </span>
      </CardFooter>
    </Card>
  );
};

export default IOSPushStatusDashboard;
