
/**
 * Utility functions for PWA mode detection and adjustments
 */

// Check if app is running in standalone mode (PWA)
export const isPwaMode = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches || 
    // @ts-ignore - Property 'standalone' exists on iOS Safari but not in TS types
    window.navigator.standalone === true
  );
};

// Get PWA-adjusted timeout values
export const getPwaAdjustedTimeout = (baseTimeout: number, multiplier: number = 1.5): number => {
  if (isPwaMode()) {
    return Math.round(baseTimeout * multiplier);
  }
  return baseTimeout;
};

// Request microphone access
export const requestMicrophoneAccess = async (): Promise<boolean> => {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Store the stream to prevent it from being garbage collected in PWA
      if (isPwaMode()) {
        (window as any).microphoneStream = stream;
        console.log("Stored microphone stream for PWA");
      } else {
        // Release the stream if not in PWA mode
        stream.getTracks().forEach(track => track.stop());
      }
      
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error requesting microphone access:", err);
    return false;
  }
};

// Release any stored microphone streams
export const releaseMicrophoneStreams = (): void => {
  // Release microphone stream if we stored one
  if ((window as any).microphoneStream) {
    const tracks = (window as any).microphoneStream.getTracks();
    tracks.forEach((track: MediaStreamTrack) => track.stop());
    (window as any).microphoneStream = null;
    console.log("Microphone stream released");
  }
};
