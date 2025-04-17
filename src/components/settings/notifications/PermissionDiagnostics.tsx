
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePermissionTracker } from '@/hooks/notifications/usePermissionTracker';
import { browserDetection } from '@/utils/browserDetection';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Trash2, Bug, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { PermissionRequestHistoryItem } from '@/services/notifications/permissionTracker';

interface PermissionDiagnosticsProps {
  expanded?: boolean;
}

const PermissionDiagnostics = ({ expanded = false }: PermissionDiagnosticsProps) => {
  const { 
    browserPermission, 
    permissionGranted, 
    isSupported, 
    requestCount, 
    getHistory, 
    clearHistory, 
    debugMode, 
    toggleDebugMode, 
    getStatus 
  } = usePermissionTracker();
  
  const [history, setHistory] = useState<PermissionRequestHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(expanded);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  
  // Get permission status details
  const status = getStatus();
  
  // Format badge for permission state
  const getBadgeForPermission = (state: string) => {
    switch (state) {
      case 'granted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Granted</Badge>;
      case 'denied':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Denied</Badge>;
      case 'default':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Not Asked</Badge>;
      case 'unsupported':
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Unsupported</Badge>;
      default:
        return <Badge variant="outline">{state}</Badge>;
    }
  };
  
  // Load history data
  const loadHistory = () => {
    const historyData = getHistory();
    setHistory(historyData);
    setShowHistory(true);
  };
  
  // Handle clear history
  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
    toast.success("Permission history cleared");
  };
  
  // Handle toggle debug mode
  const handleToggleDebugMode = () => {
    const isEnabled = toggleDebugMode();
    toast.info(isEnabled ? "Debug mode enabled" : "Debug mode disabled");
  };
  
  // Handle refresh status
  const handleRefreshStatus = () => {
    setRefreshKey(prev => prev + 1);
    toast.info("Permission status refreshed");
  };
  
  // Format time difference
  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(timestamp, { addSuffix: true });
    } catch (error) {
      return "unknown time";
    }
  };
  
  return (
    <Card key={refreshKey} className="shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Notification Permission Diagnostics</CardTitle>
            <CardDescription>Detailed information about notification permission state</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefreshStatus} title="Refresh status">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current permission status */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Current Status</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between rounded-md border p-2">
              <span className="text-muted-foreground">Browser Permission:</span> 
              {getBadgeForPermission(browserPermission)}
            </div>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span className="text-muted-foreground">Effectively Granted:</span>
              {permissionGranted ? 
                <span className="flex items-center text-green-600"><CheckCircle2 className="h-4 w-4 mr-1" /> Yes</span> :
                <span className="flex items-center text-red-600"><XCircle className="h-4 w-4 mr-1" /> No</span>
              }
            </div>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span className="text-muted-foreground">Supported:</span>
              {isSupported ? 
                <span className="flex items-center text-green-600"><CheckCircle2 className="h-4 w-4 mr-1" /> Yes</span> :
                <span className="flex items-center text-red-600"><XCircle className="h-4 w-4 mr-1" /> No</span>
              }
            </div>
            <div className="flex items-center justify-between rounded-md border p-2">
              <span className="text-muted-foreground">Request Count:</span>
              <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {requestCount}</span>
            </div>
          </div>
        </div>
        
        {/* System Info */}
        <Accordion type="single" collapsible className="border rounded-md">
          <AccordionItem value="system-info">
            <AccordionTrigger className="px-4">System Information</AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-1">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center border-b py-2">
                  <span className="font-medium">Browser:</span>
                  <span>{browserDetection.getBrowser()}</span>
                </div>
                <div className="flex justify-between items-center border-b py-2">
                  <span className="font-medium">Platform:</span>
                  <span>{browserDetection.getPlatform()}</span>
                </div>
                {browserDetection.isIOS() && (
                  <div className="flex justify-between items-center border-b py-2">
                    <span className="font-medium">iOS Version:</span>
                    <span>{browserDetection.getIOSVersion()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-b py-2">
                  <span className="font-medium">PWA Mode:</span>
                  <span>{browserDetection.isIOSPWA() ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Last State Sync:</span>
                  <span>{status.isStored ? formatTime(status.storedState.timestamp || 0) : 'Never'}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {/* Sync warning if needed */}
        {status.syncRequired && (
          <Alert variant="default" className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Permission State Mismatch</AlertTitle>
            <AlertDescription>
              The stored permission state doesn't match the browser's current state.
              Refreshing this component will automatically sync the states.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Debug mode toggle */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <h4 className="text-sm font-medium">Debug Mode</h4>
            <p className="text-xs text-muted-foreground">
              Enable detailed console logging for permission operations
            </p>
          </div>
          <Switch
            checked={debugMode}
            onCheckedChange={handleToggleDebugMode}
            aria-label="Toggle debug mode"
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex-col items-start gap-2">
        {/* History controls */}
        <div className="flex justify-between w-full">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadHistory}
            disabled={showHistory}
          >
            View Request History
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearHistory}
            disabled={requestCount === 0}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Clear History
          </Button>
        </div>
        
        {/* Request history */}
        {showHistory && history.length > 0 && (
          <ScrollArea className="h-64 w-full border rounded-md mt-2">
            <div className="p-4 space-y-3">
              {history.map((item, index) => (
                <div key={index} className="text-sm border-b pb-2 last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">
                      {item.result ? 
                        <span className="text-green-600 flex items-center">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Granted
                        </span> : 
                        <span className="text-red-600 flex items-center">
                          <XCircle className="h-3 w-3 mr-1" /> Denied
                        </span>
                      }
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                  
                  <div className="mt-1 text-xs">
                    {item.reason && <div><span className="font-medium">Reason:</span> {item.reason}</div>}
                    {item.browserState && <div><span className="font-medium">Browser State:</span> {item.browserState}</div>}
                    {item.token !== undefined && <div><span className="font-medium">Token Received:</span> {item.token ? 'Yes' : 'No'}</div>}
                    {item.iosVersion && <div><span className="font-medium">iOS:</span> {item.iosVersion} {item.isPWA ? '(PWA)' : ''}</div>}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {showHistory && history.length === 0 && (
          <div className="w-full p-4 text-center text-sm text-muted-foreground border rounded-md">
            No permission request history found.
          </div>
        )}
        
        {/* Debug mode note */}
        {debugMode && (
          <div className="w-full mt-2">
            <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
              <Bug className="h-4 w-4" />
              <AlertTitle>Debug Mode Active</AlertTitle>
              <AlertDescription className="text-xs">
                Detailed permission logs are being written to the console.
                This may impact performance and should be disabled in production.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default PermissionDiagnostics;
