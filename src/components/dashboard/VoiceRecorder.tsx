
import React, { useState, useEffect, useRef } from 'react';
import useSpeechRecognition from '../../hooks/speech-recognition';
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceRecorderProps {
  onTranscriptComplete: (transcript: string) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscriptComplete }) => {
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    error
  } = useSpeechRecognition();

  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [processingComplete, setProcessingComplete] = useState<boolean>(false);
  const finalTranscriptRef = useRef<string>('');

  // Update the ref when transcript changes
  useEffect(() => {
    if (transcript) {
      finalTranscriptRef.current = transcript;
    }
  }, [transcript]);

  // Handle recording timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isListening) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isListening]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    resetTranscript();
    setProcessingComplete(false);
    finalTranscriptRef.current = '';
    startListening();
  };

  const handleStopRecording = () => {
    stopListening();
    
    // Capture the current transcript immediately
    const currentTranscript = finalTranscriptRef.current || transcript;
    console.log("Current transcript on stop:", currentTranscript);
    
    // Only process non-empty transcripts
    if (currentTranscript && currentTranscript.trim()) {
      console.log("Processing transcript:", currentTranscript.trim());
      
      // Use a longer delay to ensure the full transcript is captured
      setTimeout(() => {
        if (!processingComplete) {
          console.log("Sending final transcript:", currentTranscript.trim());
          setProcessingComplete(true);
          onTranscriptComplete(currentTranscript.trim());
        }
      }, 1000); 
    } else {
      console.log("Empty transcript detected - not proceeding to confirmation");
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-800">
        <p className="font-medium mb-2">Your browser doesn't support speech recognition.</p>
        <p>Please try using Chrome, Edge, or Safari.</p>
      </div>
    );
  }

  return (
    <div className="voice-recorder space-y-4">
      <div className="flex flex-col items-center justify-center border rounded-md p-6">
        <div className="text-3xl font-mono mb-4">
          {formatTime(recordingTime)}
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={isListening ? handleStopRecording : handleStartRecording}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className="rounded-full h-14 w-14 p-0"
          >
            {isListening ? (
              <Square className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
        </div>
        
        {isListening && (
          <p className="text-xs text-muted-foreground mt-4 animate-pulse">
            Recording... {recordingTime > 0 ? `(${formatTime(recordingTime)})` : ''}
          </p>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm p-2">{error}</div>
      )}

      {transcript && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Transcript</h3>
          <div className="p-3 bg-muted/30 rounded-md text-sm">
            {transcript || (isListening ? 'Listening...' : 'Press the button to start recording')}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
