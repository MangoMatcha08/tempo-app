import { useState, useRef, useEffect, useCallback } from 'react';
import { createDebugLogger } from '@/utils/debugUtils';
import { isPWAMode } from '@/utils/pwaUtils';
import { UseSpeechRecognitionReturn } from './types';

const debugLog = createDebugLogger("SpeechRecognition");

// Helper functions
const isIOSDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|macintosh/.test(userAgent) && 'ontouchend' in document;
};

const isMobileDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
};

// Debounce function to prevent rapid updates
const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Create a custom hook for speech recognition
const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  // State variables
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [recognition, setRecognition] = useState<any | null>(null);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState<boolean>(false);
  
  // Environment detection
  const isPWA = isPWAMode();
  const isIOS = isIOSDevice();
  const isMobile = isMobileDevice();
  
  // Refs for maintaining state between renders
  const finalTranscriptRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  const isRecognitionActiveRef = useRef<boolean>(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create a debounced update function
  const debouncedSetTranscript = useCallback(
    debounce((text: string) => {
      setTranscript(text);
    }, 300),
    []
  );

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    const windowObj = window as any;
    if ('webkitSpeechRecognition' in windowObj || 'SpeechRecognition' in windowObj) {
      // TypeScript doesn't recognize these browser-specific APIs
      const SpeechRecognition = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;
      try {
        const recognitionInstance = new SpeechRecognition();
        
        // Configure recognition
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';
        
        // Special handling for iOS in PWA mode
        if (isIOS && isPWA) {
          recognitionInstance.continuous = false;
          debugLog("iOS PWA detected - using non-continuous mode");
        }
        
        setRecognition(recognitionInstance);
        setBrowserSupportsSpeechRecognition(true);
        debugLog("Speech recognition initialized successfully");
      } catch (err) {
        setError(`Failed to initialize speech recognition: ${err}`);
        setBrowserSupportsSpeechRecognition(false);
        debugLog(`Error initializing speech recognition: ${err}`);
      }
    } else {
      setError('Your browser does not support speech recognition.');
      setBrowserSupportsSpeechRecognition(false);
      debugLog("Browser does not support speech recognition");
    }
    
    // Cleanup
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [isIOS, isPWA]);
  
  // Setup recognition event handlers
  useEffect(() => {
    if (!recognition) return;
    
    recognition.onresult = (event: any) => {
      // Process results to separate final from interim
      let finalTranscript = finalTranscriptRef.current;
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptResult = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          // Only add to final transcript if it's a final result
          finalTranscript += ' ' + transcriptResult;
          debugLog(`Final result: "${transcriptResult}"`);
        } else {
          // Store interim results separately
          interimTranscript += transcriptResult;
          debugLog(`Interim result: "${transcriptResult}"`);
        }
      }
      
      // Update refs
      finalTranscriptRef.current = finalTranscript.trim();
      interimTranscriptRef.current = interimTranscript.trim();
      
      // Update state with debouncing
      if (finalTranscript.trim()) {
        debouncedSetTranscript(finalTranscript.trim());
        setInterimTranscript('');
      } else if (interimTranscript.trim()) {
        setInterimTranscript(interimTranscript.trim());
      }
    };
    
    recognition.onerror = (event: any) => {
      debugLog(`Speech recognition error: ${event.error}`);
      
      // Don't treat 'no-speech' as a critical error
      if (event.error === 'no-speech') {
        return;
      }
      
      setError(`Speech recognition error: ${event.error}`);
      
      if (event.error === 'network') {
        // For network errors, attempt restart after a delay
        if (isListening && isRecognitionActiveRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            if (isRecognitionActiveRef.current) {
              try {
                debugLog("Attempting restart after network error");
                recognition.start();
              } catch (e) {
                debugLog(`Error restarting after network error: ${e}`);
              }
            }
          }, 2000);
        }
      }
      
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setIsListening(false);
        isRecognitionActiveRef.current = false;
      }
    };
    
    recognition.onend = () => {
      debugLog("Recognition ended");
      
      // If we're still supposed to be listening but recognition ended
      if (isListening && isRecognitionActiveRef.current) {
        // This is an unexpected stop, try to restart
        debugLog("Unexpected end, attempting restart");
        
        // Give a small delay before attempting restart
        restartTimeoutRef.current = setTimeout(() => {
          if (isRecognitionActiveRef.current) {
            try {
              recognition.start();
              debugLog("Successfully restarted recognition");
            } catch (err) {
              debugLog(`Failed to restart recognition: ${err}`);
              // If restart fails, update state
              setIsListening(false);
              isRecognitionActiveRef.current = false;
            }
          }
        }, 300);
      } else {
        // Normal end of recognition
        setIsListening(false);
        isRecognitionActiveRef.current = false;
      }
    };
    
    return () => {
      // Remove event handlers
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
      }
    };
  }, [recognition, isListening, debouncedSetTranscript]);

  // Request microphone permission and ensure it's ready
  const ensureMicrophoneAccess = async (): Promise<boolean> => {
    try {
      debugLog("Requesting microphone access");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Keep the stream active for a short while to avoid permission issues
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        debugLog("Released temporary microphone stream");
      }, 1000);
      
      return true;
    } catch (err) {
      debugLog(`Microphone access error: ${err}`);
      setError(`Could not access microphone: ${err}`);
      return false;
    }
  };

  // Start listening function
  const startListening = useCallback(async () => {
    if (!recognition) {
      setError('Speech recognition not available');
      return;
    }
    
    if (isListening) {
      debugLog("Already listening, ignoring start request");
      return;
    }
    
    debugLog("Starting speech recognition");
    setError(undefined);
    
    // First ensure we have microphone access
    const microphoneAvailable = await ensureMicrophoneAccess();
    if (!microphoneAvailable) {
      return;
    }
    
    try {
      // Reset transcripts
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      
      // Update state
      isRecognitionActiveRef.current = true;
      
      // Start recognition
      recognition.start();
      setIsListening(true);
      debugLog("Recognition started successfully");
    } catch (err) {
      debugLog(`Error starting recognition: ${err}`);
      
      // Handle "already started" error
      if (err instanceof Error && err.message.includes('already started')) {
        debugLog("Recognition was already started");
        setIsListening(true);
        isRecognitionActiveRef.current = true;
      } else {
        setError(`Could not start speech recognition: ${err}`);
        setIsListening(false);
        isRecognitionActiveRef.current = false;
      }
    }
  }, [recognition, isListening]);

  // Stop listening function
  const stopListening = useCallback(() => {
    if (!recognition) return;
    
    debugLog("Stopping recognition");
    
    isRecognitionActiveRef.current = false;
    
    try {
      recognition.stop();
      debugLog("Recognition stopped successfully");
    } catch (err) {
      debugLog(`Error stopping recognition: ${err}`);
    }
    
    // Ensure we're showing the final transcript
    if (finalTranscriptRef.current.trim()) {
      setTranscript(finalTranscriptRef.current.trim());
    }
    
    setIsListening(false);
  }, [recognition]);

  // Reset transcript function
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    debugLog("Transcript reset");
  }, []);

  return {
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
  };
};

export default useSpeechRecognition;
