
import { useState, useEffect, useRef } from "react";
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
  
  // Ref to track if we're currently in the process of confirming a transcript
  const isConfirmingRef = useRef(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset state when modal opens
  const resetState = useCallback(() => {
    console.log("Reset state called, current view:", view, "viewState:", viewState);
    
    // Only reset if we're not in the middle of confirming
    if (!isConfirmingRef.current || viewState === 'idle') {
      // Clear any pending timers first
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      
      // Reset all state values
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
      
      console.log("State reset completed");
    }
  }, [view, viewState]);
  
  // More reliable transition between states
  const transitionToConfirmView = useCallback(() => {
    // Only transition if we're in the processing state
    if (viewState === 'processing') {
      console.log("Transitioning from processing to confirming");
      setViewState('confirming');
      setView('confirm');
    }
  }, [viewState]);
  
  const handleTranscriptComplete = useCallback((text: string) => {
    console.log("Transcript complete called with:", text);
    if (!text || !text.trim()) {
      console.log("Empty transcript received, not processing");
      return;
    }
    
    // Set the confirming flag to prevent accidental resets
    isConfirmingRef.current = true;
    
    setTranscript(text);
    setIsProcessing(true);
    setViewState('processing');
    
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
      
      transitionTimerRef.current = setTimeout(() => {
        console.log("Setting view to confirm");
        transitionToConfirmView();
        transitionTimerRef.current = null;
      }, 300);  // Increased timeout for more reliable state transitions
    } catch (error) {
      console.error('Error processing voice input:', error);
      setIsProcessing(false);
      isConfirmingRef.current = false;
      setViewState('idle');
      
      toast({
        title: "Processing Error",
        description: "There was an error processing your voice input. Please try again.",
        variant: "destructive"
      });
    }
  }, [transitionToConfirmView]);
  
  const handleCancel = useCallback(() => {
    console.log("Cancel called, current viewState:", viewState);
    isConfirmingRef.current = false;
    setViewState('idle');
    resetState();
    onOpenChange(false);
  }, [resetState, onOpenChange, viewState]);

  const handleGoBack = useCallback(() => {
    console.log("Go back called, resetting to recording view");
    setView("record");
    setViewState('idle');
    isConfirmingRef.current = false;
  }, []);
  
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
      viewState,
      isProcessing, 
      hasTranscript: !!transcript,
      hasResult: !!processingResult,
      title
    });
  }, [view, transcript, isProcessing, processingResult, title, viewState]);
  
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
