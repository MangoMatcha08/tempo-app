
import { useState, useEffect, useRef } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import useSpeechRecognition from "@/hooks/speech-recognition";
import { isPwaMode, requestMicrophoneAccess } from "@/utils/pwaUtils";
import { createDebugLogger } from "@/utils/debugUtils";
import VoiceRecordingButton from "./VoiceRecordingButton";
import RecordingStatusText from "./RecordingStatusText";
import TranscriptDisplay from "./TranscriptDisplay";
import DebugInfoPanel from "./DebugInfoPanel";
import PermissionAlert from "./PermissionAlert";

// Set up debug logger
const debugLog = createDebugLogger("VoiceRecorder");

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
    const pwaStatus = isPwaMode();
    setIsPWA(pwaStatus);
    if (pwaStatus) {
      addDebugInfo("Running as PWA in standalone mode");
    }
  }, []);
  
  // Log debug info
  const addDebugInfo = (info: string) => {
    debugLog(info);
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
      setPermissionState(permissionGranted ? "granted" : "denied");
      
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
      <PermissionAlert 
        permissionState={permissionState} 
        onRequestAccess={toggleRecording} 
        error={error}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <VoiceRecordingButton 
          isRecording={isRecording}
          isProcessing={isProcessing}
          transcriptSent={transcriptSent}
          onClick={toggleRecording}
        />
        
        <RecordingStatusText 
          isRecording={isRecording}
          countdown={countdown}
          transcriptSent={transcriptSent}
          permissionState={permissionState}
        />
      </div>
      
      <TranscriptDisplay 
        transcript={transcript} 
        interimTranscript={interimTranscript} 
      />
      
      <DebugInfoPanel 
        isPWA={isPWA}
        isListening={isListening}
        isRecording={isRecording}
        isProcessing={isProcessing}
        transcriptSent={transcriptSent}
        permissionState={permissionState}
        isMobile={isMobile}
        debugInfo={debugInfo}
      />
      
      <div className="mt-3 text-sm text-center text-gray-500">
        <p>Speak clearly and naturally.</p>
        <p>Recording will automatically stop after 30 seconds.</p>
      </div>
    </div>
  );
};

export default VoiceRecorderView;
