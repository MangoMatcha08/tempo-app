
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import useSpeechRecognition from "@/hooks/speech-recognition";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderViewProps {
  onTranscriptComplete: (transcript: string) => void;
  isProcessing: boolean;
}

const VoiceRecorderView = ({ onTranscriptComplete, isProcessing }: VoiceRecorderViewProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [transcriptSent, setTranscriptSent] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const { toast } = useToast();
  const initialRequestMade = useRef(false);
  
  const {
    transcript,
    interimTranscript,
    isListening,
    browserSupportsSpeechRecognition,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();
  
  // Log debug info
  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // Request microphone permission on component mount
  useEffect(() => {
    if (initialRequestMade.current) return;
    
    const requestMicrophonePermission = async () => {
      try {
        // Check if permission API is supported
        if ('permissions' in navigator) {
          const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionState(micPermission.state);
          
          // Listen for permission changes
          micPermission.addEventListener('change', () => {
            setPermissionState(micPermission.state);
            addDebugInfo(`Permission state changed to: ${micPermission.state}`);
          });
          
          // If not granted yet, don't automatically request on mobile
          if (micPermission.state !== 'granted' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            addDebugInfo('Mobile device detected, waiting for user interaction before requesting permission');
            return;
          }
        }
        
        // Request permission directly on desktop
        if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop()); // Stop tracks immediately
          setPermissionRequested(true);
          addDebugInfo('Microphone permission granted');
        }
      } catch (error) {
        console.error('Error requesting microphone permission:', error);
        addDebugInfo(`Error requesting permission: ${error}`);
      }
      
      initialRequestMade.current = true;
    };
    
    requestMicrophonePermission();
  }, []);

  // Handle requesting microphone permission explicitly
  const requestPermission = async () => {
    try {
      addDebugInfo('Explicitly requesting microphone permission');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop tracks immediately
      setPermissionRequested(true);
      
      if ('permissions' in navigator) {
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionState(micPermission.state);
      }
      
      addDebugInfo('Microphone permission granted');
      toast({
        title: "Microphone access granted",
        description: "You can now record voice reminders",
        duration: 3000
      });
      return true;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      addDebugInfo(`Error requesting permission: ${error}`);
      toast({
        title: "Microphone access denied",
        description: "Please enable microphone access in your browser settings to use voice recording",
        variant: "destructive",
        duration: 5000
      });
      return false;
    }
  };

  // Handle recording start/stop
  const toggleRecording = async () => {
    // First check/request permission if on mobile or permission not granted
    if ((!permissionRequested || permissionState !== 'granted') && !isRecording) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    
    if (isRecording) {
      setIsRecording(false);
      stopListening();
      
      // Only send transcript if we have content
      if (transcript.trim()) {
        addDebugInfo(`Sending transcript: "${transcript.substring(0, 30)}${transcript.length > 30 ? '...' : ''}"`);
        setTranscriptSent(true);
        onTranscriptComplete(transcript);
      } else {
        addDebugInfo("No transcript to send");
      }
    } else {
      setIsRecording(true);
      setTranscriptSent(false);
      resetTranscript();
      startListening();
      addDebugInfo("Started recording");
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopListening();
        addDebugInfo("Cleanup: stopped listening");
      }
    };
  }, [isRecording, stopListening]);

  // If browser doesn't support speech recognition
  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="text-center p-6">
        <p className="text-red-500 mb-3">
          Your browser does not support speech recognition.
        </p>
        <p>
          Please try Chrome, Edge, or Safari on desktop for the best experience.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        {/* If permission state is prompted or denied on mobile, show a request permission button */}
        {permissionState !== 'granted' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && (
          <div className="mb-4">
            <Button 
              onClick={requestPermission}
              variant="outline"
              className="w-full"
            >
              Enable Microphone Access
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              You need to grant microphone access to use voice recording
            </p>
          </div>
        )}
        
        <div className="flex justify-center mb-4">
          <Button
            onClick={toggleRecording}
            disabled={isProcessing || transcriptSent || (permissionState === 'denied')}
            size="lg"
            className={cn(
              "rounded-full h-16 w-16 p-0",
              isRecording 
                ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                : "bg-blue-500 hover:bg-blue-600"
            )}
          >
            <Mic className="h-6 w-6" />
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
              Press to start recording
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
      
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs text-gray-500 border rounded p-2">
          <summary>Debug Info</summary>
          <ScrollArea className="h-[100px] mt-2">
            <div className="space-y-1">
              <div>Recognition active: {isListening ? "Yes" : "No"}</div>
              <div>Recording state: {isRecording ? "Recording" : "Stopped"}</div>
              <div>Is processing: {isProcessing ? "Yes" : "No"}</div>
              <div>Transcript sent: {transcriptSent ? "Yes" : "No"}</div>
              <div>Permission state: {permissionState || "unknown"}</div>
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
        <p>Recording will automatically stop after 30 seconds.</p>
      </div>
    </div>
  );
};

export default VoiceRecorderView;
