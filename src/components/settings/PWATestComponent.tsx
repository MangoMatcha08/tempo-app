import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, XIcon, InfoIcon, SmartphoneIcon, TabletIcon } from 'lucide-react';
import { testPWACompatibility, usePWADetection } from '@/utils/pwaUtils';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("PWATestComponent");

const PWATestComponent: React.FC = () => {
  const { isPWA, isIOS, isAndroid, isReady } = usePWADetection();
  const [testResults, setTestResults] = useState<ReturnType<typeof testPWACompatibility> | null>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);

  useEffect(() => {
    if (isReady) {
      debugLog(`PWA detection results - isPWA: ${isPWA}, isIOS: ${isIOS}, isAndroid: ${isAndroid}`);
    }
  }, [isReady, isPWA, isIOS, isAndroid]);

  const runCompatibilityTest = () => {
    setIsTestRunning(true);
    // Small delay to allow UI to update
    setTimeout(() => {
      const results = testPWACompatibility();
      setTestResults(results);
      setIsTestRunning(false);
      debugLog('Compatibility test results:', results);
    }, 500);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SmartphoneIcon className="h-5 w-5" />
          PWA Compatibility Test
        </CardTitle>
        <CardDescription>
          Test iOS and Android PWA compatibility for Tempo app features
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isReady ? (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">PWA Mode</p>
                  <p className="text-sm text-gray-500">
                    {isPWA ? 'Running as PWA' : 'Running in browser'}
                  </p>
                </div>
                <div>
                  {isPWA ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      PWA
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Browser
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Device Type</p>
                  <p className="text-sm text-gray-500">
                    {isIOS ? 'iOS Device' : isAndroid ? 'Android Device' : 'Desktop/Other'}
                  </p>
                </div>
                <div>
                  {isIOS ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      iOS
                    </Badge>
                  ) : isAndroid ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Android
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      Desktop
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {isIOS && !isPWA && (
              <Alert className="mt-4 bg-amber-50 border-amber-200">
                <InfoIcon className="h-4 w-4 text-amber-500" />
                <AlertTitle>Not Running as PWA</AlertTitle>
                <AlertDescription>
                  For best experience on iOS, please add this app to your home screen and launch it from there.
                </AlertDescription>
              </Alert>
            )}

            {testResults && (
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-lg">Feature Compatibility</h3>
                <div className="space-y-2">
                  {Object.entries(testResults.features).map(([feature, supported]) => (
                    <div key={feature} className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="text-sm capitalize">{feature.replace(/([A-Z])/g, ' $1')}</span>
                      {supported ? (
                        <CheckIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <XIcon className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-center items-center h-16">
            <p className="text-muted-foreground">Detecting environment...</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={runCompatibilityTest} 
          disabled={isTestRunning || !isReady}
          className="w-full"
        >
          {isTestRunning ? 'Running Tests...' : 'Run Compatibility Test'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PWATestComponent;
