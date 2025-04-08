
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const ServiceWorkerSettings = () => {
  const { 
    supported, 
    registered, 
    implementation, 
    loading, 
    error, 
    register, 
    toggleImplementation,
    sendMessage,
    checkStatus
  } = useServiceWorker();
  
  const [testingSyncStatus, setTestingSyncStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleToggleImplementation = async () => {
    const useEnhanced = implementation !== 'enhanced';
    const success = await toggleImplementation(useEnhanced);
    
    if (success) {
      toast({
        title: "Service Worker Updated",
        description: `Now using ${useEnhanced ? 'enhanced' : 'legacy'} implementation.`,
        duration: 3000
      });
    } else {
      toast({
        title: "Failed to Update",
        description: "Could not change service worker implementation.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const testSyncFeature = async () => {
    setTestingSyncStatus('testing');
    
    try {
      const success = await sendMessage({
        type: 'SYNC_REMINDERS',
        payload: {
          testData: true,
          timestamp: Date.now()
        }
      });
      
      setTestingSyncStatus(success ? 'success' : 'error');
      
      toast({
        title: success ? "Sync Initiated" : "Sync Failed",
        description: success 
          ? "Background sync has been scheduled." 
          : "Failed to schedule background sync.",
        variant: success ? "default" : "destructive",
        duration: 3000
      });
      
      // Reset status after 3 seconds
      setTimeout(() => setTestingSyncStatus('idle'), 3000);
    } catch (error) {
      setTestingSyncStatus('error');
      
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
        duration: 3000
      });
      
      // Reset status after 3 seconds
      setTimeout(() => setTestingSyncStatus('idle'), 3000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Service Worker Settings
          <Badge 
            variant={implementation === 'enhanced' ? "default" : "outline"}
          >
            {implementation === 'enhanced' ? 'Enhanced' : 'Legacy'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure and test the service worker implementation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!supported && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Not Supported</AlertTitle>
            <AlertDescription>
              Service workers are not supported in this browser.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center justify-between">
          <Label htmlFor="sw-implementation" className="flex flex-col space-y-1">
            <span>Enhanced Implementation</span>
            <span className="font-normal text-sm text-muted-foreground">
              Enable experimental service worker features
            </span>
          </Label>
          <Switch
            id="sw-implementation"
            checked={implementation === 'enhanced'}
            onCheckedChange={handleToggleImplementation}
            disabled={loading || !supported || !registered}
          />
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Status</h3>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Service Worker Support:</div>
            <div className="flex items-center">
              {supported ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 mr-1" />
              )}
              {supported ? 'Supported' : 'Not Supported'}
            </div>
            
            <div className="text-muted-foreground">Registration Status:</div>
            <div className="flex items-center">
              {registered ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 mr-1" />
              )}
              {registered ? 'Registered' : 'Not Registered'}
            </div>
            
            <div className="text-muted-foreground">Current Implementation:</div>
            <div>{implementation === 'none' ? 'None' : implementation === 'enhanced' ? 'Enhanced' : 'Legacy'}</div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Status
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={register}
            disabled={loading || !supported || registered}
          >
            Register Service Worker
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={testSyncFeature}
            disabled={loading || !supported || !registered || testingSyncStatus === 'testing'}
          >
            {testingSyncStatus === 'testing' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : testingSyncStatus === 'success' ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Sync Tested
              </>
            ) : testingSyncStatus === 'error' ? (
              <>
                <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                Test Failed
              </>
            ) : (
              "Test Background Sync"
            )}
          </Button>
        </div>
        
        {implementation === 'enhanced' && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Enhanced Mode Active</AlertTitle>
            <AlertDescription>
              You're using the experimental service worker implementation. If you experience issues, switch back to the legacy implementation.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceWorkerSettings;
