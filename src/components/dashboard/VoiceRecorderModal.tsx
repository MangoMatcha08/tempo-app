
import { useEffect, useRef } from "react";
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
import { Reminder } from "@/types/reminderTypes";
import { useVoiceRecorderState } from "@/hooks/useVoiceRecorderState";
import VoiceRecorderView from "./voice-recorder/VoiceRecorderView";
import ModalFooterActions from "./voice-recorder/ModalFooterActions";

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
    periodId, setPeriodId,
    handleTranscriptComplete,
    handleCancel,
    handleGoBack,
    resetState
  } = useVoiceRecorderState(onOpenChange);
  
  const { toast } = useToast();
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const lastOpenStateRef = useRef(open);
  const isMountedRef = useRef(true);
  
  // Set mounted flag on mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // When modal opens, try to request microphone permission proactively on mobile
  useEffect(() => {
    if (open && !lastOpenStateRef.current) {
      // Check if we're on a mobile device
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // If on mobile, we'll try to pre-request permission when the modal opens
      if (isMobileDevice && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log("Voice modal opened on mobile, pre-checking microphone permission");
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            console.log("Microphone permission pre-granted");
          })
          .catch(err => {
            console.log("Microphone permission not pre-granted:", err.name);
          });
      }
      
      console.log("Modal opened, resetting state");
      resetState();
    }
    lastOpenStateRef.current = open;
  }, [open, resetState]);
  
  // Scroll to the bottom when view changes to confirm
  useEffect(() => {
    // Only update if component is still mounted
    if (!isMountedRef.current) return;
    
    if (view === "confirm" && dialogContentRef.current) {
      console.log("View changed to confirm, scrolling to bottom");
      const timeoutId = setTimeout(() => {
        if (dialogContentRef.current && isMountedRef.current) {
          dialogContentRef.current.scrollTop = dialogContentRef.current.scrollHeight;
        }
      }, 100);
      
      // Clean up timeout
      return () => clearTimeout(timeoutId);
    }
  }, [view, processingResult]);
  
  // Debug logging for view state
  useEffect(() => {
    console.log("Current view:", view, "transcript length:", transcript ? transcript.length : 0);
  }, [view, transcript]);
  
  const handleSave = () => {
    if (!transcript || !title) {
      console.error("Cannot save: missing title or transcript");
      return;
    }
    
    // Don't proceed if component is unmounted
    if (!isMountedRef.current) return;
    
    try {
      console.log("Creating reminder with:", {
        title,
        priority,
        category,
        periodId: periodId === "none" ? undefined : periodId,
        dueDate: processingResult?.reminder.dueDate
      });
      
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
      console.log("Created reminder:", newReminder);
      
      // Call the callback if provided
      if (onReminderCreated && isMountedRef.current) {
        console.log("Calling onReminderCreated with new reminder");
        onReminderCreated(newReminder);
      } else {
        console.warn("onReminderCreated callback is not provided");
      }
      
      toast({
        title: "Reminder Created",
        description: "Your voice reminder has been created successfully."
      });
      
      // Reset and close
      handleCancel();
    } catch (error) {
      console.error("Error saving voice reminder:", error);
      
      // Only show toast if component is still mounted
      if (isMountedRef.current) {
        toast({
          title: "Save Error",
          description: "There was an error saving your reminder. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpenState) => {
        console.log("Dialog open state changing to:", newOpenState, "current view:", view);
        // When closing the modal
        if (!newOpenState && view === "confirm") {
          // Show confirmation before closing if we're in confirm view
          console.log("Attempt to close dialog while in confirm view");
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
              onTranscriptComplete={handleTranscriptComplete}
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
