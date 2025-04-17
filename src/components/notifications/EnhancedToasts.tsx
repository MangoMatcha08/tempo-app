
import React from "react";
import { Toaster } from "sonner";
import { useTheme } from "next-themes";

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
      {/* Standard toast in bottom-right */}
      <Toaster 
        position="bottom-right"
        theme={theme as any}
        className="toast-container"
        toastOptions={{
          style: {
            background: "var(--background)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          },
          classNames: {
            toast: "toast-item",
            title: "text-sm font-semibold",
            description: "text-sm text-muted-foreground",
            actionButton: "bg-primary text-primary-foreground hover:bg-primary/90",
            success: "border-green-500 bg-green-50 dark:bg-green-950/30 dark:border-green-800",
            error: "border-red-500 bg-red-50 dark:bg-red-950/30 dark:border-red-800",
            warning: "border-amber-500 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800",
            info: "border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800"
          }
        }}
        closeButton
        richColors
        expand
      />
      
      {/* Notification-specific toast with different positioning */}
      <Toaster
        position="top-right"
        theme={theme as any}
        className="notification-toast-container"
        toastOptions={{
          style: {
            background: "var(--background)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          },
          classNames: {
            toast: "notification-toast",
            title: "text-sm font-semibold",
            description: "text-sm text-muted-foreground",
            actionButton: "bg-primary text-primary-foreground hover:bg-primary/90",
            success: "border-green-500 bg-green-50 dark:bg-green-950/30 dark:border-green-800",
            error: "border-red-500 bg-red-50 dark:bg-red-950/30 dark:border-red-800",
            warning: "border-amber-500 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800",
            info: "border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800"
          }
        }}
        closeButton
        richColors
        expand
      />
    </>
  );
};

export default EnhancedToasts;
