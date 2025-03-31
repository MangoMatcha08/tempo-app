
import React, { useState, useEffect } from 'react';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';
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
    startListening();
  };

  const handleStopRecording = () => {
    stopListening();
    if (transcript.trim()) {
      onTranscriptComplete(transcript.trim());
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
            Recording...
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
