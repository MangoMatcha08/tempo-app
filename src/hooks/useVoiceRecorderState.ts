import { useState, useEffect, useRef, useCallback } from "react";
import { VoiceProcessingResult, ReminderPriority, ReminderCategory } from "@/types/reminderTypes";
import { generateMeaningfulTitle } from "@/utils/voiceReminderUtils";
import { processVoiceInput } from "@/services/nlp";
import { useToast } from "@/hooks/use-toast";

// Define view states for our state machine
type ViewState = 'idle' | 'recording' | 'processing' | 'confirming';

export function useVoiceRecorderState(onOpenChange: (open: boolean) => void) {
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
      viewportHeight: window.innerHeight
    });
    
    logDebug('Initial state', {
      view,
      viewState,
      isProcessing,
      hasTranscript: Boolean(transcript),
      hasResult: Boolean(processingResult)
    });
  }, [logDebug, view, viewState, isProcessing, transcript, processingResult]);
  
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
  
  const transitionToConfirmView = useCallback(() => {
    if (viewState === 'processing' && isMountedRef.current) {
      logDebug("Transitioning from processing to confirming");
      setViewState('confirming');
      setView('confirm');
    } else {
      logDebug("Transition blocked", { viewState, isMounted: isMountedRef.current });
    }
  }, [viewState, logDebug]);
  
  const handleTranscriptComplete = useCallback((text: string) => {
    logDebug("Transcript complete called", { textLength: text?.length || 0, textPreview: text?.substring(0, 20) });
    
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
      
      logDebug("Switching to confirmation view with result", { 
        hasResult: true,
        title: generatedTitle,
        category: result.reminder.category,
        priority: result.reminder.priority
      });
      
      setIsProcessing(false);
      
      // Explicitly make the transition synchronous and direct
      logDebug("Setting view state to confirming directly");
      setViewState('confirming');
      
      logDebug("Setting view to confirm directly");
      setView('confirm');
      
      // Add a verification log after a small delay to ensure state was updated
      setTimeout(() => {
        logDebug("Verification - state after transition", {
          view: 'confirm', // This is what we expect
          viewState: 'confirming', // This is what we expect
          isProcessing: false, // This is what we expect
          hasResult: Boolean(result),
          title: generatedTitle
        });
      }, 100);
      
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
  }, [toast, logDebug]);
  
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
