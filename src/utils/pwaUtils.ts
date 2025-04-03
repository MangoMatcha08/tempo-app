
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
