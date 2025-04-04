
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/speech-recognition";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useVoiceRecorderStateMachine } from "@/hooks/speech-recognition/useVoiceRecorderStateMachine";
import { processVoiceInput } from "@/services/nlp";
import { useTrackedTimeouts } from "@/hooks/use-tracked-timeouts";

interface VoiceRecorderStateProps {
  onTranscriptProcessed: (result: any) => void;
}

/**
 * Voice recorder component using state machine for robust state management
 */
const VoiceRecorderState = ({ onTranscriptProcessed }: VoiceRecorderStateProps) => {
  const { state, actions } = useVoiceRecorderStateMachine();
  const [countdown, setCountdown] = useState(0);
  const { createTimeout, clearAllTimeouts } = useTrackedTimeouts();
  
  const {
    transcript,
    interimTranscript,
    isListening,
    browserSupportsSpeechRecognition,
    startListening,
    stopListening,
    resetTranscript,
    error
  } = useSpeechRecognition();
  
  // Handle permission checking
  useEffect(() => {
    // When we enter requesting-permission state
    if (state.status === 'requesting-permission') {
      // Check for existing permission
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'microphone' as PermissionName })
          .then(result => {
            if (result.state === 'granted') {
              actions.permissionGranted();
              startListening();
            } else if (result.state === 'denied') {
              actions.permissionDenied();
            } else {
              // Try to request permission
              navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                  actions.permissionGranted();
                  startListening();
                })
                .catch(() => {
                  actions.permissionDenied();
                });
            }
          });
      } else {
        // Older browsers - just try to start and handle errors
        try {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
              actions.permissionGranted();
              startListening();
            })
            .catch(() => {
              actions.permissionDenied();
            });
        } catch (err) {
          actions.permissionDenied();
        }
      }
    }
  }, [state.status, actions, startListening]);
  
  // Handle recording state
  useEffect(() => {
    if (state.status === 'recording') {
      resetTranscript();
      // Set timer for max recording duration
      const maxRecordingTime = 30;
      setCountdown(maxRecordingTime);
      
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            // Auto-stop after max duration
            if (isListening) {
              stopListening();
              if (transcript) {
                actions.stopRecording(transcript);
              } else {
                actions.recognitionError("No speech detected");
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearInterval(countdownInterval);
      };
    }
  }, [state.status, isListening, stopListening, transcript, actions, resetTranscript]);
  
  // Handle processing state
  useEffect(() => {
    if (state.status === 'processing') {
      // Process the transcript
      try {
        const result = processVoiceInput(state.transcript);
        createTimeout(() => {
          actions.processingComplete(result);
          onTranscriptProcessed(result);
        }, 1000); // Simulate processing time
      } catch (err) {
        actions.processingError("Failed to process voice input");
      }
    }
  }, [state.status, actions, createTimeout, onTranscriptProcessed]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
      clearAllTimeouts();
    };
  }, [isListening, stopListening, clearAllTimeouts]);
  
  if (!browserSupportsSpeechRecognition) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Browser Not Supported</AlertTitle>
        <AlertDescription>
          Your browser doesn't support speech recognition.
        </AlertDescription>
      </Alert>
    );
  }
  
  const handleToggleRecording = () => {
    if (state.status === 'recording') {
      stopListening();
      if (transcript) {
        actions.stopRecording(transcript);
      } else {
        actions.reset(); // No transcript, just reset
      }
    } else if (state.status === 'idle') {
      actions.startRecording();
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <Button
            onClick={handleToggleRecording}
            disabled={state.status !== 'idle' && state.status !== 'recording'}
            size="lg"
            className={cn(
              "rounded-full h-16 w-16 p-0",
              state.status === 'recording' 
                ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                : "bg-blue-500 hover:bg-blue-600"
            )}
          >
            {state.status === 'recording' ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>
        </div>
        <div className="text-sm">
          {state.status === 'idle' && "Press to start recording"}
          {state.status === 'requesting-permission' && "Requesting microphone access..."}
          {state.status === 'recording' && <div className="text-red-500">Recording... {countdown}s</div>}
          {state.status === 'processing' && "Processing your recording..."}
          {state.status === 'confirming' && "Recording processed! Confirm your reminder."}
          {state.status === 'error' && <div className="text-red-500">{state.message}</div>}
        </div>
      </div>
      
      <div className="border rounded-md p-3 bg-slate-50">
        <h3 className="font-medium mb-2 text-sm">Your voice input:</h3>
        <ScrollArea className="h-[100px] overflow-y-auto">
          <div className="whitespace-pre-wrap overflow-hidden">
            {state.status === 'recording' ? (
              <p>{transcript || interimTranscript || "Speak now..."}</p>
            ) : state.status === 'processing' || state.status === 'confirming' ? (
              <p>{state.status === 'processing' ? state.transcript : (state.result.reminder.description || "")}</p>
            ) : (
              <p className="text-muted-foreground italic">
                {error || "Speak after pressing the record button..."}
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {state.status === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      
      {state.status === 'confirming' && (
        <Button onClick={actions.reset} className="w-full">
          Reset
        </Button>
      )}
    </div>
  );
};

export default VoiceRecorderState;
