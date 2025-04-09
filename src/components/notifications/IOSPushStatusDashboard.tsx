
import React, { useEffect, useReducer, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Smartphone, RefreshCw, Info, AlertTriangle, Wifi } from "lucide-react";
import { browserDetection } from '@/utils/browserDetection';
import { iosPwaDetection } from '@/utils/iosPwaDetection';
import { useNotificationPermission } from '@/hooks/notifications/useNotificationPermission';
import { useServiceWorker } from '@/hooks/useServiceWorker';

// Status dashboard state type
interface StatusDashboardState {
  lastUpdated: number;
  isPolling: boolean;
  pollCount: number;
  pollInterval: number;
  error: string | null;
  manualRefresh: boolean;
}

// Actions for the reducer
type StatusDashboardAction = 
  | { type: 'POLL_START' }
  | { type: 'POLL_SUCCESS' }
  | { type: 'POLL_FAILURE'; payload: string }
  | { type: 'MANUAL_REFRESH' }
  | { type: 'RESET_POLL_INTERVAL' }
  | { type: 'INCREASE_POLL_INTERVAL' };

// Initial state
const initialState: StatusDashboardState = {
  lastUpdated: 0,
  isPolling: false,
  pollCount: 0,
  pollInterval: 5000, // Start with 5 seconds
  error: null,
  manualRefresh: false
};

// Reducer function for status dashboard state
function statusDashboardReducer(state: StatusDashboardState, action: StatusDashboardAction): StatusDashboardState {
  switch (action.type) {
    case 'POLL_START':
      return {
        ...state,
        isPolling: true,
        manualRefresh: false
      };
    case 'POLL_SUCCESS':
      return {
        ...state,
        lastUpdated: Date.now(),
        isPolling: false,
        pollCount: state.pollCount + 1,
        error: null
      };
    case 'POLL_FAILURE':
      return {
        ...state,
        isPolling: false,
        error: action.payload
      };
    case 'MANUAL_REFRESH':
      return {
        ...state,
        manualRefresh: true
      };
    case 'RESET_POLL_INTERVAL':
      return {
        ...state,
        pollInterval: 5000 // Reset to initial interval
      };
    case 'INCREASE_POLL_INTERVAL':
      // Exponential backoff - double the interval up to 2 minutes max
      return {
        ...state,
        pollInterval: Math.min(state.pollInterval * 2, 120000)
      };
    default:
      return state;
  }
}

const IOSPushStatusDashboard: React.FC = () => {
  const [state, dispatch] = useReducer(statusDashboardReducer, initialState);
  const { permissionGranted, isSupported } = useNotificationPermission();
  const { 
    registered: serviceWorkerRegistered,
    implementation: serviceWorkerImplementation
  } = useServiceWorker();
  
  // Check if this is an iOS device
  const isIOS = browserDetection.isIOS();
  const isPWA = iosPwaDetection.isRunningAsPwa();
  const iosVersion = browserDetection.getIOSVersion();
  const supportsPush = browserDetection.supportsIOSWebPush();
  
  // Poll for status updates with exponential backoff
  const pollStatus = useCallback(async () => {
    if (state.isPolling) return;
    
    try {
      dispatch({ type: 'POLL_START' });
      
      // Wait to simulate actual polling to a server
      // In a real implementation, you might check with the server
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // If we've reached a good state (everything working),
      // reset the poll interval for future polls
      if (permissionGranted && serviceWorkerRegistered && isPWA) {
        dispatch({ type: 'RESET_POLL_INTERVAL' });
      } else {
        // Otherwise increase the interval for exponential backoff
        dispatch({ type: 'INCREASE_POLL_INTERVAL' });
      }
      
      dispatch({ type: 'POLL_SUCCESS' });
    } catch (error) {
      dispatch({ 
        type: 'POLL_FAILURE', 
        payload: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    }
  }, [state.isPolling, permissionGranted, serviceWorkerRegistered, isPWA]);
  
  // Effect for polling at the specified interval
  useEffect(() => {
    // Only poll if this is iOS and meets minimum version requirements
    if (!isIOS || !supportsPush) return;
    
    const timer = setTimeout(pollStatus, state.pollInterval);
    
    return () => {
      clearTimeout(timer);
    };
  }, [isIOS, supportsPush, state.pollInterval, state.lastUpdated, pollStatus]);
  
  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    dispatch({ type: 'MANUAL_REFRESH' });
    pollStatus();
  }, [pollStatus]);
  
  // If not on iOS 16.4+, don't show the dashboard
  if (!isIOS || !supportsPush) {
    return null;
  }
  
  // Format last updated time
  const lastUpdatedText = state.lastUpdated 
    ? new Date(state.lastUpdated).toLocaleTimeString() 
    : 'Never';

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
        {/* Status indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PWA Status */}
          <div className="flex items-center gap-2 p-3 border rounded-md">
            <div className="bg-slate-100 p-2 rounded-full">
              <Smartphone className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">PWA Installation</p>
              <p className="text-xs text-muted-foreground">
                {isPWA ? 'Installed' : 'Not installed'}
              </p>
            </div>
            {isPWA ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-orange-500" />
            )}
          </div>
          
          {/* Permission Status */}
          <div className="flex items-center gap-2 p-3 border rounded-md">
            <div className="bg-slate-100 p-2 rounded-full">
              <Info className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Push Permission</p>
              <p className="text-xs text-muted-foreground">
                {permissionGranted ? 'Granted' : 'Not granted'}
              </p>
            </div>
            {permissionGranted ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-orange-500" />
            )}
          </div>
          
          {/* Service Worker Status */}
          <div className="flex items-center gap-2 p-3 border rounded-md">
            <div className="bg-slate-100 p-2 rounded-full">
              <Wifi className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Service Worker</p>
              <p className="text-xs text-muted-foreground">
                {serviceWorkerRegistered 
                  ? `Active (${serviceWorkerImplementation})` 
                  : 'Not registered'}
              </p>
            </div>
            {serviceWorkerRegistered ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-orange-500" />
            )}
          </div>
        </div>
        
        {/* Environment Info */}
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
        </div>
        
        {/* Error display */}
        {state.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="pt-1">
        <button 
          className="text-xs flex items-center text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleRefresh}
          disabled={state.isPolling}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${state.isPolling ? 'animate-spin' : ''}`} />
          {state.isPolling ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </CardFooter>
    </Card>
  );
};

export default IOSPushStatusDashboard;
