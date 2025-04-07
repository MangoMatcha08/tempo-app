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
import { checkStatus } from "@/hooks/speech-recognition/statusUtils";

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
      return { status: 'error', message: event.message };
    if (event.type === 'RECOVERY_STARTED')
      return { status: 'recovering' };
  }
  else if (checkStatus(state.status, 'recovering')) {
    if (event.type === 'RECOVERY_COMPLETED')
      return { status: 'recording' };
    if (event.type === 'RECOGNITION_ERROR')
      return { status: 'error', message: event.message };
    if (event.type === 'STOP_RECORDING')
      return { status: 'processing', transcript: event.transcript };
  }
  else if (checkStatus(state.status, 'processing')) {
    if (event.type === 'PROCESSING_COMPLETE') 
      return { status: 'confirming', result: event.result };
    if (event.type === 'PROCESSING_ERROR') 
      return { status: 'error', message: event.message };
  }
  else if (checkStatus(state.status, 'confirming')) {
    if (event.type === 'RESET') 
      return { status: 'idle' };
  }
  else if (checkStatus(state.status, 'error')) {
    if (event.type === 'RESET') 
      return { status: 'idle' };
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
    if (checkStatus(state.status, 'error')) {
      addDebugInfo("Setting up auto-reset for error state (8 seconds)");
      
      if (errorResetTimerRef.current) {
        clearTimeout(errorResetTimerRef.current);
      }
      
      errorResetTimerRef.current = setTimeout(() => {
        console.log("Auto-reset triggered from error state");
        addDebugInfo("Auto-reset triggered from error state");
        dispatch({ type: 'RESET' });
      }, 8000);
      
      return () => {
        if (errorResetTimerRef.current) {
          clearTimeout(errorResetTimerRef.current);
          errorResetTimerRef.current = null;
        }
      };
    }
  }, [state.status]);

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
        message: recognitionError 
      });
    }
  }, [recognitionError, state.status]);
  
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
  };
  
  const setupCountdown = () => {
    const maxRecordingTime = environmentInfo.isIOSPwa ? 25 : 30;
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
    
    // Give the browser a moment to release resources
    setTimeout(() => {
      if (retryAttemptsRef.current) {
        retryAttemptsRef.current = 0;
        addDebugInfo("Reset retry counter");
      }
    }, 100);
  };
  
  const PlatformSpecificInstructions = () => {
    if (environmentInfo.isIOSPwa) {
      return (
        <div className="text-xs text-amber-600 mt-1">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          <span>
            iOS PWA recording mode: Speak clearly with pauses between sentences.
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

  // Add auto-reset functionality for error states
  useEffect(() => {
    // Only set up auto-reset when in error state
    if (checkStatus(state.status, 'error') && 'message' in state) {
      // Determine if this is a recoverable error
      const isRecoverableError = 
        state.message.includes('no speech') || 
        state.message.includes('network') || 
        state.message.includes('aborted') ||
        state.message.includes('Connection issue');
      
      // Auto-reset for recoverable errors after delay (helpful for iOS PWA)
      if (isRecoverableError) {
        console.log('Setting up auto-reset for recoverable error');
        addDebugInfo(`Scheduling auto-reset for recoverable error: ${state.message}`);
        
        // Use tracked timeout to ensure proper cleanup
        const timeoutDuration = environmentInfo?.isIOSPwa ? 4000 : 6000;
        createTimeout(() => {
          console.log('Auto-resetting after recoverable error');
          addDebugInfo('Auto-reset triggered after error');
          dispatch({ type: 'RESET' });
        }, timeoutDuration);
      }
    }
  }, [state.status, createTimeout, dispatch, environmentInfo?.isIOSPwa]);

  return (
    <div className="space-y-4">
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
        
        <div className="text-sm">
          {checkStatus(state.status, ['recording', 'recovering']) ? (
            <div className="text-red-500 font-semibold">
              {checkStatus(state.status, 'recovering')
                ? "Reconnecting..." 
                : (
                  <div>
                    <span>Recording... {countdown}s</span>
                    {environmentInfo.isIOSPwa && (
                      <div className="text-xs mt-1 flex items-center">
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></span>
                        <span>iOS mode: Short recordings work best</span>
                      </div>
                    )}
                  </div>
                )
              }
            </div>
          ) : checkStatus(state.status, 'processing') ? (
            <div className="text-green-500 font-semibold flex items-center justify-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing your voice note...
            </div>
          ) : checkStatus(state.status, 'confirming') ? (
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
         checkStatus(state.status, ['recording', 'recovering']) && (
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleForceRetry}
              className="text-xs flex items-center gap-1"
              disabled={checkStatus(state.status, 'recovering')}
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
            {checkStatus(state.status, 'processing') && 'transcript' in state ? (
              <p>{state.transcript}</p>
            ) : checkStatus(state.status, 'confirming') && 'result' in state ? (
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
      
      {checkStatus(state.status, 'error') && 'message' in state && (
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
                {environmentInfo.isIOSPwa && " iOS PWA has the most limitations."}
              </p>
            )}
            
            {/* Add auto-reset notification for recoverable errors */}
            {(state.message.includes('no speech') || 
              state.message.includes('network') || 
              state.message.includes('aborted') ||
              state.message.includes('Connection issue')) && (
              <p className="text-xs mt-1 text-green-600">
                <RefreshCw className="h-3 w-3 inline-block animate-spin mr-1" />
                Recovery will happen automatically in a few seconds...
              </p>
            )}
          </AlertDescription>
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="flex-1 bg-white hover:bg-gray-50"
            >
              Try Again Now
            </Button>
          </div>
        </Alert>
      )}
      
      {(checkStatus(state.status, 'processing') || checkStatus(state.status, 'confirming')) && environmentInfo.isPwa && (
        <div className="mt-4 p-3 border border-amber-200 bg-amber-50 rounded-md">
          <h3 className="font-medium text-amber-800">Voice Processing Status</h3>
          <p className="text-sm text-amber-700 mt-1">
            {checkStatus(state.status, 'processing')
              ? "Processing your voice input... This may take a moment."
              : "Voice processing complete. If the confirmation screen doesn't appear automatically, please use the buttons below."}
          </p>
          
          {checkStatus(state.status, 'processing') && (
            <div className="mt-2 relative pt-1">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-amber-200">
                <div className="w-full animate-pulse bg-amber-500"></div>
              </div>
            </div>
          )}
          
          {checkStatus(state.status, 'confirming') && 'result' in state && (
            <div className="mt-2 flex space-x-2">
              <Button 
                onClick={() => onResultComplete && onResultComplete(state.result)}
                className="flex-1"
                size="sm"
              >
                Use Results
              </Button>
              <Button 
                onClick={() => dispatch({ type: 'RESET' })}
                className="flex-1"
                variant="outline"
                size="sm"
              >
                Start Over
              </Button>
            </div>
          )}
        </div>
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
