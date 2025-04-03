
/**
 * Utility functions for PWA mode detection and adjustments
 */

import { createDebugLogger } from './debugUtils';

const debugLog = createDebugLogger("PWAUtils");

// Check if app is running in standalone mode (PWA)
export const isPwaMode = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches || 
    // @ts-ignore - Property 'standalone' exists on iOS Safari but not in TS types
    window.navigator.standalone === true
  );
};

// Check if device is iOS
export const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window.MSStream);
};

// Get PWA-adjusted timeout values
export const getPwaAdjustedTimeout = (baseTimeout: number, multiplier: number = 1.5): number => {
  let finalMultiplier = multiplier;
  
  if (isPwaMode()) {
    finalMultiplier *= 1.5;
  }
  
  if (isIOSDevice()) {
    finalMultiplier *= 1.3;
  }
  
  return Math.round(baseTimeout * finalMultiplier);
};

// Request microphone access with iOS-specific handling
export const requestMicrophoneAccess = async (): Promise<boolean> => {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      debugLog("Requesting microphone access");
      
      const isIOS = isIOSDevice();
      const isPWA = isPwaMode();
      
      // Get stream with iOS-specific options
      const streamOptions = {
        audio: isIOS ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : true,
        video: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(streamOptions);
      
      debugLog(`Microphone access granted, is iOS: ${isIOS}, is PWA: ${isPWA}`);
      
      // Store the stream to prevent it from being garbage collected in PWA
      if (isPWA || isIOS) {
        (window as any).microphoneStream = stream;
        debugLog("Stored microphone stream for PWA/iOS");
        
        // For iOS PWA, we need to keep the stream active longer
        if (isIOS && isPWA) {
          debugLog("iOS PWA detected, maintaining stream connection");
          // Create an audio context to keep the stream active
          try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
              const audioCtx = new AudioContext();
              const source = audioCtx.createMediaStreamSource(stream);
              // Connect to a silent destination to keep active without audio output
              source.connect(audioCtx.createGain());
              (window as any).audioContext = audioCtx;
              debugLog("Created audio context to maintain stream");
            }
          } catch (err) {
            debugLog(`Error creating audio context: ${err}`);
          }
        }
      } else {
        // For non-PWA on non-iOS, we can release immediately
        // We still store it temporarily so it can be released later if needed
        (window as any).microphoneStream = stream;
      }
      
      return true;
    }
    debugLog("getUserMedia not supported");
    return false;
  } catch (err) {
    console.error("Error requesting microphone access:", err);
    debugLog(`Error requesting microphone access: ${err}`);
    return false;
  }
};

// Release any stored microphone streams
export const releaseMicrophoneStreams = (): void => {
  debugLog("Releasing microphone streams");
  
  // Release audio context if we created one
  if ((window as any).audioContext) {
    try {
      (window as any).audioContext.close();
      (window as any).audioContext = null;
      debugLog("Released audio context");
    } catch (err) {
      debugLog(`Error releasing audio context: ${err}`);
    }
  }
  
  // Release microphone stream if we stored one
  if ((window as any).microphoneStream) {
    try {
      const tracks = (window as any).microphoneStream.getTracks();
      tracks.forEach((track: MediaStreamTrack) => track.stop());
      (window as any).microphoneStream = null;
      debugLog("Microphone stream released");
    } catch (err) {
      debugLog(`Error releasing microphone stream: ${err}`);
    }
  }
};

// Fix for iOS alert variant
export const fixAlertVariantForRefactoredVoiceRecorderView = () => {
  const alertBg = document.querySelector('.bg-amber-50');
  if (alertBg) {
    alertBg.classList.add('bg-amber-50');
    alertBg.classList.add('text-amber-800');
    alertBg.classList.add('border-amber-300');
  }
};
