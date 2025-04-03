
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// IMPROVEMENT 5: User Feedback Enhancement
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
          "rounded-full h-20 w-20 p-0 transition-all duration-300 relative",
          isRecording 
            ? "bg-red-500 hover:bg-red-600 shadow-lg" 
            : isProcessing
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-blue-500 hover:bg-blue-600 shadow-md"
        )}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {/* Enhanced visual feedback */}
        {isProcessing ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : isRecording ? (
          <>
            <Square className="h-8 w-8" />
            {/* Animated pulse ring for better visibility during recording */}
            <span className="absolute inset-0 rounded-full animate-ping opacity-75 bg-red-400" />
          </>
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </Button>
      
      {/* Enhanced mobile touch target with improved feedback */}
      <div 
        className={cn(
          "absolute inset-0 z-10 opacity-0 touch-manipulation flex items-center justify-center",
          (isProcessing || transcriptSent) ? "pointer-events-none" : ""
        )}
        onClick={onClick}
        onTouchStart={(e) => {
          // Add visual feedback on touch
          const target = e.currentTarget;
          target.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
        }}
        onTouchEnd={(e) => {
          // Prevent default to avoid delays on mobile
          e.preventDefault();
          
          // Reset visual feedback
          const target = e.currentTarget;
          target.style.backgroundColor = "transparent";
          
          if (!isProcessing && !transcriptSent) {
            onClick();
          }
        }}
        onTouchCancel={(e) => {
          // Reset visual feedback
          const target = e.currentTarget;
          target.style.backgroundColor = "transparent";
        }}
        role="button"
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        tabIndex={0}
      />
      
      {/* Status text for screen readers */}
      <span className="sr-only">
        {isRecording ? "Recording in progress" : 
         isProcessing ? "Processing voice input" : 
         "Tap to start recording"}
      </span>
    </div>
  );
};

export default VoiceRecordingButton;
