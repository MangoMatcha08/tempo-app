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
  
  const [showSpecialMode, setShowSpecialMode] = useState(true);
  
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
  
  const IOSPwaRecordingMode = () => {
    if (!environmentInfo.isIOSPwa) return null;
    
    const [capturedTranscript, setCapturedTranscript] = useState("");
    const [isCapturing, setIsCapturing] = useState(false);
    const [recordingCountdown, setRecordingCountdown] = useState(4);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    
    const handleIOSRecording = () => {
      resetTranscript();
      setCapturedTranscript("");
      
      setIsCapturing(true);
      startListening();
      
      setRecordingCountdown(4);
      if (countdownRef.current) clearInterval(countdownRef.current);
      
      countdownRef.current = setInterval(() => {
        setRecordingCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            stopListening();
            setIsCapturing(false);
            
            const finalTranscript = transcript || interimTranscript;
            if (finalTranscript) {
              setCapturedTranscript(finalTranscript);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };
    
    const processTranscript = () => {
      if (!capturedTranscript) return;
      
      onTranscriptComplete(capturedTranscript);
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
          
          <div className="p-2 bg-white rounded border border-blue-200">
            <h4 className="text-sm font-medium text-blue-700">Step 2: Process Transcript</h4>
            
            {capturedTranscript ? (
              <>
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                  <p className="italic text-gray-700">{capturedTranscript}</p>
                </div>
                
                <Button
                  onClick={processTranscript}
                  className="w-full mt-2 bg-green-100 hover:bg-green-200 text-green-800 border border-green-300"
                >
                  Process This Transcript
                </Button>
              </>
            ) : (
              <p className="text-sm text-gray-500 mt-2 italic">
                Complete Step 1 to capture a transcript
              </p>
            )}
          </div>
        </div>
      </div>
    );
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
      {environmentInfo.isIOSPwa && showSpecialMode && (
        <IOSPwaRecordingMode />
      )}
      
      {(!environmentInfo.isIOSPwa || !showSpecialMode) && (
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
            
            <div className="text-sm">
              {checkStatus(state.status, ['recording', 'recovering']) ? (
                <div className="text-red-500 font-semibold">
                  {checkStatus(state.status, 'recovering')
                    ? "Reconnecting..." 
                    : (
                      <div>
                        <span>Recording... {countdown}s</span>
                        {environmentInfo.isIOSPwa && (
                          <div className="mt-1 flex flex-col items-center">
                            <div className="w-full h-1.5 bg-red-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-500 transition-all duration-1000 ease-linear" 
                                style={{ 
                                  width: `${Math.min(100, (countdown > 0 ? (1 - countdown/(isIOSBelowV15 ? 5 : 6)) * 100 : 100))}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-xs mt-1">
                              {isIOSBelowV15 ? 'Keep under 5 sec' : 'Keep under 6 sec'}
                            </span>
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
        </>
      )}
      
      {checkStatus(state.status, 'error') && (
        <Alert 
          variant="default" 
          className="text-sm border-yellow-500 bg-yellow-50"
        >
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-700">Recognition Error</AlertTitle>
          <AlertDescription className="text-yellow-600">
            {getErrorMessage(state)}
            {environment.isPwa && (
              <p className="text-xs mt-1">
                PWA mode may have limited speech recognition capabilities.
                {environmentInfo.isIOSPwa && " iOS PWA has the most limitations."}
              </p>
            )}
            
            {(getErrorMessage(state).includes('no speech') || 
              getErrorMessage(state).includes('network') || 
              getErrorMessage(state).includes('aborted') ||
              getErrorMessage(state).includes('Connection issue')) && (
              <p className="text-xs mt-1 text-green-600 flex items-center">
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                <span>Auto-recovering soon...</span>
              </p>
            )}
          </AlertDescription>
          
          {preservedTranscript && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-xs text-green-700 font-medium">Transcript was captured before the error:</p>
              <p className="text-xs text-green-800 mt-1 italic">{preservedTranscript.substring(0, 100)}{preservedTranscript.length > 100 ? '...' : ''}</p>
              <Button
                size="sm"
                onClick={() => attemptManualProcessing(preservedTranscript)}
                className="w-full mt-2 bg-green-100 text-green-800 hover:bg-green-200 border border-green-300"
              >
                Process This Transcript
              </Button>
            </div>
          )}
          
          <div className="mt-3 flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              Try Again
            </Button>
            
            {environmentInfo.isIOSPwa && (
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  handleReset();
                  setTimeout(() => toggleRecording(), 300);
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                New Short Recording
              </Button>
            )}
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
      
      {environmentInfo.isIOSPwa && <PWAGuidance />}
      
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
              <div>iOS version: {iosVersion ? `${iosVersion.major}.${iosVersion.minor}` : "Unknown"}</div>
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
        <p>Recording will automatically stop after {environmentInfo.isIOSPwa ? (isIOSBelowV15 ? 5 : 6) : 30} seconds.</p>
        {environmentInfo.isIOSPwa && (
          <p className="text-xs mt-1 text-amber-600 font-medium">
            iOS PWA mode: Keep recordings short (under 6 seconds) for best results
          </p>
        )}
      </div>
    </div>
  );
};

export default EnhancedVoiceRecorderView;
