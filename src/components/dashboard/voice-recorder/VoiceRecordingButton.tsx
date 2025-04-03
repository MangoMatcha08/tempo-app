
import React, { useState, useEffect } from 'react';
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
  const [pressedState, setPressedState] = useState(false);
  
  // Reset pressed state when recording state changes
  useEffect(() => {
    if (!isRecording) {
      setPressedState(false);
    }
  }, [isRecording]);
  
  // Force button to appear pressed when recording
  useEffect(() => {
    if (isRecording && !pressedState) {
      setPressedState(true);
    }
  }, [isRecording, pressedState]);

  return (
    <div className="flex justify-center mb-4">
      <Button
        onClick={(e) => {
          // Prevent multiple rapid clicks
          e.preventDefault();
          if (isProcessing || transcriptSent) return;
          
          // Toggle pressed state for immediate feedback
          setPressedState(!pressedState);
          
          // Delay the actual action slightly for better mobile UX
          setTimeout(() => {
            onClick();
          }, 50);
        }}
        disabled={isProcessing || transcriptSent}
        size="lg"
        className={cn(
          "rounded-full h-20 w-20 p-0 transition-all duration-300 relative",
          isRecording 
            ? "bg-red-500 hover:bg-red-600 shadow-lg scale-105" 
            : isProcessing
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-blue-500 hover:bg-blue-600 shadow-md",
          pressedState && !isProcessing ? "scale-95 opacity-90" : ""
        )}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        aria-pressed={isRecording}
      >
        {/* Enhanced visual feedback */}
        {isProcessing ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : isRecording ? (
          <>
            <Square className="h-8 w-8" />
            {/* More pronounced animated pulse ring */}
            <span className="absolute inset-0 rounded-full animate-ping opacity-75 bg-red-400" />
            {/* Additional inner pulse for better visibility */}
            <span className="absolute inset-2 rounded-full animate-ping opacity-50 bg-red-300" />
          </>
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </Button>
      
      {/* Enhanced touch target with improved feedback */}
      <div 
        className={cn(
          "absolute inset-0 z-10 opacity-0 touch-manipulation flex items-center justify-center",
          (isProcessing || transcriptSent) ? "pointer-events-none" : ""
        )}
        onClick={(e) => {
          // Prevent double events and delay actual click
          e.preventDefault();
          e.stopPropagation();
          
          if (!isProcessing && !transcriptSent) {
            setPressedState(!pressedState);
            
            // Add slight delay for better feedback
            setTimeout(() => {
              onClick();
            }, 100);
          }
        }}
        onTouchStart={(e) => {
          // Add visual feedback on touch
          if (isProcessing || transcriptSent) return;
          
          const target = e.currentTarget;
          target.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
          setPressedState(true);
        }}
        onTouchEnd={(e) => {
          // Prevent default to avoid delays on mobile
          e.preventDefault();
          
          // Reset visual feedback
          const target = e.currentTarget;
          target.style.backgroundColor = "transparent";
          
          if (!isProcessing && !transcriptSent) {
            // We'll reset pressedState after the onClick is processed
            setTimeout(() => {
              onClick();
            }, 50);
          } else {
            setPressedState(false);
          }
        }}
        onTouchCancel={(e) => {
          // Reset visual feedback
          const target = e.currentTarget;
          target.style.backgroundColor = "transparent";
          setPressedState(false);
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
