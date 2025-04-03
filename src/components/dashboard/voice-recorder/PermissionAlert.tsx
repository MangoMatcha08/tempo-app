
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PermissionAlertProps {
  permissionState: PermissionState | "unknown";
  onRequestAccess: () => void;
  error?: string;
}

const PermissionAlert = ({ permissionState, onRequestAccess, error }: PermissionAlertProps) => {
  return (
    <div className="space-y-4">
      <Alert variant={permissionState === "denied" ? "destructive" : "default"}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Microphone Access Required</AlertTitle>
        <AlertDescription>
          {permissionState === "denied" 
            ? "Microphone access was denied. Please enable microphone access in your browser settings and try again."
            : "To record voice reminders, you need to grant microphone access."}
        </AlertDescription>
      </Alert>
      
      <div className="text-center">
        <Button 
          onClick={onRequestAccess}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          Enable Microphone Access
        </Button>
      </div>
      
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
};

export default PermissionAlert;
