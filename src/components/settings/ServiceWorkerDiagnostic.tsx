
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, XCircle, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";
import { diagnoseServiceWorker, serviceWorkerManager } from "@/services/notifications/ServiceWorkerManager";

export interface ServiceWorkerDiagnosticInfo {
  supported: boolean;
  registered: boolean;
  controlling: boolean;
  issues: string[];
  recommendations: string[];
  details?: {
    scope?: string;
    scriptURL?: string;
    state?: string;
  };
}

const ServiceWorkerDiagnostic = () => {
  const [diagInfo, setDiagInfo] = useState<ServiceWorkerDiagnosticInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      // Run service worker diagnostics
      const diagResult = await diagnoseServiceWorker();
      
      // Get additional registration details
      const regDetails = await serviceWorkerManager.checkRegistration();
      
      setDiagInfo({
        ...diagResult,
        details: {
          scope: regDetails.scope,
          scriptURL: regDetails.scriptURL,
          state: regDetails.state
        }
      });
      
      toast.info("Service Worker Diagnostics Completed", {
        description: diagResult.issues.length > 0 
          ? "Found some issues that need attention" 
          : "No issues detected"
      });
    } catch (error) {
      console.error("Error running diagnostics:", error);
      toast.error("Diagnostics Failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Run diagnostics on component mount
    runDiagnostics();
  }, []);

  const attemptFix = async () => {
    setIsLoading(true);
    try {
      toast.info("Attempting to fix service worker...");
      
      // Unregister all existing service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      
      // Wait a moment
      await new Promise(r => setTimeout(r, 500));
      
      // Try registering with explicit path and scope
      await navigator.serviceWorker.register('./firebase-messaging-sw.js', { scope: '/' });
      
      toast.success("Service worker registration attempted!", {
        description: "Please reload the page to verify fix."
      });
      
      // Re-run diagnostics
      setTimeout(runDiagnostics, 1000);
    } catch (error) {
      console.error("Fix attempt failed:", error);
      toast.error("Fix Failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!diagInfo) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          <p className="text-center mt-4">Running diagnostics...</p>
        </CardContent>
      </Card>
    );
  }

  const { supported, registered, controlling, issues, recommendations } = diagInfo;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Service Worker Diagnostics
          {issues.length === 0 ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
            <div className={`rounded-full h-2 w-2 ${supported ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>Service Worker Support</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
            <div className={`rounded-full h-2 w-2 ${registered ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>Service Worker Registered</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
            <div className={`rounded-full h-2 w-2 ${controlling ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>Controlling Page</span>
          </div>
        </div>

        {/* Details */}
        {diagInfo.details && (
          <div className="text-sm border rounded p-3 bg-muted/30 space-y-1">
            <p><strong>Script:</strong> {diagInfo.details.scriptURL || 'N/A'}</p>
            <p><strong>Scope:</strong> {diagInfo.details.scope || 'N/A'}</p>
            <p><strong>State:</strong> {diagInfo.details.state || 'N/A'}</p>
          </div>
        )}

        {/* Issues and Recommendations */}
        {issues.length > 0 && (
          <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Issues Detected</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {recommendations.length > 0 && (
          <Alert className="border-blue-200 bg-blue-50 text-blue-900">
            <Info className="h-4 w-4" />
            <AlertTitle>Recommendations</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={runDiagnostics} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              "Run Diagnostics Again"
            )}
          </Button>
          
          {issues.length > 0 && (
            <Button onClick={attemptFix} disabled={isLoading}>
              {isLoading ? "Attempting Fix..." : "Attempt Automatic Fix"}
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          <p>
            Note: Service workers require HTTPS or localhost. If you're using a custom domain,
            ensure it has proper SSL certificates.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceWorkerDiagnostic;
