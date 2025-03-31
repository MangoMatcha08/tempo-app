
import { Loader2 } from "lucide-react";

const VoiceReminderProcessingView = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-6 w-6 animate-spin mr-2" />
      <p>Processing your input...</p>
    </div>
  );
};

export default VoiceReminderProcessingView;
