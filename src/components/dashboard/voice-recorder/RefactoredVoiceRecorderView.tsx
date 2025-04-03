import { useState, useEffect, useRef } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import useSpeechRecognition from "@/hooks/speech-recognition";
import { isPwaMode, requestMicrophoneAccess, releaseMicrophoneStreams } from "@/utils/pwaUtils";
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

const RefactoredVoiceRecorderView = ({ onTranscriptComplete, isProcessing }: VoiceRecorderViewProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [transcriptSent, setTranscriptSent] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [permissionState, setPermissionState] = useState<PermissionState | "unknown">("unknown");
  const [isPWA, setIsPWA] = useState(false);
  const [isStartingRecognition, setIsStartingRecognition] = useState(false);
  const transcriptSentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
    isMobile: recognitionIsMobile
  } = useSpeechRecognition();
  
  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
    
    if (transcript && transcript !== "" && isRecording) {
      addDebugInfo(`Transcript updated: "${transcript.substring(0, 15)}..."`);
    }
  }, [transcript, isRecording]);
  
  useEffect(() => {
    addDebugInfo(`Recognition isListening changed to: ${isListening}`);
    
    if (isStartingRecognition && isListening) {
      setIsStartingRecognition(false);
      setIsRecording(true);
      addDebugInfo("Recording state synced with active recognition");
    } else if (isRecording && !isListening && !isStartingRecognition) {
      addDebugInfo("Recognition stopped unexpectedly, syncing recording state");
      setIsRecording(false);
    }
  }, [isListening, isRecording, isStartingRecognition]);
  
  useEffect(() => {
    const pwaStatus = isPwaMode();
    setIsPWA(pwaStatus);
    if (pwaStatus) {
      addDebugInfo("Running as PWA in standalone mode");
    }
  }, []);
  
  const addDebugInfo = (info: string) => {
    debugLog(info);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        addDebugInfo("Checking microphone permission");
        if (navigator.permissions && navigator.permissions.query) {
          const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionState(permissionResult.state);
          addDebugInfo(`Initial microphone permission: ${permissionResult.state}`);
          
          permissionResult.onchange = () => {
            setPermissionState(permissionResult.state);
            addDebugInfo(`Microphone permission changed to: ${permissionResult.state}`);
            
            if (permissionResult.state === 'granted' && isRecording) {
              addDebugInfo("Permission granted during recording - restarting");
              resetTranscript();
              setTimeout(() => {
                startListening();
                addDebugInfo("Restarting recording after permission granted");
              }, 500);
            }
          };
        } else {
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

  const sendTranscript = (text: string) => {
    if (!text || !text.trim()) {
      addDebugInfo("Empty transcript, not sending");
      return;
    }
    
    addDebugInfo(`Attempting to send transcript: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
    setTranscriptSent(true);
    
    if (transcriptSentTimeoutRef.current) {
      clearTimeout(transcriptSentTimeoutRef.current);
    }
    
    const sendDelay = (isMobile || isPWA) ? 800 : 300;
    addDebugInfo(`Using send delay of ${sendDelay}ms`);
    
    transcriptSentTimeoutRef.current = setTimeout(() => {
      const finalText = transcriptRef.current || text;
      addDebugInfo(`Sending final transcript: "${finalText.substring(0, 30)}${finalText.length > 30 ? '...' : ''}"`);
      onTranscriptComplete(finalText);
      transcriptSentTimeoutRef.current = null;
    }, sendDelay);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      addDebugInfo("Stopping recording");
      setIsRecording(false);
      stopListening();
      
      if (transcript && transcript.trim()) {
        sendTranscript(transcript);
      } else {
        addDebugInfo("No transcript to send - recording produced no text");
      }
      return;
    }
    
    if (permissionState !== "granted") {
      addDebugInfo("Permission not granted, requesting access");
      const permissionGranted = await requestMicrophoneAccess();
      setPermissionState(permissionGranted ? "granted" : "denied");
      
      if (!permissionGranted) {
        addDebugInfo("Cannot start recording - microphone access not granted");
        return;
      }
    }
    
    addDebugInfo("Requesting to start recording - waiting for recognition to activate");
    setIsStartingRecognition(true);
    setTranscriptSent(false);
    resetTranscript();
    
    if (isPWA || isMobile) {
      addDebugInfo(`${isPWA ? 'PWA' : 'Mobile'} mode detected, adding delay before starting recognition`);
      
      if (isPWA && isMobile) {
        addDebugInfo("PWA on mobile detected - using forced microphone restart flow");
        await requestMicrophoneAccess();
        setTimeout(() => {
          try {
            startListening();
            addDebugInfo("Recognition started after forced restart");
          } catch (error) {
            addDebugInfo(`Failed to start recognition: ${error}`);
            setIsStartingRecognition(false);
          }
        }, 1000);
      } else {
        setTimeout(() => {
          try {
            startListening();
            addDebugInfo("Recognition started after delay");
          } catch (error) {
            addDebugInfo(`Failed to start recognition: ${error}`);
            setIsStartingRecognition(false);
          }
        }, (isPWA && isMobile) ? 1000 : 500);
      }
    } else {
      try {
        startListening();
        addDebugInfo("Recognition started immediately");
      } catch (error) {
        addDebugInfo(`Failed to start recognition: ${error}`);
        setIsStartingRecognition(false);
      }
    }
  };

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

  useEffect(() => {
    addDebugInfo(`Processing state changed to: ${isProcessing ? "processing" : "not processing"}`);
  }, [isProcessing]);

  useEffect(() => {
    addDebugInfo(`Transcript sent state changed to: ${transcriptSent ? "sent" : "not sent"}`);
  }, [transcriptSent]);

  useEffect(() => {
    if (isStartingRecognition) {
      const recoveryTimeout = setTimeout(() => {
        if (isStartingRecognition && !isListening) {
          addDebugInfo("Recognition failed to start after timeout, attempting recovery");
          
          setIsStartingRecognition(false);
          stopListening();
          resetTranscript();
          
          releaseMicrophoneStreams();
          
          setTimeout(async () => {
            await requestMicrophoneAccess();
            addDebugInfo("Attempting recognition restart after recovery");
            setIsStartingRecognition(true);
            
            setTimeout(() => {
              try {
                startListening();
                addDebugInfo("Recognition restarted after recovery");
              } catch (error) {
                addDebugInfo(`Recovery restart failed: ${error}`);
                setIsStartingRecognition(false);
              }
            }, 1000);
          }, 1500);
        }
      }, 5000);
      
      return () => clearTimeout(recoveryTimeout);
    }
  }, [isStartingRecognition, isListening, resetTranscript, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (isRecording) {
        stopListening();
        addDebugInfo("Cleanup: stopped listening");
      }
      
      if (transcriptSentTimeoutRef.current) {
        clearTimeout(transcriptSentTimeoutRef.current);
      }
      
      releaseMicrophoneStreams();
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
      </div>
    );
  }

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
      
      {isStartingRecognition && !isListening && (
        <Alert variant="default" className="my-2 bg-amber-50 text-amber-800 border-amber-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Starting recognition...</AlertTitle>
          <AlertDescription>
            Please wait while we access your microphone. If recording doesn't start in a few seconds, try tapping the button again.
          </AlertDescription>
        </Alert>
      )}
      
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
        {isMobile && (
          <p className="mt-1 font-medium text-blue-500">
            For best results on mobile, speak for at least 3-5 seconds.
          </p>
        )}
      </div>
    </div>
  );
};

export default RefactoredVoiceRecorderView;
