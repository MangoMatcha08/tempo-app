import { useState, useEffect, useRef, useCallback } from "react";
import { VoiceProcessingResult, ReminderPriority, ReminderCategory } from "@/types/reminderTypes";
import { generateMeaningfulTitle } from "@/utils/voiceReminderUtils";
import { processVoiceInput } from "@/services/nlp";
import { useToast } from "@/hooks/use-toast";
import { isPWAMode, getPwaAdjustedTimeout, isIOSDevice } from "@/utils/pwaUtils";
import { createDebugLogger } from "@/utils/debugUtils";
import { useIsMobile } from "@/hooks/use-mobile";

// Set up debug logger
const debugLog = createDebugLogger("VoiceRecorderState");

export function useVoiceRecorderState(onOpenChange: (open: boolean) => void) {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<"record" | "confirm">("record");
  const [processingResult, setProcessingResult] = useState<VoiceProcessingResult | null>(null);
  const [priority, setPriority] = useState<ReminderPriority>(ReminderPriority.MEDIUM);
  const [category, setCategory] = useState<ReminderCategory>(ReminderCategory.TASK);
  const [periodId, setPeriod] = useState<string>("none");
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Ref to track if we're currently in the process of confirming a transcript
  const isConfirmingRef = useRef(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processingRetryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPWA, setIsPWA] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const processingAttemptsRef = useRef(0);
  const viewChangeAttemptedRef = useRef(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'requesting' | 'granted' | 'denied'>('requesting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get microphone permission
  const requestMicrophonePermission = useCallback(async () => {
    try {
      setPermissionStatus('requesting');
      
      // For iOS PWA, we need special handling
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isPWAMode = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
      
      if (isIOSDevice && isPWAMode) {
        debugLog('iOS PWA detected, using alternative approach for microphone access');
        // For iOS PWA, try to get user media without audio constraints first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
        setPermissionStatus('granted');
        return true;
      } else {
        // Standard approach for other browsers
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
        setPermissionStatus('granted');
        return true;
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      setPermissionStatus('denied');
      setErrorMessage(error instanceof Error ? error.message : String(error));
      return false;
    }
  }, []);

  // Check if running as PWA and on iOS
  useEffect(() => {
    const pwaStatus = isPWAMode();
    const iosStatus = isIOSDevice();
    setIsPWA(pwaStatus);
    setIsIOS(iosStatus);
    debugLog("Running as PWA:", pwaStatus, "on iOS:", iosStatus);
  }, []);

  // Reset state when modal opens
  const resetState = () => {
    debugLog("Reset state called, current view:", view);
    if (!isConfirmingRef.current) {
      setTitle("");
      setTranscript("");
      setIsProcessing(false);
      setView("record");
      setProcessingResult(null);
      setPriority(ReminderPriority.MEDIUM);
      setCategory(ReminderCategory.TASK);
      setPeriod("none");
      processingAttemptsRef.current = 0;
      viewChangeAttemptedRef.current = false;
      
      // Clear any pending timers
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      
      if (processingRetryTimerRef.current) {
        clearTimeout(processingRetryTimerRef.current);
        processingRetryTimerRef.current = null;
      }
    }
  };

  const handleTranscriptComplete = (text: string) => {
    debugLog("Transcript complete called with:", text);
    if (!text || !text.trim()) {
      debugLog("Empty transcript received, not processing");
      return;
    }
    
    // Set the confirming flag to prevent accidental resets
    isConfirmingRef.current = true;
    
    // Ensure processing state is true
    setIsProcessing(true);
    
    // Set transcript
    setTranscript(text);
    debugLog(`Transcript set: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
    
    // Create a function for the actual processing
    const processTranscript = () => {
      try {
        debugLog("Processing voice input:", text);
        // Process the transcript with NLP
        const result = processVoiceInput(text);
        debugLog("NLP processing result:", result);
        
        // Generate a better title based on category and content
        const generatedTitle = generateMeaningfulTitle(
          result.reminder.category || ReminderCategory.TASK, 
          text
        );
        
        // Set the processed data
        setTitle(generatedTitle);
        setPriority(result.reminder.priority || ReminderPriority.MEDIUM);
        setCategory(result.reminder.category || ReminderCategory.TASK);
        setPeriod(result.reminder.periodId || "none");
        
        // Ensure we have a due date (default to tomorrow if not detected)
        if (!result.reminder.dueDate) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0);
          result.reminder.dueDate = tomorrow;
        }
        
        // Update the result with the default due date
        setProcessingResult({
          ...result,
          reminder: {
            ...result.reminder,
            dueDate: result.reminder.dueDate
          }
        });
        
        debugLog("Switching to confirmation view with result:", result);
        
        // First finish processing, then switch to confirmation view
        setIsProcessing(false);
        
        // Add a forced delay to ensure UI renders correctly before transition
        // This is critical for iOS transitions
        const baseDelay = isIOS ? 1200 : 800;
        const platformMultiplier = (isPWA || isMobile) ? 1.5 : 1;
        const transitionDelay = Math.round(baseDelay * platformMultiplier);
        
        debugLog(`Using transition delay of ${transitionDelay}ms before view change`);
        
        // Clear any previous transition timer
        if (transitionTimerRef.current) {
          clearTimeout(transitionTimerRef.current);
        }
        
        // Mark that we've attempted to change the view
        viewChangeAttemptedRef.current = true;
        
        // Use setTimeout with a reference to ensure we can clear it if needed
        transitionTimerRef.current = setTimeout(() => {
          debugLog("Transition timer fired, setting view to confirm");
          setView("confirm");
          transitionTimerRef.current = null;
          
          // Add a second check to ensure view change happened
          setTimeout(() => {
            if (view !== "confirm" && viewChangeAttemptedRef.current) {
              debugLog("View change didn't take effect, forcing view change again");
              setView("confirm");
            }
          }, 500);
        }, transitionDelay);
        
        return true;
      } catch (error) {
        console.error('Error processing voice input:', error);
        debugLog(`Error processing voice input: ${error}`);
        
        // If we've tried less than 3 times, schedule a retry
        if (processingAttemptsRef.current < 2) {  // Max 2 retries
          processingAttemptsRef.current++;
          debugLog(`Scheduling retry #${processingAttemptsRef.current} for processing`);
          
          if (processingRetryTimerRef.current) {
            clearTimeout(processingRetryTimerRef.current);
          }
          
          processingRetryTimerRef.current = setTimeout(() => {
            debugLog(`Executing retry #${processingAttemptsRef.current}`);
            processTranscript();
            processingRetryTimerRef.current = null;
          }, 1200);
          
          return false;
        }
        
        // After retries, show error
        setIsProcessing(false);
        isConfirmingRef.current = false;
        
        toast({
          title: "Processing Error",
          description: "There was an error processing your voice input. Please try again.",
          variant: "destructive"
        });
        
        return false;
      }
    };
    
    // Execute processing with delayed retry logic for reliability
    setTimeout(() => {
      const success = processTranscript();
      
      // If processing immediately fails and we haven't scheduled a retry already
      if (!success && processingAttemptsRef.current === 0) {
        processingAttemptsRef.current++;
        debugLog(`Immediate retry attempt ${processingAttemptsRef.current} for processing`);
        
        // Wait a moment before retrying
        if (processingRetryTimerRef.current) {
          clearTimeout(processingRetryTimerRef.current);
        }
        
        processingRetryTimerRef.current = setTimeout(() => {
          processTranscript();
          processingRetryTimerRef.current = null;
        }, 1200);
      }
    }, 300); // Small initial delay to ensure transcript is fully captured
  };

  const handleCancel = () => {
    debugLog("Cancel handler called");
    isConfirmingRef.current = false;
    viewChangeAttemptedRef.current = false;
    
    // Clear any pending transitions
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    
    if (processingRetryTimerRef.current) {
      clearTimeout(processingRetryTimerRef.current);
      processingRetryTimerRef.current = null;
    }
    
    resetState();
    onOpenChange(false);
  };

  const handleGoBack = () => {
    debugLog("Go back handler called");
    setView("record");
    isConfirmingRef.current = false;
    viewChangeAttemptedRef.current = false;
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      
      if (processingRetryTimerRef.current) {
        clearTimeout(processingRetryTimerRef.current);
        processingRetryTimerRef.current = null;
      }
      
      debugLog("Cleanup: clearing timers and refs");
    };
  }, []);

  // Debug logging for view transitions
  useEffect(() => {
    debugLog("View state changed:", view);
    
    // If view changed to confirm, mark the attempt as successful
    if (view === "confirm") {
      viewChangeAttemptedRef.current = false;
    }
  }, [view]);

  // For debugging
  useEffect(() => {
    debugLog("Voice recorder state changed:", {
      view, 
      isProcessing, 
      hasTranscript: !!transcript,
      hasResult: !!processingResult,
      title,
      isPWA,
      isIOS,
      isMobile,
      audioStream,
      permissionStatus,
      errorMessage
    });
  }, [view, transcript, isProcessing, processingResult, title, isPWA, isIOS, isMobile, audioStream, permissionStatus, errorMessage]);

  return {
    title,
    setTitle,
    transcript,
    isProcessing,
    view,
    setView,
    processingResult,
    priority,
    setPriority,
    category,
    setCategory,
    periodId,
    setPeriod,
    handleTranscriptComplete,
    handleCancel,
    handleGoBack,
    resetState,
    isPWA,
    isIOS,
    isMobile,
    audioStream,
    permissionStatus,
    errorMessage,
    requestMicrophonePermission
  };
}
