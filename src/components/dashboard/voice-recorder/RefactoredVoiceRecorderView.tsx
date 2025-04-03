import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, X } from 'lucide-react';
import { useSpeechRecognition } from 'react-speech-kit';
import { useToast } from "@/hooks/use-toast";
import { processVoiceInput } from '@/services/nlp/processVoiceInput';
import { VoiceProcessingResult } from '@/types/reminderTypes';
import { isIOSDevice, isPWAMode } from '@/services/notifications/firebase';
import { useVoiceRecorderState } from '@/hooks/useVoiceRecorderState';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("VoiceRecorder");

interface RefactoredVoiceRecorderViewProps {
  onReminderCreated: (processingResult: VoiceProcessingResult) => void;
  onClose: () => void;
}

const RefactoredVoiceRecorderView: React.FC<RefactoredVoiceRecorderViewProps> = ({ onReminderCreated, onClose }) => {
  // Component state
  const { transcript, finalTranscript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<VoiceProcessingResult | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // On component mount
  useEffect(() => {
    // Check if we're on iOS
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
    
    // Check if we're in PWA mode
    setIsPWA(isPWAMode());
    
    // Get microphone permission status
    checkMicrophonePermission();
    
    // Log browser support status
    debugLog(`Browser supports speech recognition: ${browserSupportsSpeechRecognition}`);
    
    // Clean up on unmount
    return () => {
      stopRecording();
      resetTimer();
    };
  }, [browserSupportsSpeechRecognition]);

  // Custom hook for managing voice recorder state
  const {
    permissionStatus,
    audioStream,
    setAudioStream,
    setPermissionStatus,
    setErrorMessage: setVoiceRecorderErrorMessage,
    requestMicrophonePermission
  } = useVoiceRecorderState();

  // Check microphone permission
  const checkMicrophonePermission = useCallback(async () => {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setHasPermission(permissionStatus.state === 'granted');
      setPermissionStatus(permissionStatus.state);
      debugLog(`Microphone permission status: ${permissionStatus.state}`);
      
      if (permissionStatus.state === 'granted') {
        // Try to get user media to check if microphone is available
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setHasPermission(false);
      setPermissionStatus('denied');
      setVoiceRecorderErrorMessage(error instanceof Error ? error.message : String(error));
    }
  }, [setHasPermission, setPermissionStatus, setVoiceRecorderErrorMessage, setAudioStream]);

  // Start recording
  const startRecording = useCallback(async () => {
    debugLog('Starting recording...');
    resetTranscript();
    setErrorMessage(null);
    setProcessingResult(null);
    setAudioURL(null);
    audioChunksRef.current = [];
    setRecordingTime(0);
    
    try {
      // Check if we have permission
      if (permissionStatus !== 'granted') {
        debugLog('Microphone permission not granted, requesting now...');
        const permission = await requestMicrophonePermission();
        if (!permission) {
          debugLog('Microphone permission denied');
          return;
        }
      }
      
      // Check if we have an audio stream
      if (!audioStream) {
        debugLog('No audio stream available, getting now...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
      }
      
      // Create media recorder
      if (audioStream) {
        debugLog('Creating media recorder');
        mediaRecorderRef.current = new MediaRecorder(audioStream);
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        mediaRecorderRef.current.onstop = () => {
          debugLog('Recording stopped');
          createAudioURL();
        };
        mediaRecorderRef.current.start();
        setIsListening(true);
        startTimer();
        debugLog('Recording started');
      } else {
        debugLog('No audio stream available');
        setErrorMessage('No audio stream available. Please check your microphone settings.');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  }, [permissionStatus, audioStream, setAudioStream, requestMicrophonePermission, resetTranscript, setErrorMessage]);

  // Stop recording
  const stopRecording = useCallback(() => {
    debugLog('Stopping recording...');
    setIsListening(false);
    stopTimer();
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      debugLog('Media recorder stopped');
    } else {
      debugLog('Media recorder is not active');
    }
  }, []);

  // Create audio URL
  const createAudioURL = useCallback(() => {
    debugLog('Creating audio URL');
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(audioBlob);
      setAudioURL(url);
      debugLog(`Audio URL created: ${url}`);
    } else {
      debugLog('No audio data available');
      setErrorMessage('No audio data available. Please try recording again.');
    }
  }, [setErrorMessage]);

  // Process transcript
  const processTranscript = useCallback(async () => {
    if (!finalTranscript) {
      toast({
        title: "No Voice Data",
        description: "Please record your reminder first",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      debugLog(`Processing transcript: ${finalTranscript}`);
      const result = processVoiceInput(finalTranscript);
      setProcessingResult(result);
      debugLog('Voice processing result:', result);
      
      // Show success toast
      toast({
        title: "Voice Reminder Created",
        description: `"${result.reminder.title}" has been added to your reminders.`
      });
      
      // Pass processing result to parent component
      onReminderCreated(result);
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error processing voice input:', error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      toast({
        title: "Error Processing Voice",
        description: "There was a problem processing your voice input.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [finalTranscript, toast, setErrorMessage, setIsProcessing, setProcessingResult, onReminderCreated, onClose]);

  // Start timer
  const startTimer = useCallback(() => {
    debugLog('Starting timer');
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prevTime) => prevTime + 1);
    }, 1000);
  }, [setRecordingTime]);

  // Stop timer
  const stopTimer = useCallback(() => {
    debugLog('Stopping timer');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Reset timer
  const resetTimer = useCallback(() => {
    debugLog('Resetting timer');
    stopTimer();
    setRecordingTime(0);
  }, [stopTimer, setRecordingTime]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isListening, startRecording, stopRecording]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Voice Recorder</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="flex-grow flex flex-col p-4 space-y-4">
        {/* Microphone Permission Status */}
        {permissionStatus !== 'granted' && (
          <div className="text-red-500">
            Microphone permission is {permissionStatus}. Please grant permission to use the voice recorder.
          </div>
        )}
        
        {/* Error Message */}
        {errorMessage && (
          <div className="text-red-500">
            Error: {errorMessage}
          </div>
        )}
        
        {/* Transcript Display */}
        <div className="flex-grow overflow-y-auto border rounded-md p-2">
          <p className="whitespace-pre-line">{transcript || 'Start recording to see the transcript...'}</p>
        </div>
        
        {/* Recording Time */}
        <div className="text-sm text-muted-foreground">
          Recording Time: {recordingTime} seconds
        </div>
        
        {/* Audio Playback */}
        {audioURL && (
          <audio src={audioURL} controls className="w-full"></audio>
        )}
        
        {/* Debug Information */}
        {showDebugInfo && (
          <div className="border rounded-md p-2 text-xs">
            <h4 className="font-semibold">Debug Information:</h4>
            <p>Final Transcript: {finalTranscript}</p>
            <p>Is iOS: {isIOS ? 'Yes' : 'No'}</p>
            <p>Is PWA: {isPWA ? 'Yes' : 'No'}</p>
            <p>Browser Supports Speech Recognition: {browserSupportsSpeechRecognition ? 'Yes' : 'No'}</p>
            <p>Permission Status: {permissionStatus}</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          {/* Toggle Debug Info Button */}
          <Button variant="outline" size="sm" onClick={() => setShowDebugInfo(!showDebugInfo)}>
            Toggle Debug Info
          </Button>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Reset Button */}
            <Button variant="secondary" size="sm" onClick={resetTranscript}>
              Reset
            </Button>
            
            {/* Record Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={toggleListening}
              disabled={isProcessing || permissionStatus !== 'granted'}
            >
              {isListening ? (
                <>
                  Stop Recording <Mic className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Start Recording <Mic className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            
            {/* Process Button */}
            <Button
              size="sm"
              onClick={processTranscript}
              disabled={isProcessing || !finalTranscript}
            >
              Process
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefactoredVoiceRecorderView;
