
import React from 'react';

interface RecordingStatusTextProps {
  isRecording: boolean;
  countdown: number;
  transcriptSent: boolean;
  permissionState: PermissionState | "unknown";
}

const RecordingStatusText = ({ 
  isRecording, 
  countdown, 
  transcriptSent, 
  permissionState 
}: RecordingStatusTextProps) => {
  return (
    <div className="text-sm">
      {isRecording ? (
        <div className="text-red-500 font-semibold">
          Recording... {countdown}s
        </div>
      ) : transcriptSent ? (
        <div className="text-green-500 font-semibold">
          Processing your voice note...
        </div>
      ) : (
        <div>
          {permissionState === "granted" 
            ? "Press to start recording" 
            : "Press to request microphone access and start recording"}
        </div>
      )}
    </div>
  );
};

export default RecordingStatusText;
