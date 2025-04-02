
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import useSpeechRecognition from "@/hooks/speech-recognition";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VoiceRecorderViewProps {
  onTranscriptComplete: (transcript: string) => void;
  isProcessing: boolean;
}

const VoiceRecorderView = ({ onTranscriptComplete, isProcessing }: VoiceRecorderViewProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [transcriptSent, setTranscriptSent] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
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

  // Handle recording start/stop
  const toggleRecording = () => {
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
