
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
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
          "rounded-full h-20 w-20 p-0 transition-all duration-300",
          isRecording 
            ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-lg" 
            : isProcessing
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-blue-500 hover:bg-blue-600 shadow-md"
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : isRecording ? (
          <Square className="h-8 w-8" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </Button>
      
      {/* Mobile-friendly touch target overlay for better touch response */}
      <div 
        className={cn(
          "absolute inset-0 z-10 opacity-0 touch-manipulation",
          (isProcessing || transcriptSent) ? "pointer-events-none" : ""
        )}
        onClick={onClick}
        onTouchEnd={(e) => {
          // Prevent default to avoid delays on mobile
          e.preventDefault();
          if (!isProcessing && !transcriptSent) {
            onClick();
          }
        }}
      />
    </div>
  );
};

export default VoiceRecordingButton;
