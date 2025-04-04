import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import VoiceReminderConfirmView from "./VoiceReminderConfirmView";
import { createReminder } from "@/utils/reminderUtils";
import { useToast } from "@/hooks/use-toast";
import { Reminder, ReminderPriority, ReminderCategory } from "@/types/reminderTypes";
import VoiceRecorderView from "./voice-recorder/VoiceRecorderView";
import ModalFooterActions from "./voice-recorder/ModalFooterActions";
import { processVoiceInput } from "@/services/nlp";
import { createDebugLogger } from "@/utils/debugUtils";

const debugLog = createDebugLogger("VoiceRecorderModal");

interface VoiceRecorderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReminderCreated?: (reminder: Reminder) => void;
}

const useVoiceRecorderModalState = (onOpenChange: (open: boolean) => void) => {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<"record" | "confirm">("record");
  const [processingResult, setProcessingResult] = useState<any | null>(null);
  const [priority, setPriority] = useState<ReminderPriority>(ReminderPriority.MEDIUM);
  const [category, setCategory] = useState<ReminderCategory>(ReminderCategory.TASK);
  const [periodId, setPeriodId] = useState<string>("none");
  const { toast } = useToast();
  
  const resetState = () => {
    setTitle("");
    setTranscript("");
    setIsProcessing(false);
    setView("record");
    setProcessingResult(null);
    setPriority(ReminderPriority.MEDIUM);
    setCategory(ReminderCategory.TASK);
    setPeriodId("none");
  };
  
  const handleTranscriptComplete = (text: string) => {
    setTranscript(text);
    setIsProcessing(true);
    
    try {
      debugLog(`Processing transcript: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
      const result = processVoiceInput(text);
      debugLog("NLP processing result:", result);
      
      const generatedTitle = result.reminder.title || text.substring(0, 40) + (text.length > 40 ? "..." : "");
      setTitle(generatedTitle);
      
      setPriority(result.reminder.priority || ReminderPriority.MEDIUM);
      setCategory(result.reminder.category || ReminderCategory.TASK);
      setPeriodId(result.reminder.periodId || "none");
      
      setProcessingResult(result);
      
      setView("confirm");
      setIsProcessing(false);
      
      debugLog("Switched to confirmation view with detected properties", {
        title: generatedTitle,
        priority: result.reminder.priority,
        category: result.reminder.category,
        periodId: result.reminder.periodId
      });
    } catch (error) {
      console.error('Error processing voice input:', error);
      setIsProcessing(false);
      
      toast({
        title: "Processing Error",
        description: "There was an error processing your voice input. Please try again."
      });
    }
  };
  
  const handleCancel = () => {
    resetState();
    onOpenChange(false);
  };

  const handleGoBack = () => {
    setView("record");
  };
  
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
};

const VoiceRecorderModal = ({ open, onOpenChange, onReminderCreated }: VoiceRecorderModalProps) => {
  const { 
    title, setTitle,
    transcript,
    isProcessing,
    view,
    processingResult,
    priority, setPriority,
    category, setCategory,
    periodId, setPeriodId,
    handleTranscriptComplete,
    handleCancel,
    handleGoBack,
    resetState
  } = useVoiceRecorderModalState(onOpenChange);
  
  const { toast } = useToast();
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const lastOpenStateRef = useRef(open);
  const [isPWA, setIsPWA] = useState(false);
  
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    
    setIsPWA(isStandalone);
    debugLog("VoiceRecorderModal running as PWA:", isStandalone);
  }, []);
  
  useEffect(() => {
    if (open && !lastOpenStateRef.current) {
      debugLog("Voice modal opened, checking microphone access");
      
      const shouldPreRequest = isPWA || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (shouldPreRequest && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        debugLog("Pre-checking microphone permission");
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            debugLog("Microphone permission pre-granted");
            if (isPWA) {
              (window as any).microphoneStream = stream;
              debugLog("Stored microphone stream for PWA");
            } else {
              stream.getTracks().forEach(track => track.stop());
            }
          })
          .catch(err => {
            debugLog("Microphone permission not pre-granted:", err.name);
          });
      }
      
      debugLog("Modal opened, resetting state");
      resetState();
    }
    lastOpenStateRef.current = open;
  }, [open, resetState, isPWA]);
  
  useEffect(() => {
    if (view === "confirm" && dialogContentRef.current) {
      debugLog("View changed to confirm, scrolling to bottom");
      setTimeout(() => {
        if (dialogContentRef.current) {
          dialogContentRef.current.scrollTop = dialogContentRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [view, processingResult]);
  
  useEffect(() => {
    debugLog("Current view:", view, "transcript length:", transcript ? transcript.length : 0, "isPWA:", isPWA);
  }, [view, transcript, isPWA]);
  
  useEffect(() => {
    debugLog("Processing state:", isProcessing, "in view:", view);
  }, [isProcessing, view]);
  
  useEffect(() => {
    return () => {
      if ((window as any).microphoneStream) {
        const tracks = (window as any).microphoneStream.getTracks();
        tracks.forEach((track: MediaStreamTrack) => track.stop());
        (window as any).microphoneStream = null;
        debugLog("Microphone stream released on modal close");
      }
    };
  }, []);
  
  const enhancedTranscriptHandler = (text: string) => {
    debugLog(`Transcript complete called with text of length: ${text.length}`);
    debugLog(`First 30 chars: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
    
    if (isPWA) {
      debugLog("PWA mode detected, adding slight delay before processing");
      setTimeout(() => {
        handleTranscriptComplete(text);
      }, 200);
    } else {
      handleTranscriptComplete(text);
    }
  };
  
  const handleSave = () => {
    if (!transcript || !title) {
      console.error("Cannot save: missing title or transcript");
      return;
    }
    
    try {
      debugLog("Creating reminder with:", {
        title,
        priority,
        category,
        periodId: periodId === "none" ? undefined : periodId,
        dueDate: processingResult?.reminder.dueDate
      });
      
      const reminderInput = {
        title,
        description: transcript,
        priority,
        category,
        periodId: periodId === "none" ? undefined : periodId,
        voiceTranscript: transcript,
        checklist: processingResult?.reminder.checklist || [],
        dueDate: processingResult?.reminder.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      
      const newReminder = createReminder(reminderInput);
      debugLog("Created reminder:", newReminder);
      
      if (onReminderCreated) {
        debugLog("Calling onReminderCreated with new reminder");
        onReminderCreated(newReminder);
      } else {
        console.warn("onReminderCreated callback is not provided");
      }
      
      toast({
        title: "Reminder Created",
        description: "Your voice reminder has been created successfully."
      });
      
      handleCancel();
    } catch (error) {
      console.error("Error saving voice reminder:", error);
      
      toast({
        title: "Save Error",
        description: "There was an error saving your reminder. Please try again."
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpenState) => {
        debugLog("Dialog open state changing to:", newOpenState, "current view:", view);
        if (!newOpenState && view === "confirm") {
          const shouldClose = window.confirm("Are you sure you want to discard this reminder?");
          if (shouldClose) {
            onOpenChange(false);
          }
        } else {
          onOpenChange(newOpenState);
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto" ref={dialogContentRef}>
        <DialogHeader>
          <DialogTitle>
            {view === "confirm" ? "Confirm Your Reminder" : "Record Voice Reminder"}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(85vh-10rem)]">
          {view === "confirm" ? (
            <VoiceReminderConfirmView
              title={title}
              setTitle={setTitle}
              transcript={transcript}
              priority={priority}
              setPriority={setPriority}
              category={category}
              setCategory={setCategory}
              periodId={periodId}
              setPeriodId={setPeriodId}
              processingResult={processingResult}
              onSave={handleSave}
              onCancel={handleCancel}
              onGoBack={handleGoBack}
            />
          ) : (
            <VoiceRecorderView 
              onTranscriptComplete={enhancedTranscriptHandler}
              isProcessing={isProcessing}
            />
          )}
        </ScrollArea>
        
        <ModalFooterActions
          view={view === "confirm" ? "confirm" : "record"}
          onCancel={handleCancel}
          onGoBack={handleGoBack}
          onSave={handleSave}
        />
      </DialogContent>
    </Dialog>
  );
};

export default VoiceRecorderModal;
