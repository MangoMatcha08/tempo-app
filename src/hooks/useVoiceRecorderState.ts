
import { useState, useEffect, useRef } from "react";
import { VoiceProcessingResult, ReminderPriority, ReminderCategory } from "@/types/reminderTypes";
import { generateMeaningfulTitle } from "@/utils/voiceReminderUtils";
import { processVoiceInput } from "@/services/nlp";
import { useToast } from "@/hooks/use-toast";
import { isPwaMode, getPwaAdjustedTimeout } from "@/utils/pwaUtils";
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
  const [isPWA, setIsPWA] = useState(false);
  
  // Check if running as PWA
  useEffect(() => {
    const pwaStatus = isPwaMode();
    setIsPWA(pwaStatus);
    debugLog("Running as PWA:", pwaStatus);
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
      
      // Clear any pending timers
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
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
    
    setTranscript(text);
    setIsProcessing(true);
    
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
      
      // Use setTimeout to ensure state updates properly between transitions
      // Clear any existing timer first
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      
      // Use longer timeout for PWA mode or mobile
      const transitionMultiplier = (isPWA || isMobile) ? 3 : 1.5;
      const transitionDelay = getPwaAdjustedTimeout(200, transitionMultiplier); // 200ms standard, 600ms in PWA/mobile
      debugLog(`Setting transition delay of ${transitionDelay}ms for view change to confirm`);
      
      transitionTimerRef.current = setTimeout(() => {
        debugLog("Setting view to confirm");
        setView("confirm");
        transitionTimerRef.current = null;
      }, transitionDelay);
    } catch (error) {
      console.error('Error processing voice input:', error);
      setIsProcessing(false);
      isConfirmingRef.current = false;
      
      toast({
        title: "Processing Error",
        description: "There was an error processing your voice input. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleCancel = () => {
    isConfirmingRef.current = false;
    resetState();
    onOpenChange(false);
  };

  const handleGoBack = () => {
    setView("record");
    isConfirmingRef.current = false;
  };
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, []);
  
  // For debugging
  useEffect(() => {
    debugLog("Voice recorder state changed:", {
      view, 
      isProcessing, 
      hasTranscript: !!transcript,
      hasResult: !!processingResult,
      title,
      isPWA,
      isMobile
    });
  }, [view, transcript, isProcessing, processingResult, title, isPWA, isMobile]);
  
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
    setPeriod,
    handleTranscriptComplete,
    handleCancel,
    handleGoBack,
    resetState,
    isPWA,
    isMobile
  };
}
