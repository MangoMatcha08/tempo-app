
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
  
  const isConfirmingRef = useRef(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true); // Track component mount state
  
  // Set isMountedRef to false when component unmounts
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Clean up any pending timers
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, []);
  
  const resetState = useCallback(() => {
    console.log("Reset state called, current view:", view, "viewState:", viewState);
    
    if (!isConfirmingRef.current || viewState === 'idle') {
      // Clear any pending timers first
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
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
      }
      
      console.log("State reset completed");
    }
  }, [view, viewState]);
  
  const transitionToConfirmView = useCallback(() => {
    if (viewState === 'processing' && isMountedRef.current) {
      console.log("Transitioning from processing to confirming");
      setViewState('confirming');
      setView('confirm');
    }
  }, [viewState]);
  
  const handleTranscriptComplete = useCallback((text: string) => {
    console.log("Transcript complete called with:", text);
    if (!text || !text.trim() || !isMountedRef.current) {
      console.log("Empty transcript received or component unmounted, not processing");
      return;
    }
    
    isConfirmingRef.current = true;
    
    setTranscript(text);
    setIsProcessing(true);
    setViewState('processing');
    
    try {
      console.log("Processing voice input:", text);
      const result = processVoiceInput(text);
      console.log("NLP processing result:", result);
      
      // Check if component still mounted before continuing
      if (!isMountedRef.current) {
        console.log("Component unmounted during processing, aborting");
        return;
      }
      
      const generatedTitle = generateMeaningfulTitle(
        result.reminder.category || ReminderCategory.TASK, 
        text
      );
      
      setTitle(generatedTitle);
      setPriority(result.reminder.priority || ReminderPriority.MEDIUM);
      setCategory(result.reminder.category || ReminderCategory.TASK);
      setPeriodId(result.reminder.periodId || "none");
      
      if (!result.reminder.dueDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        result.reminder.dueDate = tomorrow;
      }
      
      setProcessingResult({
        ...result,
        reminder: {
          ...result.reminder,
          dueDate: result.reminder.dueDate
        }
      });
      
      console.log("Switching to confirmation view with result:", result);
      setIsProcessing(false);
      
      // Explicitly make the transition synchronous and direct
      console.log("Setting view state to confirming directly");
      setViewState('confirming');
      console.log("Setting view to confirm directly");
      setView('confirm');
    } catch (error) {
      console.error('Error processing voice input:', error);
      
      // Check if component still mounted before updating state
      if (!isMountedRef.current) return;
      
      setIsProcessing(false);
      isConfirmingRef.current = false;
      setViewState('idle');
      
      toast({
        title: "Processing Error",
        description: "There was an error processing your voice input. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);
  
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
  
  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, []);
  
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
