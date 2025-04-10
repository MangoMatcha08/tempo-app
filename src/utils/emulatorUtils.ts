
/**
 * Firebase Emulator Utilities
 * 
 * This module provides helper functions for working with Firebase emulators
 * during development and testing.
 */

import { isUsingEmulator, testEmulatorConnection } from '@/lib/firebase/functions';
import { useToast } from '@/hooks/use-toast';

/**
 * Check if we're currently in development mode
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if emulator mode is explicitly enabled via env vars
 */
export const isEmulatorModeEnabled = (): boolean => {
  return process.env.VITE_USE_EMULATORS === 'true';
};

/**
 * Hook to verify Firebase emulator connection
 * 
 * @returns Object with verification function and status
 */
export const useEmulatorVerification = () => {
  const { toast } = useToast();
  
  /**
   * Verify connection to Firebase emulators
   */
  const verifyEmulatorConnection = async (): Promise<boolean> => {
    try {
      const result = await testEmulatorConnection();
      
      if (result.success) {
        toast({
          title: "Firebase Connection Status",
          description: `Connected to Firebase ${result.isEmulator ? 'emulators' : 'production'}`,
          variant: "default",
          duration: 3000
        });
        return true;
      } else {
        toast({
          title: "Connection Error",
          description: result.message,
          variant: "destructive",
          duration: 5000
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: `Failed to verify emulator: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 5000
      });
      return false;
    }
  };
  
  return {
    verifyConnection: verifyEmulatorConnection,
    isUsingEmulator: isUsingEmulator(),
    isDevelopment: isDevelopment()
  };
};

/**
 * Get Firebase emulator URLs based on default ports
 */
export const getEmulatorUrls = () => {
  const basePort = window.location.hostname === 'localhost' ? 
    window.location.port : '5000';
  const baseUrl = `${window.location.protocol}//${window.location.hostname}`;
  
  return {
    functions: `${baseUrl}:5001`,
    firestore: `${baseUrl}:8080`,
    auth: `${baseUrl}:9099`,
    ui: `${baseUrl}:4000`
  };
};
