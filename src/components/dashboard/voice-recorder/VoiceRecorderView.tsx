import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import useSpeechRecognition from "@/hooks/speech-recognition";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  isPwaMode, 
  isIOSDevice,
  forceAudioPermissionCheck,
  requestMicrophoneAccess,
  releaseMicrophoneStreams,
  ensureActiveAudioStream
} from "@/hooks/speech-recognition/utils";
import { createDebugLogger } from "@/utils/debugUtils";

const debugLog = createDebugLogger("VoiceRecorderView");

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
  const [isStartingRecognition, setIsStartingRecognition] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);
  const transcriptSentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>('');
  const startClickTimestampRef = useRef<number>(0);
  const isMobile = useIsMobile();
  
  const {
    transcript,
    interimTranscript,
    isListening,
    browserSupportsSpeechRecognition,
    startListening,
    stopListening,
    resetTranscript,
    error: recognitionError,
    isPWA: recognitionIsPWA,
  } = useSpeechRecognition();
  
  useEffect(() => {
    if (recognitionError) {
      setError(recognitionError);
    }
  }, [recognitionError]);
  
  useEffect(() => {
    const pwaStatus = isPwaMode();
    setIsPWA(pwaStatus);
    if (pwaStatus) {
      addDebugInfo("Running as PWA in standalone mode");
    }
    
    setTimeout(() => {
      debugLog("Performing initial audio permission check");
      forceAudioPermissionCheck().then(() => {
        debugLog("Initial audio permission check completed");
        ensureActiveAudioStream(null).then(audioAvailable => {
          debugLog(`Initial audio stream available: ${audioAvailable}`);
        });
      });
    }, 1000);
  }, []);
  
  useEffect(() => {
    if (transcript) {
      transcriptRef.current = transcript;
      addDebugInfo(`Transcript updated (${transcript.length} chars): "${transcript.substring(0, 20)}..."`);
    }
  }, [transcript]);
  
  const addDebugInfo = (info: string) => {
    console.log(`[VoiceRecorder] ${info}`);
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

  const toggleRecording = async () => {
    if (isRecording) {
      addDebugInfo("Stopping recording");
      setIsRecording(false);
      stopListening();
      
      const currentTranscript = transcriptRef.current || transcript;
      if (currentTranscript && currentTranscript.trim()) {
        addDebugInfo(`Sending transcript: "${currentTranscript.substring(0, 30)}${currentTranscript.length > 30 ? '...' : ''}"`);
        setTranscriptSent(true);
        
        if (transcriptSentTimeoutRef.current) {
          clearTimeout(transcriptSentTimeoutRef.current);
        }
        
        const sendDelay = isPWA ? 600 : (isMobile ? 300 : 100);
        transcriptSentTimeoutRef.current = setTimeout(() => {
          addDebugInfo(`Final transcript being sent: "${currentTranscript.substring(0, 30)}${currentTranscript.length > 30 ? '...' : ''}"`);
          onTranscriptComplete(currentTranscript);
          transcriptSentTimeoutRef.current = null;
        }, sendDelay);
      } else {
        addDebugInfo("No transcript to send - recording produced no text");
      }
      return;
    }
    
    startClickTimestampRef.current = Date.now();
    
    if (permissionState !== "granted") {
      addDebugInfo("Permission not granted, requesting access");
      const permissionGranted = await requestMicrophoneAccess();
      if (!permissionGranted) {
        addDebugInfo("Cannot start recording - microphone access not granted");
        return;
      }
      
      setPermissionState("granted");
    }
    
    const audioAvailable = await ensureActiveAudioStream(null);
    if (!audioAvailable) {
      addDebugInfo("Cannot access microphone stream, retrying...");
      
      setTimeout(async () => {
        const secondAttempt = await ensureActiveAudioStream(null);
        if (secondAttempt) {
          addDebugInfo("Microphone access succeeded on second attempt");
          startRecordingAfterPermissionCheck();
        } else {
          addDebugInfo("Failed to access microphone after multiple attempts");
          setError("Could not access microphone. Please check your browser settings.");
        }
      }, 500);
      
      return;
    }
    
    startRecordingAfterPermissionCheck();
  };

  const startRecordingAfterPermissionCheck = () => {
    addDebugInfo("Starting recording with permission granted");
    setIsRecording(true);
    setTranscriptSent(false);
    setIsStartingRecognition(true);
    setRetryCount(0);
    resetTranscript();
    transcriptRef.current = '';
    
    const timeSinceClick = Date.now() - startClickTimestampRef.current;
    addDebugInfo(`Time from click to start: ${timeSinceClick}ms`);
    
    if (isPWA) {
      addDebugInfo("PWA mode detected, adding delay before starting recognition");
      setTimeout(() => {
        startListening();
        addDebugInfo("Recognition started after delay");
        setIsStartingRecognition(false);
      }, 600);
    } else {
      try {
        startListening();
        addDebugInfo("Recognition started immediately");
        setIsStartingRecognition(false);
      } catch (error) {
        addDebugInfo(`Initial start failed, retrying with delay: ${error}`);
        setTimeout(() => {
          try {
            startListening();
            addDebugInfo("Recognition started after delay");
            setIsStartingRecognition(false);
          } catch (retryError) {
            addDebugInfo(`Retry also failed: ${retryError}`);
            setIsStartingRecognition(false);
            setIsRecording(false);
          }
        }, 500);
      }
    }
  };

  useEffect(() => {
    addDebugInfo(`Recognition isListening changed to: ${isListening}`);
    
    if (isStartingRecognition && isListening) {
      setIsStartingRecognition(false);
      setIsRecording(true);
      addDebugInfo("Recording state synced with active recognition");
    } else if (isRecording && !isListening && !isStartingRecognition) {
      addDebugInfo("Recognition stopped unexpectedly, syncing recording state");
      
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        addDebugInfo(`Automatic restart attempt ${retryCount + 1}`);
        
        setTimeout(() => {
          try {
            resetTranscript();
            startListening();
            addDebugInfo("Auto-restarted recognition after unexpected stop");
          } catch (error) {
            addDebugInfo(`Auto-restart failed: ${error}`);
            setIsRecording(false);
          }
        }, 500);
      } else {
        setIsRecording(false);
        addDebugInfo("Too many restart attempts, stopping recording");
      }
    }
  }, [isListening, isRecording, isStartingRecognition, retryCount, resetTranscript, startListening]);

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
    if (isRecording && interimTranscript) {
      addDebugInfo(`Interim transcript: "${interimTranscript.substring(0, 20)}..."`);
    }
  }, [interimTranscript, isRecording]);

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
                setIsStartingRecognition(false);
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
            onClick={toggleRecording}
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
          ) : isStartingRecognition ? (
            <div className="text-amber-500 font-semibold animate-pulse">
              Starting...
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
      
      {isStartingRecognition && (
        <Alert className="my-2 bg-amber-50 text-amber-800 border-amber-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Starting recognition...</AlertTitle>
          <AlertDescription>
            Please wait while we access your microphone. If recording doesn't start in a few seconds, try again.
          </AlertDescription>
        </Alert>
      )}
      
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
            <div>Log (newest first):</div>
            <ul className="ml-4 space-y-1">
              {debugInfo.slice().reverse().slice(0, 20).map((info, i) => (
                <li key={i}>{info}</li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </details>
      
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

export default VoiceRecorderView;
