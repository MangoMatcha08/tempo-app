
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import VoiceRecorder from "./VoiceRecorder";
import VoiceReminderConfirmView from "./VoiceReminderConfirmView";
import VoiceReminderProcessingView from "./VoiceReminderProcessingView";
import { generateMeaningfulTitle } from "@/utils/voiceReminderUtils";
import { processVoiceInput } from "@/services/nlp";
import { createReminder } from "@/utils/reminderUtils";
import { useToast } from "@/hooks/use-toast";
import { Reminder, ReminderPriority, ReminderCategory, VoiceProcessingResult } from "@/types/reminderTypes";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VoiceRecorderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReminderCreated?: (reminder: Reminder) => void;
}

const VoiceRecorderModal = ({ open, onOpenChange, onReminderCreated }: VoiceRecorderModalProps) => {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<"record" | "confirm">("record");
  const [processingResult, setProcessingResult] = useState<VoiceProcessingResult | null>(null);
  const [priority, setPriority] = useState<ReminderPriority>(ReminderPriority.MEDIUM);
  const [category, setCategory] = useState<ReminderCategory>(ReminderCategory.TASK);
  const [periodId, setPeriodId] = useState<string>("none");
  const { toast } = useToast();
  const dialogContentRef = useRef<HTMLDivElement>(null);
  
  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setTranscript("");
      setIsProcessing(false);
      setView("record");
      setProcessingResult(null);
      setPriority(ReminderPriority.MEDIUM);
      setCategory(ReminderCategory.TASK);
      setPeriodId("none");
    }
  }, [open]);
  
  // Scroll to the bottom when view changes to confirm
  useEffect(() => {
    if (view === "confirm" && dialogContentRef.current) {
      setTimeout(() => {
        if (dialogContentRef.current) {
          dialogContentRef.current.scrollTop = dialogContentRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [view, processingResult]);
  
  const handleTranscriptComplete = (text: string) => {
    setTranscript(text);
    setIsProcessing(true);
    
    try {
      // Process the transcript with NLP
      const result = processVoiceInput(text);
      
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
      setProcessingResult(result);
      
      // Switch to confirmation view
      setView("confirm");
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing voice input:', error);
      setIsProcessing(false);
      
      toast({
        title: "Processing Error",
        description: "There was an error processing your voice input. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleSave = () => {
    if (!transcript || !title) return;
    
    try {
      // Create reminder with the confirmed data
      const reminderInput = {
        title,
        description: transcript,
        priority,
        category,
        periodId: periodId === "none" ? undefined : periodId,
        voiceTranscript: transcript,
        checklist: processingResult?.reminder.checklist || []
      };
      
      const newReminder = createReminder(reminderInput);
      
      // Call the callback if provided
      if (onReminderCreated) {
        onReminderCreated(newReminder);
      }
      
      toast({
        title: "Reminder Created",
        description: "Your voice reminder has been created successfully."
      });
      
      // Reset and close
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
  
  const handleCancel = () => {
    setTitle("");
    setTranscript("");
    setIsProcessing(false);
    setView("record");
    setProcessingResult(null);
    setPriority(ReminderPriority.MEDIUM);
    setCategory(ReminderCategory.TASK);
    setPeriodId("none");
    onOpenChange(false);
  };

  const handleGoBack = () => {
    setView("record");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto" ref={dialogContentRef}>
        <DialogHeader>
          <DialogTitle>
            {view === "record" ? "Record Voice Reminder" : "Confirm Your Reminder"}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(85vh-10rem)]">
          {view === "record" ? (
            <div className="space-y-6 py-4">
              <VoiceRecorder onTranscriptComplete={handleTranscriptComplete} />
              
              {isProcessing && <VoiceReminderProcessingView />}
            </div>
          ) : (
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
          )}
        </ScrollArea>
        
        {view === "record" && (
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </DialogFooter>
        )}
        
        {view === "confirm" && (
          <DialogFooter className="mt-4 pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleGoBack}>
              Back
            </Button>
            <Button type="button" onClick={handleSave}>
              Save Reminder
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoiceRecorderModal;
