import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import useSpeechRecognition from "@/hooks/speech-recognition";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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
  const [isPWA, setIsPWA] = useState(false);
  const isMobile = useIsMobile();
  
  const {
    transcript,
    interimTranscript,
    isListening,
    browserSupportsSpeechRecognition,
    startListening,
    stopListening,
    resetTranscript,
    error,
    isPWA: recognitionIsPWA,
  } = useSpeechRecognition();
  
  // Check if running as PWA
  useEffect(() => {
    // Check if app is running in standalone mode (PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      // @ts-ignore - Property 'standalone' exists on iOS Safari but not in TS types
      window.navigator.standalone === true;
    
    setIsPWA(isStandalone);
    if (isStandalone) {
      addDebugInfo("Running as PWA in standalone mode");
    }
  }, []);
  
  // Log debug info
  const addDebugInfo = (info: string) => {
    console.log(`[VoiceRecorder] ${info}`);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // Check microphone permission on component mount
  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        addDebugInfo("Checking microphone permission");
        if (navigator.permissions && navigator.permissions.query) {
          const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionState(permissionResult.state);
          addDebugInfo(`Initial microphone permission: ${permissionResult.state}`);
          
          // Listen for permission changes
          permissionResult.onchange = () => {
            setPermissionState(permissionResult.state);
            addDebugInfo(`Microphone permission changed to: ${permissionResult.state}`);
            
            // If permission was just granted and we're recording, restart recording
            if (permissionResult.state === 'granted' && isRecording) {
              addDebugInfo("Permission granted during recording - restarting");
              resetTranscript();
              // Add delay to ensure permission is registered
              setTimeout(() => {
                startListening();
                addDebugInfo("Restarting recording after permission granted");
              }, 500);
            }
          };
        } else {
          // For browsers that don't support the permissions API
          setPermissionState("unknown");
          addDebugInfo("Permissions API not supported, status unknown");
        }
      } catch (err) {
        console.error("Error checking microphone permission:", err);
        setPermissionState("unknown");
        addDebugInfo(`Error checking permission: ${err}`);
      }
    };
    
    checkMicPermission();
  }, []);

  // Request microphone access explicitly
  const requestMicrophoneAccess = async () => {
    addDebugInfo("Requesting microphone access explicitly");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionState("granted");
      addDebugInfo("Microphone access granted");
      
      // In PWA mode, keep the stream active to prevent it from being garbage collected
      if (isPWA) {
        // Store the stream in a global variable to prevent garbage collection
        (window as any).microphoneStream = stream;
        addDebugInfo("Stored microphone stream to prevent garbage collection in PWA");
      }
      
      return true;
    } catch (err) {
      console.error("Error requesting microphone access:", err);
      setPermissionState("denied");
      addDebugInfo(`Microphone access denied: ${err}`);
      return false;
    }
  };

  // Enhanced recording toggle with PWA-specific handling
  const toggleRecording = async () => {
    // If already recording, stop recording
    if (isRecording) {
      addDebugInfo("Stopping recording");
      setIsRecording(false);
      stopListening();
      
      // Only send transcript if we have content
      if (transcript.trim()) {
        addDebugInfo(`Sending transcript: "${transcript.substring(0, 30)}${transcript.length > 30 ? '...' : ''}"`);
        setTranscriptSent(true);
        
        // Add slight delay to ensure the final transcript is captured
        setTimeout(() => {
          addDebugInfo(`Final transcript being sent: "${transcript.substring(0, 30)}${transcript.length > 30 ? '...' : ''}"`);
          onTranscriptComplete(transcript);
        }, isPWA ? 300 : 100);
      } else {
        addDebugInfo("No transcript to send - recording produced no text");
      }
      return;
    }
    
    // Starting a new recording - handle permissions first
    if (permissionState !== "granted") {
      addDebugInfo("Permission not granted, requesting access");
      const permissionGranted = await requestMicrophoneAccess();
      if (!permissionGranted) {
        addDebugInfo("Cannot start recording - microphone access not granted");
        return;
      }
    }
    
    // Permission is granted, start recording
    addDebugInfo("Starting recording with permission granted");
    setIsRecording(true);
    setTranscriptSent(false);
    resetTranscript();
    
    // In PWA mode, add extra delay to ensure recognition initializes properly
    if (isPWA) {
      addDebugInfo("PWA mode detected, adding delay before starting recognition");
      setTimeout(() => {
        startListening();
        addDebugInfo("Recognition started after delay");
      }, 500);
    } else {
      startListening();
      addDebugInfo("Recognition started immediately");
    }
  };

  // Auto-stop recording after 30 seconds if still active
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let countdownTimer: NodeJS.Timeout | null = null;
    
    if (isRecording) {
      setCountdown(30);
      
      timer = setTimeout(() => {
        if (isRecording) {
          addDebugInfo("Auto-stopping after 30 seconds");
          toggleRecording();
        }
      }, 30000);
      
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
  }, [isRecording]);

  // Add effect to monitor transcript updates
  useEffect(() => {
    if (isRecording && transcript) {
      addDebugInfo(`Transcript updated (${transcript.length} chars): "${transcript.substring(0, 20)}..."`);
    }
  }, [transcript, isRecording]);

  // Add effect to monitor interim transcript updates
  useEffect(() => {
    if (isRecording && interimTranscript) {
      addDebugInfo(`Interim transcript: "${interimTranscript.substring(0, 20)}..."`);
    }
  }, [interimTranscript, isRecording]);

  // Add effect to monitor isProcessing changes
  useEffect(() => {
    addDebugInfo(`Processing state changed to: ${isProcessing ? "processing" : "not processing"}`);
  }, [isProcessing]);

  // Add effect to monitor transcriptSent changes
  useEffect(() => {
    addDebugInfo(`Transcript sent state changed to: ${transcriptSent ? "sent" : "not sent"}`);
  }, [transcriptSent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopListening();
        addDebugInfo("Cleanup: stopped listening");
      }
      // Release microphone stream on component unmount
      if ((window as any).microphoneStream) {
        const tracks = (window as any).microphoneStream.getTracks();
        tracks.forEach((track: MediaStreamTrack) => track.stop());
        (window as any).microphoneStream = null;
        console.log("Microphone stream released on unmount");
      }
    };
  }, [isRecording, stopListening]);

  // If browser doesn't support speech recognition
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
      </div>
    );
  }

  // Special UI for when permission is denied or prompt is needed (especially on mobile)
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
      
      {/* Show debug info in development mode OR ALWAYS in PWA mode (for troubleshooting) */}
      <details className="mt-4 text-xs text-gray-500 border rounded p-2" open={isPWA}>
        <summary>Debug Info {isPWA && "(PWA Mode)"}</summary>
        <ScrollArea className="h-[100px] mt-2">
          <div className="space-y-1">
            <div>Recognition active: {isListening ? "Yes" : "No"}</div>
            <div>Recording state: {isRecording ? "Recording" : "Stopped"}</div>
            <div>Is processing: {isProcessing ? "Yes" : "No"}</div>
            <div>Transcript sent: {transcriptSent ? "Yes" : "No"}</div>
            <div>Permission state: {permissionState}</div>
            <div>Is mobile device: {isMobile ? "Yes" : "No"}</div>
            <div>Is PWA: {isPWA ? "Yes" : "No"}</div>
            <div>Log:</div>
            <ul className="ml-4 space-y-1">
              {debugInfo.map((info, i) => (
                <li key={i}>{info}</li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </details>
      
      <div className="mt-3 text-sm text-center text-gray-500">
        <p>Speak clearly and naturally.</p>
        <p>Recording will automatically stop after 30 seconds.</p>
      </div>
    </div>
  );
};

export default VoiceRecorderView;
