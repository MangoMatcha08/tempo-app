
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";
import { processVoiceInput } from "@/services/nlpService";
import { createReminder } from "@/utils/reminderUtils";
import { useToast } from "@/hooks/use-toast";
import { Reminder, ReminderPriority, ReminderCategory, VoiceProcessingResult } from "@/types/reminderTypes";
import { mockPeriods } from "@/utils/reminderUtils";

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
  const [periodId, setPeriodId] = useState<string>("");
  const { toast } = useToast();
  
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
      setPeriodId("");
    }
  }, [open]);
  
  const handleTranscriptComplete = (text: string) => {
    setTranscript(text);
    setIsProcessing(true);
    
    try {
      // Process the transcript with NLP
      const result = processVoiceInput(text);
      
      // Set the processed data
      setTitle(result.reminder.title);
      setPriority(result.reminder.priority || ReminderPriority.MEDIUM);
      setCategory(result.reminder.category || ReminderCategory.TASK);
      setPeriodId(result.reminder.periodId || "");
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
        periodId,
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
    setPeriodId("");
    onOpenChange(false);
  };

  const handleGoBack = () => {
    setView("record");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {view === "record" ? "Record Voice Reminder" : "Confirm Your Reminder"}
          </DialogTitle>
        </DialogHeader>
        
        {view === "record" ? (
          <div className="space-y-6 py-4">
            <VoiceRecorder onTranscriptComplete={handleTranscriptComplete} />
            
            {isProcessing && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <p>Processing your input...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Title</label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Reminder title"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={(value) => setPriority(value as ReminderPriority)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ReminderPriority.LOW}>Low</SelectItem>
                    <SelectItem value={ReminderPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={ReminderPriority.HIGH}>High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={(value) => setCategory(value as ReminderCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ReminderCategory.TASK}>Task</SelectItem>
                    <SelectItem value={ReminderCategory.MEETING}>Meeting</SelectItem>
                    <SelectItem value={ReminderCategory.DEADLINE}>Deadline</SelectItem>
                    <SelectItem value={ReminderCategory.PREPARATION}>Preparation</SelectItem>
                    <SelectItem value={ReminderCategory.GRADING}>Grading</SelectItem>
                    <SelectItem value={ReminderCategory.COMMUNICATION}>Communication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="period" className="text-sm font-medium">Period</label>
                <Select value={periodId} onValueChange={setPeriodId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {mockPeriods.map(period => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name} ({period.startTime} - {period.endTime})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Original Input</label>
                <div className="p-3 bg-muted/30 rounded-md text-sm italic">
                  {transcript}
                </div>
              </div>
              
              {processingResult?.reminder.checklist && processingResult.reminder.checklist.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Detected Checklist Items</label>
                  <div className="p-3 bg-muted/30 rounded-md text-sm">
                    <ul className="list-disc pl-5 space-y-1">
                      {processingResult.reminder.checklist.map((item, index) => (
                        <li key={index}>{item.text}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter>
          {view === "record" ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
          ) : (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleGoBack}
              >
                Back
              </Button>
              <Button 
                type="button" 
                onClick={handleSave}
              >
                Save Reminder
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceRecorderModal;
