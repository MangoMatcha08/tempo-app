
import { useState, useEffect, useRef, useCallback } from "react";
import { VoiceProcessingResult, ReminderPriority, ReminderCategory } from "@/types/reminderTypes";
import { generateMeaningfulTitle } from "@/utils/voiceReminderUtils";
import { processVoiceInput } from "@/services/nlp";
import { useToast } from "@/hooks/use-toast";

// Define view states for our state machine
type ViewState = 'idle' | 'recording' | 'processing' | 'confirming';

// Environment properties that affect state transitions
interface VoiceRecorderEnvironment {
  isPwa: boolean;
  isIOS: boolean;
  isIOSPwa: boolean;
  isSafari?: boolean;
  isMobile?: boolean;
  platform?: string;
  browser?: string;
}

export function useVoiceRecorderState(
  onOpenChange: (open: boolean) => void,
  environment?: VoiceRecorderEnvironment
) {
  // Environment defaults if not provided
  const env: VoiceRecorderEnvironment = environment || {
    isPwa: false,
    isIOS: false,
    isIOSPwa: false
  };

  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<"record" | "confirm">("record");
  const [processingResult, setProcessingResult] = useState<VoiceProcessingResult | null>(null);
  const [priority, setPriority] = useState<ReminderPriority>(ReminderPriority.MEDIUM);
  const [category, setCategory] = useState<ReminderCategory>(ReminderCategory.TASK);
  const [periodId, setPeriodId] = useState<string>("none");
  const [viewState, setViewState] = useState<ViewState>('idle');
  const { toast } = useToast();
  
  // Logging system
  const debugLogsRef = useRef<Array<{
    timestamp: number;
    message: string;
    data?: any;
  }>>([]);
  
  // Helper function for logging with timestamps
  const logDebug = useCallback((message: string, data?: any) => {
    const log = {
      timestamp: Date.now(),
      message,
      data
    };
    
    console.log(`[VoiceRecorder ${new Date().toISOString().slice(11, 23)}]`, message, data || '');
    debugLogsRef.current.push(log);
    
    // Keep log size manageable (last 100 entries)
    if (debugLogsRef.current.length > 100) {
      debugLogsRef.current.shift();
    }
  }, []);
  
  // Log environment information once
  useEffect(() => {
    // Detect environment
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isPwa = window.matchMedia('(display-mode: standalone)').matches || 
                 (window.navigator as any).standalone === true;
    const isIOSPwa = isPwa && isIOS;
    
    logDebug('Environment initialized', { 
      isPwa, 
      isIOS, 
      isIOSPwa,
      userAgent: userAgent.substring(0, 100),
      screenWidth: window.innerWidth,
      platform: navigator.platform,
      viewportHeight: window.innerHeight,
      providedEnvironment: env
    });
    
    logDebug('Initial state', {
      view,
      viewState,
      isProcessing,
      hasTranscript: Boolean(transcript),
      hasResult: Boolean(processingResult)
    });
  }, [logDebug, view, viewState, isProcessing, transcript, processingResult, env]);
  
  const isConfirmingRef = useRef(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true); // Track component mount state
  
  // Set isMountedRef to false when component unmounts
  useEffect(() => {
    isMountedRef.current = true;
    logDebug('Component mounted');
    
    return () => {
      isMountedRef.current = false;
      
      // Clean up any pending timers
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
        logDebug('Unmount: cleared transition timer');
      }
      
      logDebug('Component unmounted');
      
      // Dump full debug log to console on unmount for easier debugging
      console.table(debugLogsRef.current);
    };
  }, [logDebug]);
  
  const resetState = useCallback(() => {
    logDebug("Reset state called", { currentView: view, currentViewState: viewState });
    
    if (!isConfirmingRef.current || viewState === 'idle') {
      // Clear any pending timers first
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
        logDebug('Reset: cleared transition timer');
      }
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setTitle("");
        setTranscript("");
        setIsProcessing(false);
        setView("record");
        setProcessingResult(null);
        setPriority(ReminderPriority.MEDIUM);
        setCategory(ReminderCategory.TASK);
        setPeriodId("none");
        setViewState('idle');
        isConfirmingRef.current = false;
        
        logDebug('State reset completed');
      } else {
        logDebug('Reset requested but component is unmounted');
      }
    } else {
      logDebug('Reset suppressed - currently confirming', { isConfirmingRef: isConfirmingRef.current });
    }
  }, [view, viewState, logDebug]);
  
  // Apply safe transition with platform-specific delays
  const safePlatformTransition = useCallback((callback: () => void, baseDelay: number = 0) => {
    // PWA environments, especially iOS PWA, need slightly longer delays for reliable state transitions
    const delayMs = env.isIOSPwa ? Math.max(baseDelay, 300) : 
                    env.isPwa ? Math.max(baseDelay, 200) : 
                    baseDelay;
                   
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    
    // Only proceed if the component is still mounted
    if (isMountedRef.current) {
      if (delayMs > 0) {
        logDebug(`Scheduling transition with ${delayMs}ms delay (isPwa: ${env.isPwa}, isIOSPwa: ${env.isIOSPwa})`);
        
        transitionTimerRef.current = setTimeout(() => {
          // Double-check mounting status before executing
          if (isMountedRef.current) {
            callback();
          } else {
            logDebug('Cancelled transition - component unmounted during delay');
          }
          transitionTimerRef.current = null;
        }, delayMs);
      } else {
        // Execute immediately if no delay needed
        callback();
      }
    } else {
      logDebug('Transition blocked - component unmounted');
    }
  }, [env.isPwa, env.isIOSPwa, logDebug]);
  
  const transitionToConfirmView = useCallback(() => {
    if (viewState === 'processing' && isMountedRef.current) {
      logDebug("Transitioning from processing to confirming");
      
      // Use platform-specific safe transition
      safePlatformTransition(() => {
        if (isMountedRef.current) {
          logDebug("Executing transition to confirm view");
          setViewState('confirming');
          setView('confirm');
          
          // In problematic environments, do an additional state update to force refresh
          if (env.isIOSPwa) {
            setTimeout(() => {
              if (isMountedRef.current) {
                logDebug("Forced additional state refresh for iOS PWA");
                setIsProcessing(false); // Ensure processing is definitely false
              }
            }, 100);
          }
        }
      }, env.isIOSPwa ? 250 : 50);
    } else {
      logDebug("Transition blocked", { viewState, isMounted: isMountedRef.current });
    }
  }, [viewState, env.isIOSPwa, safePlatformTransition, logDebug]);
  
  const handleTranscriptComplete = useCallback((text: string) => {
    logDebug("Transcript complete called", { 
      textLength: text?.length || 0, 
      textPreview: text?.substring(0, 20),
      environment: {
        isPwa: env.isPwa,
        isIOS: env.isIOS,
        isIOSPwa: env.isIOSPwa
      }
    });
    
    if (!text || !text.trim() || !isMountedRef.current) {
      logDebug("Empty transcript received or component unmounted, not processing", { 
        isEmpty: !text || !text.trim(), 
        isMounted: isMountedRef.current 
      });
      return;
    }
    
    isConfirmingRef.current = true;
    logDebug('Setting isConfirmingRef to true');
    
    setTranscript(text);
    setIsProcessing(true);
    setViewState('processing');
    logDebug('State updated to processing', { newTranscriptLength: text.length });
    
    try {
      logDebug("Processing voice input", { textPreview: text.substring(0, 30) });
      const result = processVoiceInput(text);
      logDebug("NLP processing result", { 
        category: result.reminder.category,
        priority: result.reminder.priority,
        hasDate: Boolean(result.reminder.dueDate),
        confidence: result.confidence
      });
      
      // Check if component still mounted before continuing
      if (!isMountedRef.current) {
        logDebug("Component unmounted during processing, aborting");
        return;
      }
      
      const generatedTitle = generateMeaningfulTitle(
        result.reminder.category || ReminderCategory.TASK, 
        text
      );
      
      logDebug("Generated title", { title: generatedTitle });
      
      // Use platform-specific transition timing
      safePlatformTransition(() => {
        if (!isMountedRef.current) return;
        
        logDebug("Setting state variables with processing results");
        setTitle(generatedTitle);
        setPriority(result.reminder.priority || ReminderPriority.MEDIUM);
        setCategory(result.reminder.category || ReminderCategory.TASK);
        setPeriodId(result.reminder.periodId || "none");
        
        if (!result.reminder.dueDate) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0);
          result.reminder.dueDate = tomorrow;
          logDebug("Added default due date", { dueDate: tomorrow });
        }
        
        setProcessingResult({
          ...result,
          reminder: {
            ...result.reminder,
            dueDate: result.reminder.dueDate
          }
        });
        
        logDebug("Preparing to switch to confirmation view");
        setIsProcessing(false);
        
        // For iOS PWA, we use a more direct approach with additional checks
        if (env.isIOSPwa) {
          logDebug("iOS PWA environment detected, using direct view transition");
          setViewState('confirming');
          setView('confirm');
          
          // Add a verification log after a small delay to ensure state was updated
          setTimeout(() => {
            logDebug("Verification - state after iOS PWA transition", {
              view: view === 'confirm' ? 'confirm (✓)' : `confirm (❌ actually ${view})`,
              viewState: viewState === 'confirming' ? 'confirming (✓)' : `confirming (❌ actually ${viewState})`,
              isProcessing: isProcessing ? '❌ still processing' : '✓ not processing',
              hasResult: Boolean(processingResult) ? '✓ has result' : '❌ no result'
            });
          }, 100);
        } else {
          // For other environments, use the regular transition function
          logDebug("Using standard transition to confirm view");
          transitionToConfirmView();
        }
      }, env.isIOSPwa ? 100 : 50);
      
    } catch (error) {
      console.error('Error processing voice input:', error);
      logDebug('Error processing voice input', { error });
      
      // Check if component still mounted before updating state
      if (!isMountedRef.current) {
        logDebug('Component unmounted during error handling');
        return;
      }
      
      setIsProcessing(false);
      isConfirmingRef.current = false;
      setViewState('idle');
      logDebug('Reset state after error');
      
      toast({
        title: "Processing Error",
        description: "There was an error processing your voice input. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast, safePlatformTransition, transitionToConfirmView, env.isIOSPwa, view, viewState, 
      isProcessing, processingResult, logDebug]);
  
  const handleCancel = useCallback(() => {
    logDebug("Cancel called", { currentViewState: viewState });
    isConfirmingRef.current = false;
    setViewState('idle');
    resetState();
    onOpenChange(false);
  }, [resetState, onOpenChange, viewState, logDebug]);

  const handleGoBack = useCallback(() => {
    logDebug("Go back called, resetting to recording view");
    setView("record");
    setViewState('idle');
    isConfirmingRef.current = false;
  }, [logDebug]);
  
  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
        logDebug('Cleanup: cleared transition timer on unmount');
      }
    };
  }, [logDebug]);
  
  // Log state changes
  useEffect(() => {
    logDebug("Voice recorder state changed", {
      view, 
      viewState,
      isProcessing, 
      hasTranscript: !!transcript,
      hasResult: !!processingResult,
      title
    });
  }, [view, transcript, isProcessing, processingResult, title, viewState, logDebug]);
  
  return {
    title,
    setTitle,
    transcript,
    isProcessing,
    view,
    processingResult,
    priority,
    setPriority,
    category,
    setCategory,
    periodId,
    setPeriodId,
    handleTranscriptComplete,
    handleCancel,
    handleGoBack,
    resetState,
    debugLogs: debugLogsRef.current, // Expose debug logs for potential UI debugging
    getDebugLogsAsString: () => JSON.stringify(debugLogsRef.current, null, 2) // Helper method for getting full debug logs
  };
}
