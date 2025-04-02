
import { useState, useEffect, useRef } from "react";
import { VoiceProcessingResult, ReminderPriority, ReminderCategory } from "@/types/reminderTypes";
import { generateMeaningfulTitle } from "@/utils/voiceReminderUtils";
import { processVoiceInput } from "@/services/nlp";
import { useToast } from "@/hooks/use-toast";

export function useVoiceRecorderState(onOpenChange: (open: boolean) => void) {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<"record" | "confirm">("record");
  const [processingResult, setProcessingResult] = useState<VoiceProcessingResult | null>(null);
  const [priority, setPriority] = useState<ReminderPriority>(ReminderPriority.MEDIUM);
  const [category, setCategory] = useState<ReminderCategory>(ReminderCategory.TASK);
  const [periodId, setPeriodId] = useState<string>("none");
  const { toast } = useToast();
  
  // Ref to track if we're currently in the process of confirming a transcript
  const isConfirmingRef = useRef(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPWA, setIsPWA] = useState(false);
  
  // Check if running as PWA
  useEffect(() => {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      // @ts-ignore - Property 'standalone' exists on iOS Safari but not in TS types
      window.navigator.standalone === true;
    
    setIsPWA(isStandalone);
    console.log("useVoiceRecorderState: running as PWA:", isStandalone);
  }, []);
  
  // Reset state when modal opens
  const resetState = () => {
    console.log("Reset state called, current view:", view);
    if (!isConfirmingRef.current) {
      setTitle("");
      setTranscript("");
      setIsProcessing(false);
      setView("record");
      setProcessingResult(null);
      setPriority(ReminderPriority.MEDIUM);
      setCategory(ReminderCategory.TASK);
      setPeriodId("none");
      
      // Clear any pending timers
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    }
  };
  
  const handleTranscriptComplete = (text: string) => {
    console.log("Transcript complete called with:", text);
    if (!text || !text.trim()) {
      console.log("Empty transcript received, not processing");
      return;
    }
    
    // Set the confirming flag to prevent accidental resets
    isConfirmingRef.current = true;
    
    setTranscript(text);
    setIsProcessing(true);
    
    try {
      console.log("Processing voice input:", text);
      // Process the transcript with NLP
      const result = processVoiceInput(text);
      console.log("NLP processing result:", result);
      
      // Generate a better title based on category and content
      const generatedTitle = generateMeaningfulTitle(
        result.reminder.category || ReminderCategory.TASK, 
        text
      );
      
      // Set the processed data
      setTitle(generatedTitle);
      setPriority(result.reminder.priority || ReminderPriority.MEDIUM);
      setCategory(result.reminder.category || ReminderCategory.TASK);
      setPeriodId(result.reminder.periodId || "none");
      
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
      
      console.log("Switching to confirmation view with result:", result);
      
      // First finish processing, then switch to confirmation view
      setIsProcessing(false);
      
      // Use setTimeout to ensure state updates properly between transitions
      // Clear any existing timer first
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      
      // Use longer timeout for PWA mode
      const transitionDelay = isPWA ? 400 : 200;
      console.log(`Setting transition delay of ${transitionDelay}ms for view change to confirm`);
      
      transitionTimerRef.current = setTimeout(() => {
        console.log("Setting view to confirm");
        setView("confirm");
        transitionTimerRef.current = null;
      }, transitionDelay);  // Longer timeout for more reliable state transitions
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
    console.log("Voice recorder state changed:", {
      view, 
      isProcessing, 
      hasTranscript: !!transcript,
      hasResult: !!processingResult,
      title,
      isPWA
    });
  }, [view, transcript, isProcessing, processingResult, title, isPWA]);
  
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
    resetState
  };
}
