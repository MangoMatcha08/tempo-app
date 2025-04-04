
import React, { useState, useEffect, useRef } from 'react';
import useSpeechRecognition from '../../hooks/speech-recognition';
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("VoiceRecorder");

interface VoiceRecorderProps {
  onTranscriptComplete: (transcript: string) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscriptComplete }) => {
  const {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    error,
    isPWA,
    isMobile
  } = useSpeechRecognition();

  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [processingComplete, setProcessingComplete] = useState<boolean>(false);
  const finalTranscriptRef = useRef<string>('');
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stoppedRecordingRef = useRef<boolean>(false);

  // Update the ref when transcript changes
  useEffect(() => {
    if (transcript) {
      debugLog(`Updating finalTranscriptRef: "${transcript.substring(0, 30)}${transcript.length > 30 ? '...' : ''}"`);
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
      // When recording stops, check if we have a transcript
      if (recordingTime > 0 && !processingComplete) {
        stoppedRecordingRef.current = true;
        debugLog("Recording stopped, checking for transcript");
        
        // Get current transcript
        const currentTranscript = finalTranscriptRef.current || transcript;
        
        if (currentTranscript && currentTranscript.trim()) {
          debugLog(`Found transcript on recording stop: "${currentTranscript.substring(0, 30)}${currentTranscript.length > 30 ? '...' : ''}"`);
          sendTranscriptAfterDelay(currentTranscript.trim());
        } else {
          debugLog("No transcript found on recording stop");
        }
      }
      
      setRecordingTime(0);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isListening, recordingTime, transcript, processingComplete]);

  // Send transcript after a delay to allow final processing
  const sendTranscriptAfterDelay = (text: string) => {
    // Clear any existing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
    debugLog(`Scheduling transcript processing: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
    
    // Set a timeout to process after a delay
    // Use a longer delay for iOS/PWA to ensure all results are captured
    const processingDelay = isMobile ? 
      (isPWA ? 1500 : 1200) : 
      (isPWA ? 1000 : 800);
      
    debugLog(`Using processing delay of ${processingDelay}ms (isPWA: ${isPWA}, isMobile: ${isMobile})`);
    
    processingTimeoutRef.current = setTimeout(() => {
      // Double-check that we have content
      const finalText = finalTranscriptRef.current || text;
      
      if (finalText && finalText.trim() && !processingComplete) {
        debugLog(`Sending final transcript after delay: "${finalText.substring(0, 30)}${finalText.length > 30 ? '...' : ''}"`);
        setProcessingComplete(true);
        onTranscriptComplete(finalText.trim());
      } else {
        debugLog("No transcript available to send after delay");
      }
      
      processingTimeoutRef.current = null;
    }, processingDelay);
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    debugLog("Starting recording");
    resetTranscript();
    setProcessingComplete(false);
    finalTranscriptRef.current = '';
    stoppedRecordingRef.current = false;
    
    // Clear any existing processing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    
    await startListening();
  };

  const handleStopRecording = () => {
    debugLog("Stopping recording");
    stopListening();
    stoppedRecordingRef.current = true;
    
    // Capture the current transcript immediately
    const currentTranscript = finalTranscriptRef.current || transcript;
    debugLog(`Current transcript on stop: "${currentTranscript ? (currentTranscript.substring(0, 30) + (currentTranscript.length > 30 ? '...' : '')) : 'none'}"`);
    
    // Only process non-empty transcripts
    if (currentTranscript && currentTranscript.trim()) {
      sendTranscriptAfterDelay(currentTranscript.trim());
    } else {
      debugLog("Empty transcript detected - not proceeding to confirmation");
      
      // Set a fallback timeout to check one last time for transcript
      // (sometimes the final results come in right after stopping)
      setTimeout(() => {
        const lastChanceTranscript = finalTranscriptRef.current || transcript;
        
        if (lastChanceTranscript && lastChanceTranscript.trim() && !processingComplete) {
          debugLog(`Last chance transcript found: "${lastChanceTranscript.substring(0, 30)}${lastChanceTranscript.length > 30 ? '...' : ''}"`);
          sendTranscriptAfterDelay(lastChanceTranscript.trim());
        } else {
          debugLog("No transcript found even after last chance check");
        }
      }, 1000);
    }
  };
  
  // Auto-stop after max recording time (30 seconds)
  useEffect(() => {
    if (recordingTime >= 30 && isListening) {
      debugLog("Auto-stopping after reaching max recording time (30s)");
      handleStopRecording();
    }
  }, [recordingTime, isListening]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      if (isListening) {
        stopListening();
      }
    };
  }, [isListening, stopListening]);

  // Add info about device state for debugging
  useEffect(() => {
    debugLog(`Device state: isPWA=${isPWA}, isMobile=${isMobile}, browserSupport=${browserSupportsSpeechRecognition}`);
  }, [isPWA, isMobile, browserSupportsSpeechRecognition]);

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
            disabled={processingComplete}
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
        
        {processingComplete && (
          <p className="text-xs text-green-600 mt-4">
            Processing transcript...
          </p>
        )}
        
        {isPWA && (
          <p className="text-xs text-blue-600 mt-2">
            Running in PWA mode {isMobile ? "on mobile" : ""}
          </p>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm p-2">{error}</div>
      )}

      {(transcript || interimTranscript) && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Transcript</h3>
          <div className="p-3 bg-muted/30 rounded-md text-sm">
            {transcript || interimTranscript || (isListening ? 'Listening...' : 'Press the button to start recording')}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
