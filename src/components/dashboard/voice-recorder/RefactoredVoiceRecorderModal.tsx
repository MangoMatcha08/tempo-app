
import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import VoiceReminderConfirmView from "../VoiceReminderConfirmView";
import { createReminder } from "@/utils/reminderUtils";
import { useToast } from "@/hooks/use-toast";
import { Reminder } from "@/types/reminderTypes";
import { useVoiceRecorderState } from "@/hooks/useVoiceRecorderState";
import RefactoredVoiceRecorderView from "./RefactoredVoiceRecorderView";
import ModalFooterActions from "./ModalFooterActions";
import { createDebugLogger } from "@/utils/debugUtils";
import { releaseMicrophoneStreams } from "@/utils/pwaUtils";

// Set up debug logger
const debugLog = createDebugLogger("VoiceRecorderModal");

interface VoiceRecorderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReminderCreated?: (reminder: Reminder) => void;
}

const VoiceRecorderModal = ({ open, onOpenChange, onReminderCreated }: VoiceRecorderModalProps) => {
  const { 
    title, setTitle,
    transcript,
    isProcessing,
    view,
    processingResult,
    priority, setPriority,
    category, setCategory,
    periodId, setPeriod,
    handleTranscriptComplete,
    handleCancel,
    handleGoBack,
    resetState,
    isPWA
  } = useVoiceRecorderState(onOpenChange);
  
  const { toast } = useToast();
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const lastOpenStateRef = useRef(open);
  const transcriptProcessedRef = useRef(false);
  
  // When modal opens, try to request microphone permission proactively
  useEffect(() => {
    if (open && !lastOpenStateRef.current) {
      debugLog("Voice modal opened, checking microphone access");
      debugLog("Modal opened, resetting state");
      resetState();
      transcriptProcessedRef.current = false;
    }
    lastOpenStateRef.current = open;
  }, [open, resetState]);
  
  // Scroll to the bottom when view changes to confirm
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
  
  // Debug logging for view state and PWA
  useEffect(() => {
    debugLog(`Current view: ${view}, transcript length: ${transcript ? transcript.length : 0}, isPWA: ${isPWA}`);
  }, [view, transcript, isPWA]);
  
  // Enhanced debug logging for isProcessing state
  useEffect(() => {
    debugLog(`Processing state: ${isProcessing}, in view: ${view}`);
  }, [isProcessing, view]);
  
  // Cleanup microphone stream when modal closes
  useEffect(() => {
    return () => {
      releaseMicrophoneStreams();
    };
  }, []);
  
  // Enhanced transcript handler with better logging for PWA
  const enhancedTranscriptHandler = (text: string) => {
    debugLog(`Transcript complete called with text of length: ${text.length}`);
    debugLog(`First 30 chars: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
    
    // Prevent multiple processing of the same transcript
    if (transcriptProcessedRef.current) {
      debugLog("Transcript already processed, ignoring duplicate");
      return;
    }
    
    transcriptProcessedRef.current = true;
    
    if (isPWA) {
      debugLog("PWA mode detected, adding slight delay before processing");
      setTimeout(() => {
        handleTranscriptComplete(text);
      }, 300);
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
      debugLog(`Creating reminder with: ${JSON.stringify({
        title,
        priority,
        category,
        periodId: periodId === "none" ? undefined : periodId,
        dueDate: processingResult?.reminder.dueDate
      })}`);
      
      // Create reminder with the confirmed data
      const reminderInput = {
        title,
        description: transcript,
        priority,
        category,
        periodId: periodId === "none" ? undefined : periodId,
        voiceTranscript: transcript,
        checklist: processingResult?.reminder.checklist || [],
        // Use the processed date if available
        dueDate: processingResult?.reminder.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000) // Default to tomorrow
      };
      
      const newReminder = createReminder(reminderInput);
      debugLog(`Created reminder: ${newReminder.id}`);
      
      // Call the callback if provided
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
      
      // Reset and close
      transcriptProcessedRef.current = false;
      handleCancel();
    } catch (error) {
      console.error("Error saving voice reminder:", error);
      
      toast({
        title: "Save Error",
        description: "There was an error saving your reminder. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpenState) => {
        debugLog(`Dialog open state changing to: ${newOpenState}, current view: ${view}`);
        // When closing the modal
        if (!newOpenState && view === "confirm") {
          // Show confirmation before closing if we're in confirm view
          debugLog("Attempt to close dialog while in confirm view");
          const shouldClose = window.confirm("Are you sure you want to discard this reminder?");
          if (shouldClose) {
            transcriptProcessedRef.current = false;
            onOpenChange(false);
          }
        } else {
          transcriptProcessedRef.current = false;
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
              setPeriodId={setPeriod}
              processingResult={processingResult}
              onSave={handleSave}
              onCancel={handleCancel}
              onGoBack={handleGoBack}
            />
          ) : (
            <RefactoredVoiceRecorderView 
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
