
import { useState, useRef, useEffect, useCallback } from 'react';
import useSpeechRecognition from './speech-recognition';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("useVoiceRecorderState");

export type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'loading' | 'unsupported';

export const useVoiceRecorderState = () => {
  const [title, setTitle] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [view, setView] = useState<'record' | 'confirm'>('record');
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);
  const [recordingTimeSeconds, setRecordingTimeSeconds] = useState<number>(0);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);
  
  // Record debug information
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({
    browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    speechRecognitionSupported: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    mediaDevicesSupported: typeof navigator !== 'undefined' && !!navigator.mediaDevices,
  });
  
  // Setup speech recognition
  const { 
    transcript: recognitionTranscript,
    listening,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  
  // Timer reference for recording duration
  const timerRef = useRef<number | null>(null);
  
  // Update transcript when speech recognition changes
  useEffect(() => {
    if (recognitionTranscript) {
      setTranscript(recognitionTranscript);
    }
  }, [recognitionTranscript]);
  
  // Update isRecording state when listening changes
  useEffect(() => {
    setIsRecording(listening);
  }, [listening]);
  
  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingTimeSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTimeSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);
  
  // Check for microphone permission on mount
  useEffect(() => {
    const checkPermissions = async () => {
      if (!browserSupportsSpeechRecognition) {
        setPermissionStatus('unsupported');
        setErrorMessage('Your browser does not support speech recognition.');
        return;
      }
      
      try {
        setPermissionStatus('loading');
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (permissionStatus.state === 'granted') {
          setPermissionStatus('granted');
        } else if (permissionStatus.state === 'denied') {
          setPermissionStatus('denied');
        } else {
          setPermissionStatus('prompt');
        }
        
        // Update on permission change
        permissionStatus.onchange = () => {
          setPermissionStatus(permissionStatus.state as PermissionStatus);
        };
      } catch (error) {
        console.error('Error checking permission:', error);
        // Most browsers don't support permission query for microphone, so we'll try to request it
        setPermissionStatus('prompt');
      }
    };
    
    checkPermissions();
  }, [browserSupportsSpeechRecognition]);
  
  // Request microphone permission
  const requestMicrophonePermission = async () => {
    if (!browserSupportsSpeechRecognition) {
      setPermissionStatus('unsupported');
      setErrorMessage('Your browser does not support speech recognition.');
      return false;
    }
    
    try {
      setPermissionStatus('loading');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setPermissionStatus('granted');
      return true;
    } catch (error) {
      console.error('Error getting microphone permission:', error);
      setPermissionStatus('denied');
      setErrorMessage('Microphone access denied. Please enable it in your browser settings.');
      return false;
    }
  };
  
  // Start recording
  const startRecording = async () => {
    debugLog('Starting recording...');
    setErrorMessage('');
    
    if (permissionStatus !== 'granted') {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }
    
    try {
      await startListening();
      setIsRecording(true);
      debugLog('Recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      setErrorMessage('Failed to start recording. Please try again.');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    debugLog('Stopping recording...');
    try {
      stopListening();
      setIsRecording(false);
      setHasRecorded(true);
      debugLog('Recording stopped, transcript:', transcript);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setErrorMessage('Failed to stop recording. Please try again.');
    }
  };
  
  // Reset recording
  const resetRecording = () => {
    setTranscript('');
    setHasRecorded(false);
    setRecordingTimeSeconds(0);
    setErrorMessage('');
  };
  
  // Cancel recording
  const cancelRecording = () => {
    resetRecording();
    // Cleanup audio stream
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
  };
  
  // Toggle debug mode
  const toggleDebugMode = () => {
    setIsDebugMode(prev => !prev);
  };
  
  return {
    title,
    setTitle,
    transcript,
    isProcessing,
    view,
    setView,
    permissionStatus,
    isRecording,
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
  };
};
