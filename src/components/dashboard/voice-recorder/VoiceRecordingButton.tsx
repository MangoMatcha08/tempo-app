
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceRecordingButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  transcriptSent: boolean;
  onClick: () => void;
}

const VoiceRecordingButton = ({ 
  isRecording, 
  isProcessing, 
  transcriptSent, 
  onClick 
}: VoiceRecordingButtonProps) => {
  return (
    <div className="flex justify-center mb-4">
      <Button
        onClick={onClick}
        disabled={isProcessing || transcriptSent}
        size="lg"
        className={cn(
          "rounded-full h-16 w-16 p-0",
          isRecording 
            ? "bg-red-500 hover:bg-red-600 animate-pulse" 
            : "bg-blue-500 hover:bg-blue-600"
        )}
      >
        {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </Button>
    </div>
  );
};

export default VoiceRecordingButton;
