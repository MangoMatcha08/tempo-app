
import React, { useState, useEffect, useReducer, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, AlertCircle, RefreshCw, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useEnhancedSpeechRecognition } from "@/hooks/speech-recognition";
import { useTrackedTimeouts } from "@/hooks/use-tracked-timeouts";
import { processTranscriptSafely } from "@/hooks/speech-recognition/errorHandlers";
import { useIsMobile } from "@/hooks/use-mobile";
import { getEnvironmentDescription, detectEnvironment } from "@/hooks/speech-recognition/environmentDetection";
import { VoiceProcessingResult } from "@/types/reminderTypes";

type RecorderState = 
  | { status: 'idle' }
  | { status: 'requesting-permission' }
  | { status: 'recording' }
  | { status: 'recovering' }
  | { status: 'processing', transcript: string }
  | { status: 'confirming', result: VoiceProcessingResult }
  | { status: 'error', message: string };

type RecorderEvent =
  | { type: 'START_RECORDING' }
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'PERMISSION_DENIED', message: string }
  | { type: 'STOP_RECORDING', transcript: string }
  | { type: 'RECOVERY_STARTED' }
  | { type: 'RECOVERY_COMPLETED' }
  | { type: 'RECOGNITION_ERROR', message: string }
  | { type: 'PROCESSING_STARTED', transcript: string }
  | { type: 'PROCESSING_COMPLETE', result: VoiceProcessingResult }
  | { type: 'PROCESSING_ERROR', message: string }
  | { type: 'RESET' };

// Type guard for recording/recovering states
const isRecordingOrRecovering = (status: RecorderState['status']): boolean => {
  return status === 'recording' || status === 'recovering';
};

function voiceRecorderReducer(state: RecorderState, event: RecorderEvent): RecorderState {
  console.log(`Voice recorder state transition: ${state.status} + ${event.type}`);
  
  switch (state.status) {
    case 'idle':
      if (event.type === 'START_RECORDING') 
        return { status: 'requesting-permission' };
      break;
      
    case 'requesting-permission':
      if (event.type === 'PERMISSION_GRANTED') 
        return { status: 'recording' };
      if (event.type === 'PERMISSION_DENIED') 
        return { status: 'error', message: event.message };
      break;
      
    case 'recording':
      if (event.type === 'STOP_RECORDING') 
        return { status: 'processing', transcript: event.transcript };
      if (event.type === 'RECOGNITION_ERROR') 
        return { status: 'error', message: event.message };
      if (event.type === 'RECOVERY_STARTED')
        return { status: 'recovering' };
      break;
      
    case 'recovering':
      if (event.type === 'RECOVERY_COMPLETED')
        return { status: 'recording' };
      if (event.type === 'RECOGNITION_ERROR')
        return { status: 'error', message: event.message };
      if (event.type === 'STOP_RECORDING')
        return { status: 'processing', transcript: event.transcript };
      break;
      
    case 'processing':
      if (event.type === 'PROCESSING_COMPLETE') 
        return { status: 'confirming', result: event.result };
      if (event.type === 'PROCESSING_ERROR') 
        return { status: 'error', message: event.message };
      break;
      
    case 'confirming':
      if (event.type === 'RESET') 
        return { status: 'idle' };
      break;
      
    case 'error':
      if (event.type === 'RESET') 
        return { status: 'idle' };
      break;
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
  
  const retryAttemptsRef = useRef<number>(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupActionsRef = useRef<Array<() => void>>([]);
  
  const { 
    createTimeout, 
    clearTrackedTimeout, 
    clearAllTimeouts,
    createInterval,
    runIfMounted 
  } = useTrackedTimeouts();
  
  const [processingResult, setProcessingResult] = useState<VoiceProcessingResult | null>(null);
  const [fallbackNeeded, setFallbackNeeded] = useState(false);
  
  // Define memory logging function outside of conditional code
  const logMemoryUsage = () => {
    if (window.performance && typeof (window.performance as any).memory !== 'undefined') {
      const memory = (window.performance as any).memory;
      addDebugInfo(`Memory: ${Math.round(memory.usedJSHeapSize / 1048576)}MB / ${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`);
    }
  };
  
  // Always define these functions at the component top level
  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };
  
  const registerCleanupAction = (cleanupFn: () => void) => {
    cleanupActionsRef.current.push(cleanupFn);
  };
  
  const executeCleanupActions = () => {
    addDebugInfo(`Executing ${cleanupActionsRef.current.length} cleanup actions`);
    cleanupActionsRef.current.forEach(action => {
      try {
        action();
      } catch (err) {
        console.error('Error in cleanup action:', err);
      }
    });
    cleanupActionsRef.current = [];
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
            
            if (permissionResult.state === 'granted' && state.status === 'requesting-permission') {
              dispatch({ type: 'PERMISSION_GRANTED' });
              startRecording();
            } else if (permissionResult.state === 'denied' && state.status === 'requesting-permission') {
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
    
    if (navigator.permissions && 'addEventListener' in EventTarget.prototype) {
      const cleanupPermissionListeners = () => {
        addDebugInfo("Cleaned up permission event listeners");
      };
      
      registerCleanupAction(cleanupPermissionListeners);
    }
  }, [state.status]);
  
  useEffect(() => {
    let isMounted = true;
    
    addDebugInfo("Component mounted, setting up resource tracking");
    
    registerCleanupAction(() => {
      isMounted = false;
      addDebugInfo("Component unmount flag set");
    });
    
    const platformSpecificCleanup = () => {
      addDebugInfo(`Running platform-specific cleanup: isPWA=${environment.isPwa}, isIOSPwa=${environmentInfo.isIOSPwa}`);
      
      if (environmentInfo.isIOSPwa) {
        addDebugInfo("iOS PWA detected: performing aggressive resource cleanup");
        
        if (window.performance && typeof (window.performance as any).memory !== 'undefined') {
          addDebugInfo("Suggesting memory cleanup to browser");
        }
        
        const taskCleanupIds = [];
        for (let i = 0; i < 10; i++) {
          taskCleanupIds.push(setTimeout(() => {}, 0));
        }
        taskCleanupIds.forEach(id => clearTimeout(id));
        
        addDebugInfo(`Cleared potential task queue (IDs: ${taskCleanupIds.join(', ')})`);
      }
      
      if (environment.isPwa) {
        addDebugInfo("PWA-specific cleanup completed");
      }
    };
    
    return () => {
      addDebugInfo("Component unmounting - starting cleanup process");
      
      clearAllTimeouts();
      addDebugInfo("Cleared all tracked timeouts");
      
      if (isListening) {
        try {
          stopListening();
          addDebugInfo("Stopped active listening");
        } catch (err) {
          console.error("Error stopping listening during cleanup:", err);
          addDebugInfo(`Error stopping listening: ${err}`);
          
          if (environment.isPwa) {
            try {
              addDebugInfo("Additional PWA cleanup attempt for speech recognition");
            } catch (innerErr) {
              addDebugInfo(`Failed additional cleanup: ${innerErr}`);
            }
          }
        }
      }
      
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
        addDebugInfo("Cleared recording timer");
      }
      
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        addDebugInfo("Cleared countdown timer");
      }
      
      if (processingTimerRef.current) {
        clearTimeout(processingTimerRef.current);
        processingTimerRef.current = null;
        addDebugInfo("Cleared processing timer");
      }
      
      platformSpecificCleanup();
      
      executeCleanupActions();
      
      addDebugInfo("Cleanup complete");
    };
  }, [
    isListening, 
    stopListening, 
    clearAllTimeouts, 
    environment.isPwa, 
    environmentInfo.isIOSPwa
  ]);
  
  useEffect(() => {
    if (recognitionRecovering && state.status === 'recording') {
      dispatch({ type: 'RECOVERY_STARTED' });
      addDebugInfo("Recognition is recovering");
      
      registerCleanupAction(() => {
        if (state.status === 'recovering') {
          addDebugInfo("Cleaning up from recovery state");
        }
      });
    }
  }, [recognitionRecovering, state.status]);
  
  useEffect(() => {
    if (recognitionError && (state.status === 'recording' || state.status === 'recovering')) {
      addDebugInfo(`Recognition error: ${recognitionError}`);
      dispatch({ 
        type: 'RECOGNITION_ERROR', 
        message: recognitionError 
      });
    }
  }, [recognitionError, state.status]);
  
  // Effects for memory logging (always declared, conditionally executed)
  useEffect(() => {
    if (environment.isPwa && process.env.NODE_ENV === 'development') {
      logMemoryUsage();
      const memoryInterval = setInterval(logMemoryUsage, 10000);
      
      return () => {
        clearInterval(memoryInterval);
        addDebugInfo("Cleared memory logging interval");
      };
    }
    // This is an empty useEffect when not in PWA dev mode
    return undefined;
  }, [environment.isPwa]);
  
  useEffect(() => {
    if ((environment.isPwa || environmentInfo.isIOSPwa) && 
        state.status === 'processing' && 
        'transcript' in state) {
      
      addDebugInfo("Setting up fallback timer for PWA processing state");
      
      processingTimerRef.current = setTimeout(() => {
        if (state.status === 'processing' && 'transcript' in state) {
          addDebugInfo("Setting fallback needed flag due to stuck processing state");
          setFallbackNeeded(true);
        }
      }, environmentInfo.isIOSPwa ? 5000 : 3000);
      
      registerCleanupAction(() => {
        if (processingTimerRef.current) {
          clearTimeout(processingTimerRef.current);
          processingTimerRef.current = null;
          addDebugInfo("Cleaned up processing timer from dedicated effect");
        }
      });
      
      return () => {
        if (processingTimerRef.current) {
          clearTimeout(processingTimerRef.current);
          processingTimerRef.current = null;
          addDebugInfo("Cleaned up processing timer in effect cleanup");
        }
      };
    }
    
    if (state.status !== 'processing' && fallbackNeeded) {
      setFallbackNeeded(false);
    }
    
    // Always return a cleanup function even when conditions aren't met
    return () => {};
  }, [state.status, environment.isPwa, environmentInfo.isIOSPwa, fallbackNeeded]);
  
  const requestMicrophoneAccess = async () => {
    addDebugInfo("Requesting microphone access explicitly");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionState("granted");
      addDebugInfo("Microphone access granted");
      
      if (state.status === 'requesting-permission') {
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
  };
  
  const setupCountdown = () => {
    const maxRecordingTime = environmentInfo.isIOSPwa ? 25 : 30;
    setCountdown(maxRecordingTime);
    
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
    }
    
    recordingTimerRef.current = setTimeout(() => {
      // Use our type guard function instead of direct comparison
      if (isRecordingOrRecovering(state.status)) {
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
  
  const toggleRecording = async () => {
    // Use our type guard function instead of direct comparison
    if (isRecordingOrRecovering(state.status)) {
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
      
      onTranscriptComplete(finalTranscript);
      
      if (environmentInfo.isIOSPwa) {
        addDebugInfo("iOS PWA mode: Using enhanced processing workflow");
        
        dispatch({ type: 'PROCESSING_STARTED', transcript: finalTranscript });
        
        createTimeout(() => {
          processTranscriptSafely(finalTranscript, {
            onError: (message) => {
              addDebugInfo(`Processing error in iOS PWA: ${message}`);
              dispatch({ type: 'PROCESSING_ERROR', message });
            },
            onProcessingStart: (transcript) => {
              addDebugInfo("Started processing transcript in iOS PWA");
            },
            onProcessingComplete: (result) => {
              addDebugInfo("Successfully processed transcript in iOS PWA");
              dispatch({ type: 'PROCESSING_COMPLETE', result });
              if (onResultComplete) {
                onResultComplete(result);
              }
            }
          });
        }, 300);
      } else {
        processTranscriptSafely(finalTranscript, {
          onError: (message) => {
            addDebugInfo(`Processing error: ${message}`);
            dispatch({ type: 'PROCESSING_ERROR', message });
          },
          onProcessingStart: (transcript) => {
            addDebugInfo("Started processing transcript");
            dispatch({ type: 'PROCESSING_STARTED', transcript });
          },
          onProcessingComplete: (result) => {
            addDebugInfo("Successfully processed transcript");
            dispatch({ type: 'PROCESSING_COMPLETE', result });
            if (onResultComplete) {
              onResultComplete(result);
            }
          }
        });
      }
    } else {
      addDebugInfo("No transcript to process");
      dispatch({ 
        type: 'RECOGNITION_ERROR', 
        message: 'No speech was detected. Please try again and speak clearly.' 
      });
    }
  };
  
  const handleForceRetry = () => {
    // Use our type guard function instead of direct comparison
    if (!isRecordingOrRecovering(state.status)) return;
    
    addDebugInfo("Manual retry initiated");
    
    stopListening();
    
    const retryDelay = environmentInfo.isIOSPwa ? 500 : 300;
    
    createTimeout(() => {
      resetTranscript();
      startListening();
      addDebugInfo("Manually restarted recording");
      
      if (environmentInfo.isIOSPwa) {
        createTimeout(() => {
          if (!transcript && !interimTranscript) {
            addDebugInfo("iOS PWA: No transcript after restart, trying again");
            stopListening();
            
            createTimeout(() => {
              startListening();
              addDebugInfo("iOS PWA: Second retry attempt");
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
    }
    
    resetTranscript();
    retryAttemptsRef.current = 0;
    
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };
  
  const handleManualContinue = () => {
    addDebugInfo("Manual continue triggered by user");
    
    if (state.status === 'processing' && 'transcript' in state) {
      const transcript = state.transcript;
      
      processTranscriptSafely(transcript, {
        onError: (message) => {
          addDebugInfo(`Processing error in fallback: ${message}`);
          dispatch({ type: 'PROCESSING_ERROR', message });
        },
        onProcessingStart: (transcript) => {
          addDebugInfo("Started processing transcript in fallback");
        },
        onProcessingComplete: (result) => {
          addDebugInfo("Successfully processed transcript in fallback");
          setProcessingResult(result);
          dispatch({ type: 'PROCESSING_COMPLETE', result });
          if (onResultComplete) {
            onResultComplete(result);
          }
        }
      });
    }
  };
  
  const PlatformSpecificInstructions = () => {
    if (environmentInfo.isIOSPwa) {
      return (
        <div className="text-xs text-amber-600 mt-1">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          <span>
            iOS PWA recording mode: Speak clearly with pauses between sentences.
            {isRecordingOrRecovering(state.status) && 
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
  
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <Button
            onClick={toggleRecording}
            disabled={
              state.status === 'processing' || 
              state.status === 'confirming' || 
              externalProcessing
            }
            size="lg"
            className={cn(
              "rounded-full h-16 w-16 p-0",
              isRecordingOrRecovering(state.status)
                ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                : "bg-blue-500 hover:bg-blue-600"
            )}
            aria-label={
              isRecordingOrRecovering(state.status) 
                ? "Stop recording" 
                : "Start recording"
            }
          >
            {isRecordingOrRecovering(state.status) 
              ? <Square className="h-6 w-6" /> 
              : <Mic className="h-6 w-6" />
            }
          </Button>
        </div>
        
        <div className="text-sm">
          {isRecordingOrRecovering(state.status) ? (
            <div className="text-red-500 font-semibold">
              {state.status === 'recovering' 
                ? "Reconnecting..." 
                : `Recording... ${countdown}s`
              }
            </div>
          ) : state.status === 'processing' ? (
            <div className="text-green-500 font-semibold flex items-center justify-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing your voice note...
            </div>
          ) : state.status === 'confirming' ? (
            <div className="text-green-500 font-semibold">
              Ready to save your voice note
            </div>
          ) : (
            <div>
              {permissionState === "granted" 
                ? "Press to start recording" 
                : "Press to request microphone access and start recording"}
            </div>
          )}
        </div>
        
        <PlatformSpecificInstructions />
        
        {(environmentInfo.isIOSPwa || environmentInfo.isPwa) && 
         isRecordingOrRecovering(state.status) && (
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleForceRetry}
              className="text-xs flex items-center gap-1"
              disabled={state.status === 'recovering'}
            >
              <RefreshCw className="h-3 w-3" />
              Restart Recording
            </Button>
            
            <p className="text-xs text-muted-foreground mt-1">
              If no text appears, try restarting the recording
            </p>
          </div>
        )}
      </div>
      
      <div className="border rounded-md p-3 bg-slate-50">
        <h3 className="font-medium mb-2 text-sm">Your voice input:</h3>
        <ScrollArea className="h-[100px] overflow-y-auto">
          <div className="whitespace-pre-wrap overflow-hidden">
            {state.status === 'processing' && 'transcript' in state ? (
              <p>{state.transcript}</p>
            ) : state.status === 'confirming' && 'result' in state ? (
              <p>{state.result.reminder.description}</p>
            ) : transcript ? (
              <p>{transcript}</p>
            ) : (
              <p className="text-muted-foreground italic">
                {interimTranscript || "Speak after pressing the record button..."}
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {(environment.isPwa || environmentInfo.isIOSPwa) && 
       state.status === 'processing' && 
       'transcript' in state &&
       fallbackNeeded && (
        <div className="border-2 border-amber-400 bg-amber-50 rounded-md p-4 mt-3 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <h3 className="font-medium text-amber-700">
              {environmentInfo.isIOSPwa ? "iOS PWA Mode" : "PWA Mode"} - Continue Manually
            </h3>
          </div>
          
          <p className="text-sm text-amber-700 mb-3">
            It seems the automatic process is taking longer than expected.
            You can continue manually to review your voice note.
          </p>
          
          <div className="flex justify-center">
            <Button 
              onClick={handleManualContinue} 
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Continue to Review <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {state.status === 'error' && 'message' in state && (
        <Alert 
          variant="default" 
          className="text-sm border-yellow-500 bg-yellow-50"
        >
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-700">Recognition Error</AlertTitle>
          <AlertDescription className="text-yellow-600">
            {state.message}
            {environment.isPwa && (
              <p className="text-xs mt-1">
                PWA mode may have limited speech recognition capabilities.
                Try using the restart button if needed.
              </p>
            )}
          </AlertDescription>
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
            >
              Try Again
            </Button>
          </div>
        </Alert>
      )}
      
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs text-gray-500 border rounded p-2">
          <summary>Debug Info</summary>
          <ScrollArea className="h-[100px] mt-2">
            <div className="space-y-1">
              <div>Recognition active: {isListening ? "Yes" : "No"}</div>
              <div>Recording state: {state.status}</div>
              <div>Is processing: {externalProcessing ? "Yes" : "No"}</div>
              <div>Permission state: {permissionState}</div>
              <div>Is mobile device: {isMobile ? "Yes" : "No"}</div>
              <div>Is PWA mode: {environment.isPwa ? "Yes" : "No"}</div>
              <div>Is iOS PWA: {environmentInfo.isIOSPwa ? "Yes" : "No"}</div>
              <div>Environment: {environment.description}</div>
              <div>Platform: {environment.platform}</div>
              <div>Browser: {environment.browser}</div>
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
        <p>Recording will automatically stop after {environmentInfo.isIOSPwa ? 25 : 30} seconds.</p>
        {environment.isPwa && (
          <p className="text-xs mt-1 text-amber-600">
            Running in PWA mode: If recognition doesn't work, try closing and reopening the app.
          </p>
        )}
      </div>
    </div>
  );
};

export default EnhancedVoiceRecorderView;
