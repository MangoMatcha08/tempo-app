
import { useState, useEffect, useRef } from 'react';
import { 
  createSpeechRecognition, 
  configureSpeechRecognition,
  isSpeechRecognitionSupported,
  isIOSDevice,
  isHighLatencyEnvironment,
  isPwaMode,
  SpeechRecognitionOptions,
  ensureActiveAudioStream
} from './utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("SpeechRecognitionSetup");

interface UseSpeechRecognitionSetupProps {
  onError: (error: string | undefined) => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
}

// Enhanced Recognition State Management
export const useSpeechRecognitionSetup = ({
  onError,
  isListening,
  setIsListening
}: UseSpeechRecognitionSetupProps) => {
  const [recognition, setRecognition] = useState<any | null>(null);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState<boolean>(false);
  const isMobile = useIsMobile();
  const [isPWA, setIsPWA] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isHighLatency, setIsHighLatency] = useState(false);
  const hasAudioStartedRef = useRef(false);
  const recoveryAttemptsRef = useRef(0);
  const iosStreamEstablishedRef = useRef(false);
  
  // Enhanced platform detection
  useEffect(() => {
    const ios = isIOSDevice();
    const pwa = isPwaMode();
    const highLatency = isHighLatencyEnvironment();
    
    setIsPWA(pwa);
    setIsIOS(ios);
    setIsHighLatency(highLatency);
    
    debugLog("Platform detection:", {
      isPWA: pwa,
      isMobile,
      isIOS: ios,
      isHighLatency: highLatency
    });
    
    // For iOS PWA, preemptively request audio permission
    if (ios && pwa && !iosStreamEstablishedRef.current) {
      debugLog("iOS PWA detected, preemptively requesting audio permission");
      setTimeout(async () => {
        const success = await ensureActiveAudioStream();
        iosStreamEstablishedRef.current = success;
        debugLog(`iOS audio stream ${success ? 'established' : 'failed'}`);
      }, 500);
    }
  }, [isMobile]);
  
  // Initialize speech recognition with platform-aware configuration
  useEffect(() => {
    // Check browser support first
    const isSupported = isSpeechRecognitionSupported();
    setBrowserSupportsSpeechRecognition(isSupported);
    debugLog("Speech recognition supported:", isSupported);
    
    if (!isSupported) {
      onError('Your browser does not support speech recognition.');
      return;
    }
    
    // Create recognition instance with improved error handling
    try {
      const recognitionInstance = createSpeechRecognition();
      debugLog("Created recognition instance:", !!recognitionInstance);
      
      if (recognitionInstance) {
        // Enhanced configuration with platform-specific settings
        const options: SpeechRecognitionOptions = {
          isHighLatency,
          isPWA,
          isMobile,
          isIOS
        };
        
        configureSpeechRecognition(recognitionInstance, options);
        debugLog("Configured recognition with options:", options);
        
        // iOS-optimized handlers
        recognitionInstance.onstart = (event: any) => {
          debugLog("Recognition started event received");
          setIsListening(true);
          hasAudioStartedRef.current = false; // Reset audio flag
          recoveryAttemptsRef.current = 0; // Reset recovery attempts
        };
        
        recognitionInstance.onaudiostart = (event: any) => {
          debugLog("Audio capturing started");
          // Important iOS flag - tracks if audio capture actually began
          hasAudioStartedRef.current = true;
        };
        
        setRecognition(recognitionInstance);
      } else {
        onError('Failed to initialize speech recognition.');
      }
    } catch (error) {
      console.error('Error setting up speech recognition:', error);
      debugLog(`Error setting up speech recognition: ${error}`);
      onError('Failed to initialize speech recognition.');
    }
    
    // Cleanup function
    return () => {
      debugLog("Cleaning up speech recognition");
      if (recognition) {
        try {
          recognition.stop();
          debugLog("Recognition stopped during cleanup");
        } catch (err) {
          debugLog(`Error stopping during cleanup: ${err}`);
        }
      }
    };
  }, [onError, setIsListening, isMobile, isPWA, isIOS, isHighLatency]);

  return {
    recognition,
    browserSupportsSpeechRecognition,
    isPWA,
    isMobile,
    isIOS
  };
};
