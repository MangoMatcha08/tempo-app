import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckIcon, XIcon, InfoIcon, SmartphoneIcon, MicIcon, BellIcon } from 'lucide-react';
import { testPWACompatibility, usePWADetection, iOSPWAUtils } from '@/utils/pwaUtils';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("VoiceAndPWATestComponent");

const VoiceAndPWATestComponent: React.FC = () => {
  const { isPWA, isIOS, isAndroid, isReady } = usePWADetection();
  const { permissionStatus: notificationPermission, sendTestNotification } = useNotificationPermission();
  const [testResults, setTestResults] = useState<ReturnType<typeof testPWACompatibility> | null>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('pwa');
  const [voiceTestResult, setVoiceTestResult] = useState<{status: 'idle' | 'testing' | 'success' | 'error', message: string}>({
    status: 'idle',
    message: ''
  });

  useEffect(() => {
    if (isReady) {
      debugLog(`PWA detection results - isPWA: ${isPWA}, isIOS: ${isIOS}, isAndroid: ${isAndroid}`);
      
      // Apply iOS PWA fixes if needed
      if (isIOS && isPWA) {
        iOSPWAUtils.fixAudioContext();
      }
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

  const testVoiceRecognition = async () => {
    setVoiceTestResult({
      status: 'testing',
      message: 'Testing voice recognition...'
    });

    try {
      // Check if SpeechRecognition is available
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error('Speech recognition not supported in this browser');
      }
      
      // Create a new recognition instance
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Set up event handlers
      let testTimeout: NodeJS.Timeout;
      
      // Promise to handle the recognition result
      const recognitionPromise = new Promise<void>((resolve, reject) => {
        recognition.onresult = () => {
          clearTimeout(testTimeout);
          resolve();
        };
        
        recognition.onerror = (event) => {
          clearTimeout(testTimeout);
          reject(new Error(`Recognition error: ${event.error}`));
        };
        
        recognition.onend = () => {
          clearTimeout(testTimeout);
          resolve();
        };
        
        // Set a timeout in case recognition doesn't end properly
        testTimeout = setTimeout(() => {
          recognition.abort();
          resolve();
        }, 5000);
      });
      
      // Start recognition
      recognition.start();
      
      // Wait for recognition to complete or error
      await recognitionPromise;
      
      setVoiceTestResult({
        status: 'success',
        message: 'Voice recognition is working correctly'
      });
      
    } catch (error) {
      console.error('Voice recognition test error:', error);
      setVoiceTestResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error testing voice recognition'
      });
    }
  };

  const testNotifications = async () => {
    try {
      const result = await sendTestNotification();
      if (result) {
        debugLog('Test notification sent successfully');
      } else {
        debugLog('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SmartphoneIcon className="h-5 w-5" />
          iOS PWA Compatibility Test
        </CardTitle>
        <CardDescription>
          Test iOS PWA compatibility for voice, notifications, and other features
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isReady ? (
          <>
            <div className="space-y-4 mb-4">
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
              <Alert className="mb-4 bg-amber-50 border-amber-200">
                <InfoIcon className="h-4 w-4 text-amber-500" />
                <AlertTitle>Not Running as PWA</AlertTitle>
                <AlertDescription>
                  For best experience on iOS, please add this app to your home screen and launch it from there.
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="pwa">Features</TabsTrigger>
                <TabsTrigger value="voice">Voice</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pwa" className="space-y-4">
                {testResults ? (
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
                ) : (
                  <div className="flex justify-center items-center h-32">
                    <Button 
                      onClick={runCompatibilityTest} 
                      disabled={isTestRunning}
                    >
                      {isTestRunning ? 'Running Tests...' : 'Run Feature Tests'}
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="voice" className="space-y-4">
                <div className="flex flex-col items-center justify-center h-32 space-y-4">
                  <Button 
                    onClick={testVoiceRecognition} 
                    disabled={voiceTestResult.status === 'testing'}
                    className="flex items-center gap-2"
                  >
                    <MicIcon className="h-4 w-4" />
                    {voiceTestResult.status === 'testing' ? 'Testing...' : 'Test Voice Recognition'}
                  </Button>
                  
                  {voiceTestResult.status !== 'idle' && (
                    <div className={`text-sm ${
                      voiceTestResult.status === 'success' ? 'text-green-600' : 
                      voiceTestResult.status === 'error' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {voiceTestResult.message}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="notifications" className="space-y-4">
                <div className="flex flex-col items-center justify-center h-32 space-y-4">
                  <div className="text-center mb-2">
                    <p className="font-medium">Notification Permission</p>
                    <p className="text-sm text-gray-500">
                      {notificationPermission === 'granted' ? 'Granted' : 
                       notificationPermission === 'denied' ? 'Blocked' : 
                       notificationPermission === 'default' ? 'Not set' : 
                       notificationPermission === 'unsupported' ? 'Not supported' : 'Checking...'}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={testNotifications} 
                    disabled={notificationPermission !== 'granted'}
                    className="flex items-center gap-2"
                  >
                    <BellIcon className="h-4 w-4" />
                    Send Test Notification
                  </Button>
                  
                  {notificationPermission !== 'granted' && (
                    <p className="text-sm text-amber-600">
                      You need to grant notification permission first
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex justify-center items-center h-16">
            <p className="text-muted-foreground">Detecting environment...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceAndPWATestComponent;
