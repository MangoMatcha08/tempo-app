
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface DebugInfoPanelProps {
  isPWA: boolean;
  isListening: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  transcriptSent: boolean;
  permissionState: PermissionState | "unknown";
  isMobile: boolean;
  debugInfo: string[];
}

const DebugInfoPanel = ({
  isPWA,
  isListening,
  isRecording,
  isProcessing,
  transcriptSent,
  permissionState,
  isMobile,
  debugInfo
}: DebugInfoPanelProps) => {
  return (
    <details className="mt-4 text-xs text-gray-500 border rounded p-2" open={isPWA}>
      <summary>Debug Info {isPWA && "(PWA Mode)"}</summary>
      <ScrollArea className="h-[100px] mt-2">
        <div className="space-y-1">
          <div>Recognition active: {isListening ? "Yes" : "No"}</div>
          <div>Recording state: {isRecording ? "Recording" : "Stopped"}</div>
          <div>Is processing: {isProcessing ? "Yes" : "No"}</div>
          <div>Transcript sent: {transcriptSent ? "Yes" : "No"}</div>
          <div>Permission state: {permissionState}</div>
          <div>Is mobile device: {isMobile ? "Yes" : "No"}</div>
          <div>Is PWA: {isPWA ? "Yes" : "No"}</div>
          <div>Log:</div>
          <ul className="ml-4 space-y-1">
            {debugInfo.map((info, i) => (
              <li key={i}>{info}</li>
            ))}
          </ul>
        </div>
      </ScrollArea>
    </details>
  );
};

export default DebugInfoPanel;
