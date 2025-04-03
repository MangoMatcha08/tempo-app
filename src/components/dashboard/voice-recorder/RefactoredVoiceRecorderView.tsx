
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, StopCircle } from 'lucide-react';
import PermissionAlert from './PermissionAlert';
import TranscriptDisplay from './TranscriptDisplay';
import { useVoiceRecorderState } from '@/hooks/useVoiceRecorderState';

export interface RefactoredVoiceRecorderViewProps {
  isProcessing: boolean;
  onTranscriptComplete?: (text: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: (transcript: string) => void;
}

const RefactoredVoiceRecorderView: React.FC<RefactoredVoiceRecorderViewProps> = ({
  isProcessing,
  onTranscriptComplete,
  onRecordingStart,
  onRecordingStop
}) => {
  const {
    title,
    setTitle,
    transcript,
    view,
    setView,
    isRecording,
    permissionStatus,
    hasRecorded,
    recordingTimeSeconds,
    errorMessage,
    debugInfo,
    isDebugMode,
    toggleDebugMode,
    requestMicrophonePermission,
    startRecording,
    stopRecording,
    resetRecording,
    cancelRecording
  } = useVoiceRecorderState();

  // Handle completion of transcript
  useEffect(() => {
    if (transcript && !isRecording && hasRecorded && onTranscriptComplete) {
      onTranscriptComplete(transcript);
    }
  }, [transcript, isRecording, hasRecorded, onTranscriptComplete]);

  // Handle recording start callback
  useEffect(() => {
    if (isRecording && onRecordingStart) {
      onRecordingStart();
    }
  }, [isRecording, onRecordingStart]);

  // Handle recording stop callback
  useEffect(() => {
    if (!isRecording && hasRecorded && transcript && onRecordingStop) {
      onRecordingStop(transcript);
    }
  }, [isRecording, hasRecorded, transcript, onRecordingStop]);

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const handleStopRecording = () => {
    try {
      stopRecording();
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Permission alert display */}
      {permissionStatus !== 'granted' && (
        <PermissionAlert 
          status={permissionStatus} 
          onRequestPermission={requestMicrophonePermission} 
        />
      )}
      
      {/* Error alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {/* Recording interface */}
      <div className="flex flex-col items-center justify-center gap-4 p-4">
        {!isRecording ? (
          <Button
            onClick={handleStartRecording}
            disabled={permissionStatus !== 'granted' || isProcessing}
            size="lg"
            className="w-16 h-16 rounded-full"
            variant="outline"
          >
            <Mic className={`h-8 w-8 ${permissionStatus !== 'granted' ? 'text-muted-foreground' : 'text-primary'}`} />
          </Button>
        ) : (
          <Button
            onClick={handleStopRecording}
            size="lg"
            className="w-16 h-16 rounded-full animate-pulse bg-red-500 hover:bg-red-600"
            variant="default"
          >
            <StopCircle className="h-8 w-8 text-white" />
          </Button>
        )}
        
        {isRecording && (
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Recording...</span>
              <span>{recordingTimeSeconds}s</span>
            </div>
            <Progress value={Math.min(recordingTimeSeconds / 60 * 100, 100)} className="h-2" />
          </div>
        )}
        
        {!isRecording && hasRecorded && (
          <div className="text-center text-muted-foreground">
            {isProcessing ? "Processing your recording..." : "Recording complete!"}
          </div>
        )}
      </div>
      
      {/* Transcript display */}
      {transcript && (
        <TranscriptDisplay
          transcript={transcript}
          isProcessing={isProcessing}
        />
      )}
      
      {/* Recording controls */}
      {hasRecorded && !isProcessing && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            onClick={resetRecording}
            variant="outline"
            size="sm"
          >
            Record Again
          </Button>
          <Button
            onClick={cancelRecording}
            variant="ghost"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default RefactoredVoiceRecorderView;
