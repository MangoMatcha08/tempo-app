
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/speech-recognition";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getEnvironmentDescription } from "@/hooks/speech-recognition/environmentDetection";

interface VoiceRecorderViewProps {
  onTranscriptComplete: (transcript: string) => void;
  isProcessing: boolean;
}

const VoiceRecorderView = ({ onTranscriptComplete, isProcessing }: VoiceRecorderViewProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [transcriptSent, setTranscriptSent] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [permissionState, setPermissionState] = useState<PermissionState | "unknown">("unknown");
  const isMobile = useIsMobile();
  const environment = getEnvironmentDescription();
  
  const {
    transcript,
    interimTranscript,
    isListening,
    browserSupportsSpeechRecognition,
    startListening,
    stopListening,
    resetTranscript,
    error,
    isPwa
  } = useSpeechRecognition();
  
  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionState(permissionResult.state);
          
          permissionResult.onchange = () => {
            setPermissionState(permissionResult.state);
            addDebugInfo(`Microphone permission changed to: ${permissionResult.state}`);
            
            if (permissionResult.state === 'granted' && isRecording) {
              resetTranscript();
              startListening();
              addDebugInfo("Restarting recording after permission granted");
            }
          };
        } else {
          setPermissionState("unknown");
        }
      } catch (err) {
        console.error("Error checking microphone permission:", err);
        setPermissionState("unknown");
      }
    };
    
    checkMicPermission();
    
    if (isPwa) {
      addDebugInfo("Running in PWA mode - using adapted recognition strategy");
    }
  }, []);

  const requestMicrophoneAccess = async () => {
    addDebugInfo("Requesting microphone access explicitly");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionState("granted");
      addDebugInfo("Microphone access granted");
      return true;
    } catch (err) {
      console.error("Error requesting microphone access:", err);
      setPermissionState("denied");
      addDebugInfo("Microphone access denied");
      return false;
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      stopListening();
      
      if (transcript.trim()) {
        addDebugInfo(`Sending transcript: "${transcript.substring(0, 30)}${transcript.length > 30 ? '...' : ''}"`);
        setTranscriptSent(true);
        onTranscriptComplete(transcript);
      } else {
        addDebugInfo("No transcript to send");
      }
      return;
    }
    
    if (permissionState !== "granted") {
      const permissionGranted = await requestMicrophoneAccess();
      if (!permissionGranted) {
        addDebugInfo("Cannot start recording - microphone access not granted");
        return;
      }
    }
    
    setIsRecording(true);
    setTranscriptSent(false);
    resetTranscript();
    
    if (isPwa) {
      addDebugInfo("PWA mode: adding pre-start delay");
      setTimeout(() => {
        startListening();
        addDebugInfo("Started recording in PWA mode after delay");
      }, 100);
    } else {
      startListening();
      addDebugInfo("Started recording with permission granted");
    }
  };

  const handleForceRetry = () => {
    addDebugInfo("Manual retry initiated");
    
    if (isRecording) {
      stopListening();
      
      setTimeout(() => {
        resetTranscript();
        startListening();
        addDebugInfo("Manually restarted recording");
      }, 500);
    } else {
      setIsRecording(true);
      setTranscriptSent(false);
      resetTranscript();
      startListening();
      addDebugInfo("Started new recording after manual retry");
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let countdownTimer: NodeJS.Timeout | null = null;
    
    if (isRecording) {
      const maxRecordingTime = isPwa ? 25 : 30;
      setCountdown(maxRecordingTime);
      
      timer = setTimeout(() => {
        if (isRecording) {
          addDebugInfo(`Auto-stopping after ${maxRecordingTime} seconds`);
          toggleRecording();
        }
      }, maxRecordingTime * 1000);
      
      countdownTimer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownTimer) clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [isRecording, isPwa]);

  useEffect(() => {
    return () => {
      if (isRecording) {
        stopListening();
        addDebugInfo("Cleanup: stopped listening");
      }
    };
  }, [isRecording, stopListening]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="text-center p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Browser Not Supported</AlertTitle>
          <AlertDescription>
            Your browser does not support speech recognition.
            Please try Chrome, Edge, or Safari on desktop for the best experience.
          </AlertDescription>
        </Alert>
        
        <p className="mt-4 text-sm text-gray-500">
          You can still create reminders using the text input option.
        </p>
      </div>
    );
  }

  if (permissionState === "denied" || (permissionState === "prompt" && isMobile)) {
    return (
      <div className="space-y-4">
        <Alert variant={permissionState === "denied" ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Microphone Access Required</AlertTitle>
          <AlertDescription>
            {permissionState === "denied" 
              ? "Microphone access was denied. Please enable microphone access in your browser settings and try again."
              : "To record voice reminders, you need to grant microphone access."}
          </AlertDescription>
        </Alert>
        
        <div className="text-center">
          <Button 
            onClick={requestMicrophoneAccess}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Enable Microphone Access
          </Button>
        </div>
        
        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <Button
            onClick={toggleRecording}
            disabled={isProcessing || transcriptSent}
            size="lg"
            className={cn(
              "rounded-full h-16 w-16 p-0",
              isRecording 
                ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                : "bg-blue-500 hover:bg-blue-600"
            )}
          >
            {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>
        </div>
        <div className="text-sm">
          {isRecording ? (
            <div className="text-red-500 font-semibold">
              Recording... {countdown}s
            </div>
          ) : transcriptSent ? (
            <div className="text-green-500 font-semibold">
              Processing your voice note...
            </div>
          ) : (
            <div>
              {permissionState === "granted" 
                ? "Press to start recording" 
                : "Press to request microphone access and start recording"}
            </div>
          )}
        </div>
        
        {isPwa && isRecording && (
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleForceRetry}
              className="text-xs flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Restart Recording
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              If no text appears, try restarting the recording
            </p>
          </div>
        )}
      </div>
      
      <div className="border rounded-md p-3 bg-slate-50">
        <h3 className="font-medium mb-2 text-sm">Your voice input:</h3>
        <ScrollArea className="h-[100px] overflow-y-auto">
          <div className="whitespace-pre-wrap overflow-hidden">
            {transcript ? (
              <p>{transcript}</p>
            ) : (
              <p className="text-muted-foreground italic">
                {interimTranscript || "Speak after pressing the record button..."}
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {error && (
        <Alert 
          variant="default" 
          className="text-sm border-yellow-500 bg-yellow-50"
        >
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-700">Recognition Error</AlertTitle>
          <AlertDescription className="text-yellow-600">
            {error}
            {isPwa && (
              <p className="text-xs mt-1">
                PWA mode may have limited speech recognition capabilities.
                {isRecording && " Try using the restart button if needed."}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs text-gray-500 border rounded p-2">
          <summary>Debug Info</summary>
          <ScrollArea className="h-[100px] mt-2">
            <div className="space-y-1">
              <div>Recognition active: {isListening ? "Yes" : "No"}</div>
              <div>Recording state: {isRecording ? "Recording" : "Stopped"}</div>
              <div>Is processing: {isProcessing ? "Yes" : "No"}</div>
              <div>Transcript sent: {transcriptSent ? "Yes" : "No"}</div>
              <div>Permission state: {permissionState}</div>
              <div>Is mobile device: {isMobile ? "Yes" : "No"}</div>
              <div>Is PWA mode: {isPwa ? "Yes" : "No"}</div>
              <div>Environment: {environment.description}</div>
              <div>Platform: {environment.platform}</div>
              <div>Browser: {environment.browser}</div>
              <div>Continuous mode: {environment.capabilities.continuous ? "Enabled" : "Disabled"}</div>
              <div>Recognition reliability: {environment.capabilities.reliable ? "High" : "Limited"}</div>
              <div>Log:</div>
              <ul className="ml-4 space-y-1">
                {debugInfo.map((info, i) => (
                  <li key={i}>{info}</li>
                ))}
              </ul>
            </div>
          </ScrollArea>
        </details>
      )}
      
      <div className="mt-3 text-sm text-center text-gray-500">
        <p>Speak clearly and naturally.</p>
        <p>Recording will automatically stop after {isPwa ? 25 : 30} seconds.</p>
        {isPwa && (
          <p className="text-xs mt-1 text-amber-600">
            Running in PWA mode: If recognition doesn't work, try closing and reopening the app.
          </p>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorderView;
