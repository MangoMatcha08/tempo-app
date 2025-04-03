/**
 * Utility functions for PWA detection and handling
 */

/**
 * Checks if the app is running in PWA/standalone mode
 * @returns boolean indicating if app is running as PWA
 */
export const isPwaMode = (): boolean => {
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches || 
    // @ts-ignore - Property 'standalone' exists on iOS Safari but not in TS types
    window.navigator.standalone === true;
  
  return isStandalone;
};

/**
 * Gets the appropriate timeout duration based on device/mode
 * PWA mode uses longer timeouts for more reliable handling
 * @param baseTime base timeout in ms
 * @param multiplier multiplier for PWA mode (default: 2)
 * @returns adjusted timeout in ms
 */
export const getPwaAdjustedTimeout = (baseTime: number, multiplier: number = 2): number => {
  return isPwaMode() ? baseTime * multiplier : baseTime;
};

/**
 * Request microphone access
 * @returns Promise resolving to boolean indicating if access was granted
 */
export const requestMicrophoneAccess = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // In PWA mode, keep the stream reference to prevent garbage collection
    if (isPwaMode()) {
      (window as any).microphoneStream = stream;
      console.log("Stored microphone stream for PWA");
    }
    
    return true;
  } catch (err) {
    console.error("Error requesting microphone access:", err);
    return false;
  }
};

/**
 * Release any stored microphone streams
 */
export const releaseMicrophoneStreams = (): void => {
  if ((window as any).microphoneStream) {
    const tracks = (window as any).microphoneStream.getTracks();
    tracks.forEach((track: MediaStreamTrack) => track.stop());
    (window as any).microphoneStream = null;
    console.log("Microphone stream released");
  }
};
