
import VoiceRecorder from "../VoiceRecorder";
import VoiceReminderProcessingView from "../VoiceReminderProcessingView";

interface VoiceRecorderViewProps {
  onTranscriptComplete: (text: string) => void;
  isProcessing: boolean;
}

const VoiceRecorderView = ({ 
  onTranscriptComplete, 
  isProcessing 
}: VoiceRecorderViewProps) => {
  return (
    <div className="space-y-6 py-4">
      <VoiceRecorder onTranscriptComplete={onTranscriptComplete} />
      {isProcessing && <VoiceReminderProcessingView />}
    </div>
  );
};

export default VoiceRecorderView;
