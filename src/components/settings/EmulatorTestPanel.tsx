
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle, Server } from "lucide-react";
import { useEmulatorVerification, getEmulatorUrls } from "@/utils/emulatorUtils";
import { testEmulatorConnection } from "@/lib/firebase/functions";

/**
 * Component for Firebase Emulator testing and status
 * Only shown in development mode
 */
const EmulatorTestPanel = () => {
  const { verifyConnection, isUsingEmulator, isDevelopment } = useEmulatorVerification();
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  
  // Only show in development mode
  if (!isDevelopment) return null;
  
  const emulatorUrls = getEmulatorUrls();
  
  const handleVerifyConnection = async () => {
    setIsVerifying(true);
    setLastResult(null);
    
    try {
      const result = await testEmulatorConnection();
      setLastResult({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      setLastResult({
        success: false,
        message: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/30 mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center">
            <Server className="h-4 w-4 mr-2" /> 
            Firebase Emulator Status
          </CardTitle>
          <Badge variant={isUsingEmulator ? "default" : "outline"} className={isUsingEmulator ? "bg-green-500" : ""}>
            {isUsingEmulator ? "Emulator Connected" : "Production Mode"}  
          </Badge>
        </div>
        <CardDescription>
          For local development and testing of Firebase Functions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isUsingEmulator && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Not connected to Firebase Emulators</AlertTitle>
            <AlertDescription>
              You are currently in development mode but not using Firebase emulators.
              Add <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">VITE_USE_EMULATORS=true</code> to your .env file.
            </AlertDescription>
          </Alert>
        )}
        
        {isUsingEmulator && (
          <Alert variant="default" className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Using Firebase Emulators</AlertTitle>
            <AlertDescription>
              <p className="mb-2">Emulator URLs:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Functions: {emulatorUrls.functions}</li>
                <li>Firestore: {emulatorUrls.firestore}</li>
                <li>Auth: {emulatorUrls.auth}</li>
                <li>UI Dashboard: {emulatorUrls.ui}</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {lastResult && (
          <Alert variant={lastResult.success ? "default" : "destructive"} className={
            lastResult.success ? "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800" : ""
          }>
            {lastResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertTitle>{lastResult.success ? "Connection Successful" : "Connection Failed"}</AlertTitle>
            <AlertDescription>
              {lastResult.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleVerifyConnection}
          disabled={isVerifying}
          variant="outline"
          className="w-full"
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying Connection...
            </>
          ) : (
            "Verify Emulator Connection"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EmulatorTestPanel;
