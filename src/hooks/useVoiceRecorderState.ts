
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
  
  const resetState = useCallback(() => {
    console.log("Reset state called, current view:", view, "viewState:", viewState);
    
    if (!isConfirmingRef.current || viewState === 'idle') {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      
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
  
  const transitionToConfirmView = useCallback(() => {
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
    
    isConfirmingRef.current = true;
    
    setTranscript(text);
    setIsProcessing(true);
    setViewState('processing');
    
    try {
      console.log("Processing voice input:", text);
      const result = processVoiceInput(text);
      console.log("NLP processing result:", result);
      
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
      
      // Force immediate transition to confirm view instead of using setTimeout
      console.log("Setting view to confirm immediately");
      transitionToConfirmView();
      
      /* Comment out the setTimeout approach that was causing issues
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      
      transitionTimerRef.current = setTimeout(() => {
        console.log("Setting view to confirm");
        transitionToConfirmView();
        transitionTimerRef.current = null;
      }, 300);
      */
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
  }, [transitionToConfirmView, toast]);
  
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
