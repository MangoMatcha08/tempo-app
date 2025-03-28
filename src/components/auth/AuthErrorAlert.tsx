
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthErrorAlertProps {
  error: string | null;
  firebaseReady: boolean;
}

const AuthErrorAlert: React.FC<AuthErrorAlertProps> = ({ error, firebaseReady }) => {
  if (!firebaseReady) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          Authentication service is temporarily unavailable. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default AuthErrorAlert;
