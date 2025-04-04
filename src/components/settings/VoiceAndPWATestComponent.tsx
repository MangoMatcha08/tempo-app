
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import useSpeechRecognition from '@/hooks/speech-recognition';
import { isPwaMode, isIOSDevice, isMobileDevice } from '@/hooks/speech-recognition/utils';

const VoiceAndPWATestComponent = () => {
  const [isPWA, setIsPWA] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  const {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    error
  } = useSpeechRecognition();
  
  useEffect(() => {
    // Check environment on mount
    setIsPWA(isPwaMode());
    setIsIOS(isIOSDevice());
    setIsMobile(isMobileDevice());
  }, []);
  
  const handleStartRecording = async () => {
    resetTranscript();
    await startListening();
  };
  
  const handleStopRecording = () => {
    stopListening();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Recognition & PWA Test</CardTitle>
        <CardDescription>
          Test speech recognition in your current environment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p>Running as PWA: <strong>{isPWA ? 'Yes' : 'No'}</strong></p>
              <p>iOS Device: <strong>{isIOS ? 'Yes' : 'No'}</strong></p>
              <p>Mobile Device: <strong>{isMobile ? 'Yes' : 'No'}</strong></p>
            </div>
            <div>
              <p>Speech Recognition: <strong>{browserSupportsSpeechRecognition ? 'Supported' : 'Not Supported'}</strong></p>
              <p>Recording: <strong>{isListening ? 'Active' : 'Inactive'}</strong></p>
            </div>
          </div>
          
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="border rounded p-3 min-h-[100px] bg-muted/30">
            {transcript || interimTranscript || "Transcript will appear here..."}
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={isListening ? handleStopRecording : handleStartRecording}
              variant={isListening ? "destructive" : "default"}
            >
              {isListening ? "Stop Recording" : "Start Recording"}
            </Button>
            
            <Button
              onClick={() => {
                setIsPWA(isPwaMode());
                setIsIOS(isIOSDevice());
                setIsMobile(isMobileDevice());
              }}
              variant="outline"
            >
              Refresh Detection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceAndPWATestComponent;
