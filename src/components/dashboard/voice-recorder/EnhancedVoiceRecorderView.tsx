import React, { useState, useEffect, useReducer, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useEnhancedSpeechRecognition } from "@/hooks/speech-recognition";
import { useTrackedTimeouts } from "@/hooks/use-tracked-timeouts";
import { processTranscriptSafely } from "@/hooks/speech-recognition/errorHandlers";
import { useIsMobile } from "@/hooks/use-mobile";
import { getEnvironmentDescription, detectEnvironment } from "@/hooks/speech-recognition/environmentDetection";
import { VoiceProcessingResult } from "@/types/reminderTypes";
import { checkStatus, getPreservedTranscript, getErrorMessage } from "@/hooks/speech-recognition/statusUtils";

const IOS_PWA_MAX_SESSION_DURATION = 6000; // 6 seconds max for iOS PWA (reduced from 8)
const IOS_PWA_SESSION_PAUSE = 500; // 500ms pause between sessions
const IOS_PWA_AUTO_STOP_BUFFER = 500; // Stop 500ms before max duration

// Define the interface for the iOS PWA Recording Mode component props
interface IOSPwaRecordingModeProps {
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  onTranscriptComplete: (transcript: string) => void;
  showSpecialMode: boolean;
  setShowSpecialMode: (show: boolean) => void;
}

// Extract the iOS PWA Recording Mode component outside the main component
const IOSPwaRecordingMode: React.FC<IOSPwaRecordingModeProps> = ({
  transcript,
  interimTranscript,
  startListening,
  stopListening,
  resetTranscript,
  onTranscriptComplete,
  showSpecialMode,
  setShowSpecialMode
}) => {
  // Local state for this component
  const [isCapturing, setIsCapturing] = useState(false);
  const [recordingCountdown, setRecordingCountdown] = useState(4);
  const [localCapturedTranscript, setLocalCapturedTranscript] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Improved recording logic with progressive transcript checking
  const handleIOSRecording = () => {
    console.log("iOS Recording started");
    
    // Reset state
    resetTranscript();
    setLocalCapturedTranscript("");
    setRecordingCountdown(4);
    
    // Store transcript before starting (should be empty)
    const initialTranscript = transcript;
    console.log("Initial transcript:", initialTranscript);
    
    // Start recording
    setIsCapturing(true);
    startListening();
    console.log("startListening called");
    
    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Set up countdown display updates
    intervalRef.current = setInterval(() => {
      setRecordingCountdown(prev => {
        // Log current transcript during recording
        if (prev === 2) {
          console.log("Mid-recording transcript:", transcript || interimTranscript);
        }
        
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Set main recording timeout
    timerRef.current = setTimeout(() => {
      console.log("Recording timeout reached, stopping");
      
      // Capture transcript BEFORE stopping (important for iOS)
      const preStopTranscript = transcript || interimTranscript;
      console.log("Pre-stop transcript:", preStopTranscript);
      
      // Stop listening
      stopListening();
      setIsCapturing(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      // Implement a progressive checking approach with multiple timeouts
      // to ensure we catch the transcript whenever it becomes available
      
      // First check - immediate
      const checkTranscript = () => {
        const currentTranscript = transcript || interimTranscript || preStopTranscript;
        console.log("Checking transcript:", currentTranscript);
        
        if (currentTranscript && currentTranscript.trim()) {
          console.log("Transcript found:", currentTranscript);
          setLocalCapturedTranscript(currentTranscript);
          return true;
        }
        return false;
      };
      
      // Check immediately
      if (checkTranscript()) return;
      
      // Check again after 300ms (original timing)
      setTimeout(() => {
        if (checkTranscript()) return;
        
        // Check again after 800ms (extended timing for iOS)
        setTimeout(() => {
          if (checkTranscript()) return;
          
          // Final check after 1500ms
          setTimeout(() => {
            if (!checkTranscript() && preStopTranscript) {
              // Last resort - use the pre-stop transcript if we have it
              console.log("Using pre-stop transcript as fallback");
              setLocalCapturedTranscript(preStopTranscript);
            }
          }, 700);
        }, 500);
      }, 300);
    }, 4000); // Fixed 4-second recording
  };
  
  // Add effect to monitor transcript changes
  useEffect(() => {
    // Only run this if we've just finished recording but don't have a local transcript yet
    if (!isCapturing && !localCapturedTranscript && (transcript || interimTranscript)) {
      console.log("Detected transcript after recording stopped:", transcript || interimTranscript);
      setLocalCapturedTranscript(transcript || interimTranscript);
    }
  }, [isCapturing, transcript, interimTranscript, localCapturedTranscript]);
  
  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  
  // Process captured transcript
  const processTranscript = () => {
    if (!localCapturedTranscript) return;
    
    // Call the parent handler
    console.log("Processing transcript:", localCapturedTranscript);
    onTranscriptComplete(localCapturedTranscript);
  };
  
  return (
    <div className="mt-4 p-3 border-2 border-blue-300 rounded-lg bg-blue-50 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-blue-800 font-medium">iOS PWA Optimized Mode</h3>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-xs"
          onClick={() => setShowSpecialMode(false)}
        >
          Use Standard Mode
        </Button>
      </div>
      
      <p className="text-sm text-blue-700 mb-3">
        Voice recognition in iOS PWA requires a simplified approach:
      </p>
      
      <div className="flex flex-col space-y-3">
        {/* Step 1: Record */}
        <div className="p-2 bg-white rounded border border-blue-200">
          <h4 className="text-sm font-medium text-blue-700">Step 1: Record (4 sec max)</h4>
          
          {isCapturing ? (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-red-500 h-2.5 rounded-full transition-all duration-1000 ease-linear" 
                  style={{ width: `${(4 - recordingCountdown) / 4 * 100}%` }}
                />
              </div>
              <p className="text-center text-sm mt-1 text-red-600 font-medium">
                Recording... {recordingCountdown}s left
              </p>
            </div>
          ) : (
            <Button
              onClick={handleIOSRecording}
              className="w-full mt-2 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300"
            >
              <Mic className="h-4 w-4 mr-2" />
              Start Short Recording
            </Button>
          )}
        </div>
        
        {/* Step 2: Process - Improved with fallback button */}
        <div className="p-2 bg-white rounded border border-blue-200">
          <h4 className="text-sm font-medium text-blue-700">Step 2: Process Transcript</h4>
          
          {localCapturedTranscript ? (
            <>
              <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                <p className="italic text-gray-700">{localCapturedTranscript}</p>
              </div>
              
              <Button
                onClick={processTranscript}
                className="w-full mt-2 bg-green-100 hover:bg-green-200 text-green-800 border border-green-300"
              >
                Process This Transcript
              </Button>
            </>
          ) : isCapturing ? (
            <p className="text-sm text-gray-500 mt-2 italic">
              Recording in progress...
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-500 mt-2 italic">
                {transcript || interimTranscript ? 
                  "Finalizing transcript..." : 
                  "Complete Step 1 to capture a transcript"}
              </p>
              
              {/* Show this button if recording completed but no local transcript was set */}
              {!isCapturing && (transcript || interimTranscript) && (
                <Button
                  onClick={() => {
                    const availableTranscript = transcript || interimTranscript;
                    console.log("Using available transcript:", availableTranscript);
                    setLocalCapturedTranscript(availableTranscript);
                  }}
                  className="w-full mt-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300"
                >
                  Use Available Transcript
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

type RecorderState = 
  | { status: 'idle' }
  | { status: 'requesting-permission' }
  | { status: 'recording' }
  | { status: 'recovering' }
  | { status: 'processing', transcript: string }
  | { status: 'confirming', result: VoiceProcessingResult }
  | { status: 'error', message: string, preservedTranscript?: string };

type RecorderEvent =
  | { type: 'START_RECORDING' }
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'PERMISSION_DENIED', message: string }
  | { type: 'STOP_RECORDING', transcript: string }
  | { type: 'RECOVERY_STARTED' }
  | { type: 'RECOVERY_COMPLETED' }
  | { type: 'RECOGNITION_ERROR', message: string, transcript?: string }
  | { type: 'PROCESSING_STARTED', transcript: string }
  | { type: 'PROCESSING_COMPLETE', result: VoiceProcessingResult }
  | { type: 'PROCESSING_ERROR', message: string }
  | { type: 'RESET' };

function voiceRecorderReducer(state: RecorderState, event: RecorderEvent): RecorderState {
  console.log(`Voice recorder state transition: ${state.status} + ${event.type}`);
  
  if (checkStatus(state.status, 'idle')) {
    if (event.type === 'START_RECORDING') 
      return { status: 'requesting-permission' };
  }
  else if (checkStatus(state.status, 'requesting-permission')) {
    if (event.type === 'PERMISSION_GRANTED') 
      return { status: 'recording' };
    if (event.type === 'PERMISSION_DENIED') 
      return { status: 'error', message: event.message };
  }
  else if (checkStatus(state.status, 'recording')) {
    if (event.type === 'STOP_RECORDING') 
      return { status: 'processing', transcript: event.transcript };
    if (event.type === 'RECOGNITION_ERROR') 
      return { 
        status: 'error', 
        message: event.message,
        preservedTranscript: event.transcript 
      };
    if (event.type === 'RECOVERY_STARTED')
      return { status: 'recovering' };
  }
  else if (checkStatus(state.status, 'recovering')) {
    if (event.type === 'RECOVERY_COMPLETED')
      return { status: 'recording' };
    if (event.type === 'RECOGNITION_ERROR')
      return { 
        status: 'error', 
        message: event.message,
        preservedTranscript: event.transcript
      };
    if (event.type === 'STOP_RECORDING')
      return { status: 'processing', transcript: event.transcript };
  }
  else if (checkStatus(state.status, 'processing')) {
    if (event.type === 'PROCESSING_COMPLETE') 
      return { status: 'confirming', result: event.result };
    if (event.type === 'PROCESSING_ERROR') 
      return { 
        status: 'error', 
        message: event.message,
        preservedTranscript: 'transcript' in state ? state.transcript : undefined
      };
  }
  else if (checkStatus(state.status, 'confirming')) {
    if (event.type === 'RESET') 
      return { status: 'idle' };
  }
  else if (checkStatus(state.status, 'error')) {
    if (event.type === 'RESET') 
      return { status: 'idle' };
    
    const errorMsg = 'message' in event ? event.message : 'Unknown error';
    
    if (errorMsg.includes('no speech') || 
        errorMsg.includes('network') || 
        errorMsg.includes('aborted') ||
        errorMsg.includes('Connection issue')) {
      
      const resetDelay = 6000;
      
      console.log(`Scheduling auto-reset for recoverable error in ${resetDelay}ms`);
      
      setTimeout(() => {
        console.log('Auto-reset executed for recoverable error');
      }, resetDelay);
      
      return { 
        status: 'error', 
        message: errorMsg,
        preservedTranscript: 'preservedTranscript' in state ? state.preservedTranscript : undefined
      };
    }
    
    return { 
      status: 'error', 
      message: errorMsg,
      preservedTranscript: 'preservedTranscript' in state ? state.preservedTranscript : undefined
    };
  }
  
  return state;
}

interface VoiceRecorderViewProps {
  onTranscriptComplete: (transcript: string) => void;
  onResultComplete?: (result: VoiceProcessingResult) => void;
  isProcessing: boolean;
}

const EnhancedVoiceRecorderView: React.FC<VoiceRecorderViewProps> = ({ 
  onTranscriptComplete, 
  onResultComplete,
  isProcessing: externalProcessing 
}) => {
  
  const {
    transcript,
    interimTranscript,
    isListening,
    isRecovering: recognitionRecovering,
    browserSupportsSpeechRecognition,
    startListening,
    stopListening,
    resetTranscript,
    getCompleteTranscript,
    error: recognitionError,
    environmentInfo,
    isPwa
  } = useEnhancedSpeechRecognition();
  
  const environment = getEnvironmentDescription();
  const rawEnvironment = detectEnvironment();
  
  const [state, dispatch] = useReducer(voiceRecorderReducer, { status: 'idle' });
  
  const [countdown, setCountdown] = useState<number>(0);
  const [permissionState, setPermissionState] = useState<PermissionState | "unknown">("unknown");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const isMobile = useIsMobile();
  
  // Add state for the iOS optimized mode at the top level
  const [showIOSOptimizedMode, setShowIOSOptimizedMode] = useState(true);
  
  const isMountedRef = useRef(true);
  
  const retryAttemptsRef = useRef<number>(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const errorResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const { 
    createTimeout, 
    clearTrackedTimeout, 
    clearAllTimeouts,
    runIfMounted 
  } = useTrackedTimeouts();
  
  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const isIOSWithVersion = useCallback(() => {
    if (!environmentInfo.isIOS) return null;
    
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      return {
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
        patch: match[3] ? parseInt(match[3], 10) : 0
      };
    }
    return null;
  }, [environmentInfo.isIOS]);

  const iosVersion = isIOSWithVersion();
  const isIOSBelowV15 = iosVersion && iosVersion.major < 15;

  useEffect(() => {
    console.log("Voice Recorder Environment:", {
      isPwa: environment.isPwa,
      isIOS: environmentInfo.isIOS,
      isIOSPwa: environmentInfo.isIOSPwa,
      isSafari: rawEnvironment.isSafari,
      isChrome: rawEnvironment.isChrome,
      isMobile: environmentInfo.isMobile,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      viewportHeight: window.innerHeight,
      screenWidth: window.innerWidth,
      features: rawEnvironment.features,
      recognitionConfig: rawEnvironment.recognitionConfig
    });
    
    addDebugInfo(`Environment: ${environment.isPwa ? 'PWA' : 'Browser'}, ${environment.platform}, ${environment.browser}`);
    
    if (environmentInfo.isIOSPwa) {
      addDebugInfo("⚠️ iOS PWA mode detected - using limited recognition capabilities");
    } else if (environment.isPwa) {
      addDebugInfo("PWA mode detected");
    }
    
    const iOSVersion = getIOSVersion();
    addDebugInfo(`iOS version detected: ${iOSVersion || 'unknown'}`);
    
    if (rawEnvironment.isSafari) {
      addDebugInfo("iOS Safari detected - has additional speech recognition constraints");
    }
  }, [environment, environmentInfo, rawEnvironment]);
  
  const getIOSVersion = () => {
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    return match ? `${match[1]}.${match[2]}${match[3] ? `.${match[3]}` : ''}` : null;
  };

  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionState(permissionResult.state);
          
          permissionResult.onchange = () => {
            setPermissionState(permissionResult.state);
            addDebugInfo(`Microphone permission changed to: ${permissionResult.state}`);
            
            if (permissionResult.state === 'granted' && checkStatus(state.status, 'requesting-permission')) {
              dispatch({ type: 'PERMISSION_GRANTED' });
              startRecording();
            } else if (permissionResult.state === 'denied' && checkStatus(state.status, 'requesting-permission')) {
              dispatch({ 
                type: 'PERMISSION_DENIED', 
                message: 'Microphone access was denied. Please enable microphone access in your browser settings.' 
              });
            }
          };
        } else {
          setPermissionState("unknown");
        }
      } catch (err) {
        console.error("Error checking microphone permission:", err);
        setPermissionState("unknown");
      }
    };
    
    checkMicPermission();
  }, [state.status]);
  
  useEffect(() => {
    return () => {
      clearAllTimeouts();
      
      if (isListening) {
        stopListening();
        addDebugInfo("Cleanup: stopped listening on unmount");
      }
      
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      
      if (errorResetTimerRef.current) {
        clearTimeout(errorResetTimerRef.current);
        errorResetTimerRef.current = null;
      }
    };
  }, [isListening, stopListening, clearAllTimeouts]);
  
  useEffect(() => {
    if (recognitionRecovering && checkStatus(state.status, 'recording')) {
      dispatch({ type: 'RECOVERY_STARTED' });
      addDebugInfo("Recognition is recovering");
    }
  }, [recognitionRecovering, state.status]);
  
  useEffect(() => {
    if (recognitionError && checkStatus(state.status, ['recording', 'recovering'])) {
      addDebugInfo(`Recognition error: ${recognitionError}`);
      dispatch({ 
        type: 'RECOGNITION_ERROR', 
        message: recognitionError,
        transcript: transcript || undefined
      });
    }
  }, [recognitionError, state.status, transcript]);
  
  const requestMicrophoneAccess = async () => {
    addDebugInfo("Requesting microphone access explicitly");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionState("granted");
      addDebugInfo("Microphone access granted");
      
      if (checkStatus(state.status, 'requesting-permission')) {
        dispatch({ type: 'PERMISSION_GRANTED' });
        startRecording();
      }
      
      return true;
    } catch (err) {
      console.error("Error requesting microphone access:", err);
      setPermissionState("denied");
      addDebugInfo("Microphone access denied");
      
      dispatch({ 
        type: 'PERMISSION_DENIED', 
        message: 'Microphone access was denied. Please enable microphone access in your browser settings.' 
      });
      
      return false;
    }
  };
  
  const startRecording = () => {
    addDebugInfo("Starting recording");
    
    resetTranscript();
    retryAttemptsRef.current = 0;
    
    startListening();
    
    setupCountdown();
    
    if (environmentInfo.isIOSPwa) {
      setupIOSPwaSessionRefresh();
    }
  };
  
  const setupCountdown = () => {
    const maxRecordingTime = environmentInfo.isIOSPwa ? 
      (isIOSBelowV15 ? 5 : 6) : 30;
      
    setCountdown(maxRecordingTime);
    
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
    }
    
    recordingTimerRef.current = setTimeout(() => {
      if (checkStatus(state.status, 'recording') || checkStatus(state.status, 'recovering')) {
        addDebugInfo(`Auto-stopping after ${maxRecordingTime} seconds`);
        handleStopRecording();
      }
    }, maxRecordingTime * 1000);
    
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const setupIOSPwaSessionRefresh = () => {
    if (!environmentInfo.isIOSPwa) return;
    
    addDebugInfo("Setting up iOS PWA short session management");
    
    const effectiveSessionDuration = isIOSBelowV15 ? 5000 : IOS_PWA_MAX_SESSION_DURATION;
    
    const autoStopTime = effectiveSessionDuration - IOS_PWA_AUTO_STOP_BUFFER;
    
    createTimeout(() => {
      if (isListening && isMountedRef.current) {
        addDebugInfo(`iOS PWA: Auto-stopping after ${autoStopTime}ms`);
        const currentTranscript = transcript;
        
        stopListening();
        
        createTimeout(() => {
          if (currentTranscript && currentTranscript.trim().length > 0 && isMountedRef.current) {
            addDebugInfo(`iOS PWA: Attempting manual processing of transcript: ${currentTranscript.substring(0, 30)}...`);
            attemptManualProcessing(currentTranscript);
          }
        }, IOS_PWA_SESSION_PAUSE);
      }
    }, autoStopTime);
  };
  
  const toggleRecording = async () => {
    if (checkStatus(state.status, ['recording', 'recovering'])) {
      handleStopRecording();
      return;
    }
    
    dispatch({ type: 'START_RECORDING' });
    
    if (permissionState === 'granted') {
      dispatch({ type: 'PERMISSION_GRANTED' });
      startRecording();
    } else {
      const permissionGranted = await requestMicrophoneAccess();
      
      if (!permissionGranted) {
        addDebugInfo("Cannot start recording - microphone access not granted");
      }
    }
  };
  
  const handleStopRecording = () => {
    addDebugInfo("Stopping recording");
    
    stopListening();
    
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    
    const finalTranscript = getCompleteTranscript();
    
    if (finalTranscript && finalTranscript.trim()) {
      addDebugInfo(`Sending transcript: "${finalTranscript.substring(0, 30)}${finalTranscript.length > 30 ? '...' : ''}"`);
      
      dispatch({ type: 'STOP_RECORDING', transcript: finalTranscript });
      
      attemptManualProcessing(finalTranscript);
      
    } else {
      addDebugInfo("No transcript to process");
      dispatch({ 
        type: 'RECOGNITION_ERROR', 
        message: 'No speech was detected. Please try again and speak clearly.' 
      });
    }
  };
  
  const attemptManualProcessing = (savedTranscript: string) => {
    if (!savedTranscript || !savedTranscript.trim()) {
      addDebugInfo("Cannot process: Empty transcript");
      return false;
    }
    
    addDebugInfo(`Manual processing initiated: ${savedTranscript.substring(0, 30)}...`);
    
    if (environmentInfo.isIOSPwa) {
      addDebugInfo("iOS PWA mode: Using enhanced processing workflow");
      
      dispatch({ type: 'PROCESSING_STARTED', transcript: savedTranscript });
      
      createTimeout(() => {
        if (isMountedRef.current) {
          processTranscriptSafely(savedTranscript, {
            onError: (message) => {
              if (isMountedRef.current) {
                addDebugInfo(`Processing error in iOS PWA: ${message}`);
                dispatch({ type: 'PROCESSING_ERROR', message });
              }
            },
            onProcessingStart: (transcript) => {
              if (isMountedRef.current) {
                addDebugInfo("Started processing transcript in iOS PWA");
              }
            },
            onProcessingComplete: (result) => {
              if (isMountedRef.current) {
                addDebugInfo("Successfully processed transcript in iOS PWA");
                dispatch({ type: 'PROCESSING_COMPLETE', result });
                if (onResultComplete) {
                  onResultComplete(result);
                }
              }
            }
          });
        }
      }, IOS_PWA_SESSION_PAUSE);
    } else {
      onTranscriptComplete(savedTranscript);
      
      processTranscriptSafely(savedTranscript, {
        onError: (message) => {
          if (isMountedRef.current) {
            addDebugInfo(`Processing error: ${message}`);
            dispatch({ type: 'PROCESSING_ERROR', message });
          }
        },
        onProcessingStart: (transcript) => {
          if (isMountedRef.current) {
            addDebugInfo("Started processing transcript");
            dispatch({ type: 'PROCESSING_STARTED', transcript });
          }
        },
        onProcessingComplete: (result) => {
          if (isMountedRef.current) {
            addDebugInfo("Successfully processed transcript");
            dispatch({ type: 'PROCESSING_COMPLETE', result });
            if (onResultComplete) {
              onResultComplete(result);
            }
          }
        }
      });
    }
    
    return true;
  };
  
  const handleForceRetry = () => {
    if (!checkStatus(state.status, ['recording', 'recovering'])) return;
    
    addDebugInfo("Manual retry initiated");
    
    stopListening();
    
    const retryDelay = environmentInfo.isIOSPwa ? 500 : 300;
    
    createTimeout(() => {
      resetTranscript();
      startListening();
      addDebugInfo("Manually restarted recording");
      
      if (environmentInfo.isIOSPwa) {
        createTimeout(() => {
          if (!transcript && !interimTranscript && isMountedRef.current) {
            addDebugInfo("iOS PWA: No transcript after restart, trying again");
            stopListening();
            
            createTimeout(() => {
              if (isMountedRef.current) {
                startListening();
                addDebugInfo("iOS PWA: Second retry attempt");
              }
            }, 600);
          }
        }, 2000);
      }
    }, retryDelay);
  };
  
  const handleReset = () => {
    addDebugInfo("Resetting recorder state");
    dispatch({ type: 'RESET' });
    
    if (isListening) {
      stopListening();
      addDebugInfo("Stopped active listening during reset");
    }
    
    resetTranscript();
    
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    
    if (errorResetTimerRef.current) {
      clearTimeout(errorResetTimerRef.current);
      errorResetTimerRef.current = null;
    }
    
    setTimeout(() => {
      if (retryAttemptsRef.current) {
        retryAttemptsRef.current = 0;
        addDebugInfo("Reset retry counter");
      }
    }, 100);
  };
  
  const PWAGuidance = () => {
    if (!environment.isPwa) return null;
    
    return (
      <div className="mt-3 text-xs border p-2 rounded bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-800">Tips for iOS PWA voice recognition:</h4>
        <ul className="mt-1 text-blue-700 space-y-1 list-disc pl-4">
          <li>Keep recordings under {isIOSBelowV15 ? '5' : '6'} seconds for best results</li>
          <li>Speak clearly with slight pauses between phrases</li>
          <li>If you see your text but get an error, use "Process This Transcript"</li>
          <li>Try recording in a quiet environment with minimal background noise</li>
        </ul>
      </div>
    );
  };
  
  const PlatformSpecificInstructions = () => {
    if (environmentInfo.isIOSPwa) {
      return (
        <div className="text-xs text-amber-600 mt-1">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          <span>
            iOS PWA mode: Keep recording under {isIOSBelowV15 ? 5 : 6} seconds. Speak clearly.
            {checkStatus(state.status, ['recording', 'recovering']) && 
              " If no text appears, tap the restart button."}
          </span>
        </div>
      );
    }
    
    if (environment.isPwa && !environmentInfo.isIOS) {
      return (
        <div className="text-xs text-blue-600 mt-1">
          <span>
            Running in PWA mode. Speak naturally.
          </span>
        </div>
      );
    }
    
    return null;
  };
  
  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="text-center p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Browser Not Supported</AlertTitle>
          <AlertDescription>
            Your browser does not support speech recognition.
            Please try Chrome, Edge, or Safari on desktop for the best experience.
          </AlertDescription>
        </Alert>
        
        <p className="mt-4 text-sm text-gray-500">
          You can still create reminders using the text input option.
        </p>
      </div>
    );
  }
  
  if (permissionState === "denied" || (permissionState === "prompt" && isMobile)) {
    return (
      <div className="space-y-4">
        <Alert variant={permissionState === "denied" ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Microphone Access Required</AlertTitle>
          <AlertDescription>
            {permissionState === "denied" 
              ? "Microphone access was denied. Please enable microphone access in your browser settings and try again."
              : "To record voice reminders, you need to grant microphone access."}
          </AlertDescription>
        </Alert>
        
        <div className="text-center">
          <Button 
            onClick={requestMicrophoneAccess}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Enable Microphone Access
          </Button>
        </div>
      </div>
    );
  }

  const isErrorState = checkStatus(state.status, 'error');
  const errorMessage = getErrorMessage(state);
  const preservedTranscript = isErrorState ? getPreservedTranscript(state) : null;
  
  return (
    <div className="space-y-4">
      {environmentInfo.isIOSPwa && showIOSOptimizedMode && (
        <IOSPwaRecordingMode
          transcript={transcript}
          interimTranscript={interimTranscript}
          startListening={startListening}
          stopListening={stopListening}
          resetTranscript={resetTranscript}
          onTranscriptComplete={onTranscriptComplete}
          showSpecialMode={showIOSOptimizedMode}
          setShowSpecialMode={setShowIOSOptimizedMode}
        />
      )}
      
      {(!environmentInfo.isIOSPwa || !showIOSOptimizedMode) && (
        <>
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Button
                onClick={toggleRecording}
                disabled={
                  checkStatus(state.status, ['processing', 'confirming', 'error']) || 
                  externalProcessing
                }
                size="lg"
                className={cn(
                  "rounded-full h-16 w-16 p-0",
                  checkStatus(state.status, ['recording', 'recovering'])
                    ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                    : "bg-blue-500 hover:bg-blue-600"
                )}
                aria-label={
                  checkStatus(state.status, ['recording', 'recovering']) 
                    ? "Stop recording" 
                    : "Start recording"
                }
              >
                {checkStatus(state.status, ['recording', 'recovering']) 
                  ? <Square className="h-6 w-6" /> 
                  : <Mic className="h-6 w-6" />
                }
              </Button>
            </div>
            
            <div className="font-mono text-lg font-semibold text-gray-700">
              {checkStatus(state.status, ['recording', 'recovering']) && countdown > 0 && (
                <span className={countdown <= 5 ? "text-red-500" : ""}>
                  {Math.floor(countdown / 60).toString().padStart(2, '0')}:
                  {(countdown % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              {checkStatus(state.status, 'idle') && "Tap to start recording"}
              {checkStatus(state.status, 'requesting-permission') && "Requesting microphone access..."}
              {checkStatus(state.status, 'recording') && "Recording... Tap to stop"}
              {checkStatus(state.status, 'recovering') && "Recovering connection..."}
              {checkStatus(state.status, 'processing') && "Processing transcript..."}
              {checkStatus(state.status, 'confirming') && "Confirm your reminder"}
            </div>
            
            {(checkStatus(state.status, ['recording', 'recovering'])) && (
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mx-1"
                  onClick={handleForceRetry}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Restart
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mx-1"
                  onClick={handleStopRecording}
                >
                  <Square className="h-3.5 w-3.5 mr-1" />
                  Stop
                </Button>
              </div>
            )}
            
            <PlatformSpecificInstructions />
          </div>
          
          {!checkStatus(state.status, 'idle') && (
            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Current Transcript</h3>
                {checkStatus(state.status, ['processing', 'error']) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 px-2 text-xs"
                  >
                    Reset
                  </Button>
                )}
              </div>
              
              {checkStatus(state.status, ['recording', 'recovering']) && (
                <ScrollArea className="h-20 w-full rounded">
                  {transcript ? (
                    <p className="text-md">{transcript}</p>
                  ) : (
                    <p className="text-gray-400 italic text-sm">
                      {interimTranscript || "Listening..."}
                    </p>
                  )}
                  {interimTranscript && <span className="text-gray-400 italic">{interimTranscript}</span>}
                </ScrollArea>
              )}
              
              {checkStatus(state.status, 'processing') && (
                <div className="flex items-center justify-center space-x-2 py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="text-blue-500 font-medium">Processing transcript...</span>
                </div>
              )}
              
              {isErrorState && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm">Recognition Error</AlertTitle>
                  <AlertDescription className="text-xs">
                    {errorMessage}
                  </AlertDescription>
                  
                  {preservedTranscript && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <p className="text-xs mb-1 font-medium">Captured before error:</p>
                      <p className="text-xs italic">{preservedTranscript}</p>
                      
                      <Button
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() => {
                          if (preservedTranscript) {
                            attemptManualProcessing(preservedTranscript);
                          }
                        }}
                      >
                        Use This Transcript
                      </Button>
                    </div>
                  )}
                </Alert>
              )}
            </div>
          )}
          
          {environmentInfo.isIOSPwa && <PWAGuidance />}
        </>
      )}
      
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4">
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500 font-mono mb-1">Debug Info</summary>
            <div className="p-2 bg-gray-100 rounded border text-gray-600 font-mono overflow-x-auto">
              <div>
                <strong>Environment:</strong> {environment.browser} on {environment.platform}
                {environment.isPwa ? ' (PWA)' : ''}
              </div>
              <div>
                <strong>iOS PWA:</strong> {environmentInfo.isIOSPwa ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Browser Support:</strong>{' '}
                {browserSupportsSpeechRecognition ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Mic Permission:</strong> {permissionState}
              </div>
              <div>
                <strong>State:</strong> {state.status}
              </div>
              <div>
                <strong>Transcript length:</strong> {transcript.length}
              </div>
              
              <h5 className="mt-2 font-bold">Log:</h5>
              <ScrollArea className="h-40 mt-1">
                <ul>
                  {debugInfo.map((info, i) => (
                    <li key={i} className="odd:bg-gray-100 even:bg-gray-200 px-1">
                      {info}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default EnhancedVoiceRecorderView;
