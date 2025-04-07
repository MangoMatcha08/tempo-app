
import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

interface EnhancedToastsProps {
  // No props needed for this component
}

/**
 * Enhanced toast component with better styling and positioning
 */
const EnhancedToasts = ({}: EnhancedToastsProps) => {
  const { theme = "system" } = useTheme();
  
  return (
    <>
      {/* Standard toast */}
      <Toaster position="bottom-right" />
      
      {/* Notification-specific toast with different positioning */}
      <SonnerToaster
        theme={theme as any}
        position="top-right"
        toastOptions={{
          className: "notification-toast",
          style: {
            background: "var(--background)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          },
          actionButtonStyle: {
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          },
          descriptionStyle: {
            color: "var(--muted-foreground)",
          },
        }}
        closeButton
        richColors
        expand
        id="notification-toaster"
      />
    </>
  );
};

export default EnhancedToasts;
